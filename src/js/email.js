// Import necessary tools, such as the Netlify blobs storage and the timetable formatter from timetable.js
import { getStore } from "@netlify/blobs";
import { getTimetable } from "./timetable.js";

// This function sends an email to each user of their timetable. It has 'export' so that other scripts can use it.
export async function email() {
    // Sets up the store and gets a list of blobs from the store. It returns an error message if no blobs were found.
    const store = getStore("config");
    const { blobs } = await store.list();

    if (!blobs.length) {
        return new Response("No blobs found");
    }

    // Define the website url and the image url. Create the empty users list.
    const href = "https://studysmartesf.netlify.app/";
    const src = "https://studysmartesf.netlify.app/src/images/favicon.png";
    const users = [];

    console.time("chunks");

    // Loop through chunks of 25 users and add valid users to the list - AI was used.
    for (let i = 0; i < blobs.length; i += 25) {
        // Create a chunk
        const chunk = blobs.slice(i, i + 25);

        // Map each chunk's user to get their data
        const results = await Promise.all(
            chunk.map(async blob => {
                const userData = await store.get(blob.key, { type: "json" });

                if (!userData || !userData["email"] || !userData["url"] || !userData["receive_emails"]) {
                    return null;
                }

                const content = await getTimetable(userData["url"]);
                return { email: userData["email"], content: content };
            })
        );

        // Push all users that opt in to emails.
        users.push(...results.filter(Boolean));
    }

    console.timeEnd("chunks");

    // Return an error response if no users were subscribers
    if (!users.length) {
        return new Response("No subscribers found");
    }

    console.time("message");

    // Map each user to create a message for them using their HTML content and email
    const message = users.map(user => ({
        to: [{ email: user["email"] }],
        htmlContent: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px;">
                <div style="display: flex;">
                    <img src="${src}" alt="Logo" style="height: 72px; margin-right: 18px;">
                    <h1>StudySmart</h1>
                </div>
                <h2>To Do:</h2>
                ${user["content"]}
                <h6>Visit the website: <a href="${href}" target="_blank" style="color: #758e96;">${href}</a></h6>
            </div>
        `
    }));

    // Send all the messages at once via Brevo to minimize time spent
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
            subject: "StudySmart - To Do",
            htmlContent: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px;">
                    <div style="display: flex;">
                        <img src="${src}" alt="Logo" style="height: 72px; margin-right: 18px;">
                        <h1>StudySmart</h1>
                    </div>
                    <h6>Visit the website: <a href="${href}" target="_blank" style="color: #758e96;">${href}</a></h6>
                </div>
            `,
            messageVersions: message
        })
    });

    console.timeEnd("message");

    // Return a success response
    return new Response("Executed successfully.");
}
