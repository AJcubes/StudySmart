import { getStore } from "@netlify/blobs";

export default async (req) => {
    // Check if this execution is triggered by Netlify's Scheduled Cron Job
    // Scheduled function invocations come as standard background requests without regular UI paths
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.headers.get("x-netlify-scheduled") === "true" || path === "daily-email") {
        return await handleDailyEmailCron();
    }

    // Handle CORS preflight for standard browser requests
    if (req.method === "OPTIONS") {
        return new Response("OK", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    const headers = { "Access-Control-Allow-Origin": "*" };

    try {
        const store = getStore("user-configs");

        // 1. SAVE Endpoint
        if (req.method === "POST" && path === "save") {
            const { email, targetUrl, emailChecked } = await req.json();
            if (!email || !targetUrl) {
                return new Response(JSON.stringify({ error: "Missing email or url" }), {
                    status: 400,
                    headers: { ...headers, "Content-Type": "application/json" },
                });
            }

            const key = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
            await store.setJSON(key, {
                email,
                targetUrl,
                emailChecked: Boolean(emailChecked),
                updatedAt: new Date().toISOString()
            });

            return new Response(JSON.stringify({ success: true, key }), {
                status: 200,
                headers: { ...headers, "Content-Type": "application/json" },
            });
        }

        // 2. GET/FETCH Endpoint (Bypasses CORS & follows redirects server-side)
        if (req.method === "GET" && path === "fetch-url") {
            const targetUrl = url.searchParams.get("url");
            const email = url.searchParams.get("email");

            let finalTargetUrl = targetUrl;
            if (!finalTargetUrl && email) {
                const key = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
                const data = await store.get(key, { type: "json" });
                if (data && data.targetUrl) {
                    finalTargetUrl = data.targetUrl;
                }
            }

            if (!finalTargetUrl) {
                return new Response(JSON.stringify({ error: "No URL found for this user/request" }), {
                    status: 404,
                    headers: { ...headers, "Content-Type": "application/json" },
                });
            }

            const externalRes = await fetch(finalTargetUrl, { redirect: "follow" });
            const textResponse = await externalRes.text();

            return new Response(
                JSON.stringify({
                    fetchedUrl: finalTargetUrl,
                    status: externalRes.status,
                    contentType: externalRes.headers.get("content-type"),
                    body: textResponse,
                }),
                {
                    status: 200,
                    headers: { ...headers, "Content-Type": "application/json" },
                }
            );
        }

        return new Response(JSON.stringify({ error: "Not Found" }), {
            status: 404,
            headers: { ...headers, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...headers, "Content-Type": "application/json" },
        });
    }
};

// Background routine to send daily emails via Brevo
async function handleDailyEmailCron() {
    try {
        const store = getStore("user-configs");
        const { blobs } = await store.list();

        if (!blobs || blobs.length === 0) {
            console.log("No users found in blob store.");
            return new Response("No users found");
        }

        for (const blob of blobs) {
            const userData = await store.get(blob.key, { type: "json" });

            if (!userData || !userData.targetUrl || userData.emailChecked !== true) {
                continue;
            }

            try {
                // Fetch target URL following redirects
                const externalRes = await fetch(userData.targetUrl, { redirect: "follow" });
                const textResponse = await externalRes.text();

                // Send email securely using Brevo API key from Netlify Environment Variables
                const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "api-key": process.env.BREVO_API_KEY
                    },
                    body: JSON.stringify({
                        sender: {
                            name: "Blob URL Notifier",
                            email: userData.email
                        },
                        to: [{ email: userData.email }],
                        subject: "Your Daily URL Fetch Result",
                        textContent: `Here is the latest fetched content for your URL (${userData.targetUrl}):\n\n${textResponse.substring(0, 4000)}`
                    })
                });

                if (!emailRes.ok) {
                    console.error(`Failed to send email via Brevo to ${userData.email}:`, await emailRes.text());
                } else {
                    console.log(`Successfully sent daily update email to ${userData.email}`);
                }
            } catch (innerErr) {
                console.error(`Error processing user ${userData.email}:`, innerErr.message);
            }
        }
        return new Response("Cron executed successfully");
    } catch (err) {
        console.error("Cron execution error:", err.message);
        return new Response("Cron failed", { status: 500 });
    }
}

// Config for wildcard routing + Netlify Daily Cron trigger at 7:00 PM UTC
export const config = {
    path: "/api/*",
    schedule: "0 19 * * *"
};