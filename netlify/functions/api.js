// Import necessary functions - Netlify blob integration and timetable.js helper function.
import { getStore } from "@netlify/blobs";
import { getTimetable } from "../../src/js/timetable.js";

// /api/* path function. It has 'export' and 'default' so that other files can access it and won't need to call it by
// name because it is default.
export default async (req) => {
    // Sets up variables found in the request, such as the url of the request, the api path of it, and the params key
    // and email. It takes the email and replaces the non-alphanumerical values with underscores (_) to make it safe to
    // use as a key in Netlify blobs.
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    const key = url.searchParams.get("key");
    const emailRaw = url.searchParams.get("email");
    const email = emailRaw.toLowerCase().replace(/[^a-z0-9]/g, "_");

    // Gets the store "config" from Netlify blobs and uses that throughout the code.
    const store = getStore("config");

    // API path "get". This path lets you get any value from a user's data by taking the user's email and the key. It
    // will return the value of that key. If nothing exists in the user's data, it will create something for the user
    // with only their email in it to make sure that no bugs occur.
    if (path === "get") {
        let value = await store.get(email, { type: "json" });
        if (value === null) {
            value = {"email": emailRaw};
            await store.setJSON(email, value);
        }
        return new Response(JSON.stringify({ value: value[key], success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // API path "set". This path will set any key and its value in the user's data object. It takes an object of the
    // key to value and merges it with the current object set in the user's data. It adds the email attribute to the
    // user's object to make sure no bugs occur later on.
    if (path === "set") {
        const data = await req.json();
        const current = await store.get(email, { type: "json" });
        current["email"] = emailRaw;
        const newData = { ...current, ...data };
        await store.setJSON(email, newData);
        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // API path "timetable". This path takes the user's email and calls the helper function getTimetable from
    // /src/js/timetable.js. It takes the returned HTML content and returns that in an Object.
    if (path === "timetable") {
        const content = await getTimetable(email);
        return new Response(JSON.stringify({ content: content, success: true }), {
            headers: { "Content-Type": "application/json" }
        })
    }
}

// This is to let Netlify know that we have set an api path at /api/* and to make it available as a netlify function.
export const config = {
    path: "/api/*"
}
