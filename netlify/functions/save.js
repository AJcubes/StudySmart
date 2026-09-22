import { getStore } from "@netlify/blobs";

export default async (req) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const { email, url } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ error: "Email is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Open a Netlify Blobs store named "user-data"
        const store = getStore("user-data");

        // Save/Map the email key to the user's data object
        await store.setJSON(email, {
            email: email,
            url: url || "",
            updatedAt: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};