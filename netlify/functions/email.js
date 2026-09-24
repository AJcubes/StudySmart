import { getStore } from "@netlify/blobs";
import { getTimetable } from "./timetable.js";

export default async (req) => {
    const store = getStore("config");
    const { blobs } = await store.list();

    if (!blobs.length) {
        return new Response("No blobs found.");
    }

    for (const blob of blobs) {
        const userData = await store.get(blob.key, { type: "json" });

        if (!userData || !userData["url"] || !userData["receive_emails"]) {
            continue;
        }

        const emailContent = await getTimetable(userData["email"]);

        await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: {
                    name: "StudySense",
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [{ email: userData["email"] }],
                subject: "StudySense - To-Do",
                htmlContent: `
                    <h1>StudySense</h1>
                    <h3>To-Do:</h3>
                    ${emailContent}
                `
            })
        });
    }

    return new Response("Executed successfully.");
}

export const config = {
    // schedule: "10 7 * * *"
    schedule: "10 11 * * *"
};
