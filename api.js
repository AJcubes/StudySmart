import { getStore } from "@netlify/blobs";

export default async (req) => {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Handle CORS preflight
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
            const { email, targetUrl } = await req.json();
            if (!email || !targetUrl) {
                return new Response(JSON.stringify({ error: "Missing email or url" }), {
                    status: 400,
                    headers: { ...headers, "Content-Type": "application/json" },
                });
            }

            // Clean email to use as a valid blob key
            const key = email.toLowerCase().replace(/[^a-z0-9]/g, "_");
            await store.setJSON(key, { email, targetUrl, updatedAt: new Date().toISOString() });

            return new Response(JSON.stringify({ success: true, key }), {
                status: 200,
                headers: { ...headers, "Content-Type": "application/json" },
            });
        }

        // 2. GET/FETCH Endpoint (Bypasses CORS & follows redirects server-side)
        if (req.method === "GET" && path === "fetch-url") {
            const targetUrl = url.searchParams.get("url");
            const email = url.searchParams.get("email");

            // If email is passed instead of URL, load URL from Netlify Blobs first
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

            // Fetch target URL server-side (following redirects automatically)
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

export const config = {
    path: "/api/*",
};