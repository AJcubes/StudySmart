import { schedule } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const dailyEmailHandler = async (event, context) => {
    try {
        const store = getStore("user-configs");
        const { blobs } = await store.list();

        if (!blobs || blobs.length === 0) {
            console.log("No users found in blob store.");
            return { statusCode: 200, body: "No users found" };
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

                // Send email using Brevo API key from Netlify Environment Variables
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

        return { statusCode: 200, body: "Cron executed successfully" };
    } catch (err) {
        console.error("Cron execution error:", err.message);
        return { statusCode: 500, body: "Cron failed" };
    }
};

// Runs every day at 4:30 AM UTC, which translates precisely to 12:30 PM HKT
export const handler = schedule("30 4 * * *", dailyEmailHandler);