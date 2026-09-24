import { getStore } from "@netlify/blobs";
import ical from 'node-ical';

export async function getTimetable(email) {
    const store = getStore("config");

    let userData = null;
    let attempts = 0;
    while (!userData && attempts < 5) {
        userData = await store.get(email, { type: "json" });
        if (!userData) {
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
        }
    }
    if (!userData) {
        return "<span>This account doesn't exist...</span>";
    }

    let url = userData["url"];
    attempts = 0;
    while (!url && attempts < 5) {
        userData = await store.get(email, { type: "json" });
        url = userData?.url;
        if (!url) {
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
        }
    }

    const timetableResponse = await fetch(url, { redirect: "follow" });
    const content = await timetableResponse.text();

    const timetable = ical.sync.parseICS(content);
    let events = "";

    for (const event of Object.values(timetable)) {
        if (event.type === "VEVENT" && event.start > new Date()) {
            let descriptionRaw = (event.description || "").replace(/\r?\n[ \t]/g, "").replace(/\\([,;])/g, "$1");
            const teacher = descriptionRaw.match(/Created By:\s*([^\n]+)/i)[1].trim() || "";
            const assignmentURL = descriptionRaw.match(/View Task:\s*([^\n]+)/i)[1].trim() || "";
            const descriptionMatch = descriptionRaw.match(/Description:\s*([\s\S]*?)\s*Created By:/i);
            const description = descriptionMatch ? descriptionMatch[1].replace(/\\n/g, "\n").replace(/[ \t]+/g, " ").trim() : "";
            events += `
                <div>
                    <h3 id="title">${event.summary || "Untitled Assignment"}${teacher ? ` (${teacher})` : ""}</h3>
                    <h6 id="due">Due: ${event.end.toLocaleString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true
                    })}
                    </h6>
                    <div id="details">
                        ${description.split(/\n+/).map(line => `<p>${line}</p>`).join("")}
                    </div>
                    <h5>View Assignment: <a href="${assignmentURL}">${assignmentURL}</a></h5>
                </div>
            `;
        }
    }

    return events;
}
