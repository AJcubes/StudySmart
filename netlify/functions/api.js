import { getStore } from "@netlify/blobs";
import { getTimetable } from "./timetable.js";

export default async (req) => {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const email = url.searchParams.get("email").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const key = url.searchParams.get("key");

    if (!key) {
        return new Response("No key provided", { status: 400 });
    }

    const store = getStore("config")

    if (path === "get") {
        let value = await store.get(email, { type: "json" });
        if (value === null) {
            value = {"email": email};
            await store.setJSON(key, value);
        }
        return new Response(JSON.stringify({ value: value[key] || null }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "set") {
        const { value } = await req.json();
        const current = await store.get(email, { type: "json" });
        current[key] = value;
        await store.setJSON(email, current);
        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "timetable") {
        const content = await getTimetable(email);
        return new Response(JSON.stringify({ content: content }), {
            headers: { "Content-Type": "application/json" }
        })
    }
}

export const config = {
    path: "/api/*"
}
