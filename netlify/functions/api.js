import { getStore } from "@netlify/blobs";
import { getTimetable } from "./timetable.js";

export default async (req) => {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const emailRaw = url.searchParams.get("email");
    const email = emailRaw.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const key = url.searchParams.get("key");

    const store = getStore("config");

    if (path === "get") {
        let value = await store.get(email, { type: "json" });
        if (value === null) {
            value = {"email": emailRaw};
            await store.setJSON(email, value);
        }
        return new Response(JSON.stringify({ value: value[key] }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "set") {
        const data = await req.json();
        const current = await store.get(email, { type: "json" });
        const newData = { ...current, ...data };
        console.log(JSON.stringify(data), JSON.stringify(current), JSON.stringify(newData));
        await store.setJSON(email, newData);
        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "timetable") {
        const content = await getTimetable(email, store);
        return new Response(JSON.stringify({ content: content }), {
            headers: { "Content-Type": "application/json" }
        })
    }
}

export const config = {
    path: "/api/*"
}
