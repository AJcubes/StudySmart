import { getStore } from "@netlify/blobs";
import { getTimetable } from "./timetable.js";

export async function email() {
    const store = getStore("config");
    const { blobs } = await store.list();

    if (!blobs.length) {
        return new Response("No blobs found.");
    }

    console.log("======== Emails ========");

    for (const blob of blobs) {
        const userData = await store.get(blob.key, { type: "json" });

        if (!userData || !userData["url"] || !userData["receive_emails"]) {
            continue;
        }

        const emailContent = await getTimetable(blob.key);

        await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "api-key": process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                sender: {
                    name: "StudySmart",
                    email: process.env.BREVO_SENDER_EMAIL
                },
                to: [{ email: userData["email"] }],
                subject: "StudySmart - To-Do",
                htmlContent: `
                    <h1>StudySmart</h1>
                    <h3>To-Do:</h3>
                    ${emailContent}
                `
            })
        });

        console.log(userData["email"]);
    }

    console.log("========================");
    return new Response("Executed successfully.");
}
