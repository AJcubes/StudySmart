// Import necessary tools, such as the Netlify blobs storage and the timetable formatter from timetable.js
import { getStore } from "@netlify/blobs";
import { getTimetable } from "./timetable.js";

// This function sends an email to each user of their timetable. It has 'export' so that other scripts can use it.
export async function email() {
    // Sets up the store and gets a list of blobs from the store. It returns an error message if no blobs were found.
    const store = getStore("config");
    const { blobs } = await store.list();

    if (!blobs.length) {
        return new Response("No blobs found.");
    }

    // Create a list of promises to send all emails asynchronously - AI was used
    const emails = blobs.map(async (blob) => {
        // Get the user data from Netlify blobs and make sure all data is valid
        const userData = await store.get(blob.key, { type: "json" });

        if (!userData || !userData["email"] || !userData["url"] || !userData["receive_emails"]) {
            return;
        }

        // Get the HTML content of the email using the timetable function from timetable.js
        const content = await getTimetable(blob.key);
        const href = "https://studysmartesf.netlify.app/";
        const src = "https://studysmartesf.netlify.app/src/images/favicon.png";

        // Send the email using brevo and API keys
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
                subject: "StudySmart - To Do",
                htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px;">
                    <div style="display: flex;">
                        <img src="${src}" alt="Logo" style="height: 72px; margin-right: 18px;">
                        <h1>StudySmart</h1>
                    </div>
                    <h2>To Do:</h2>
                    ${content}
                    <h6>Visit the website: <a href="${href}" target="_blank" style="color: #758e96;">${href}</a></h6>
                </div>
                `
            })
        });
    });

    // Wait for all promises to run asynchronously and return a success response
    await Promise.all(emails);

    return new Response("Executed successfully.");
}
