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
        return "<span>No URL found for this account...</span>";
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

    if (!url) {
        return "<span>No URL found for this account...</span>";
    }

    try {
        const timetableResponse = await fetch(url, {redirect: "follow"});
        const content = await timetableResponse.text();

        const timetable = ical.sync.parseICS(content);
        let events = "";

        for (const event of Object.values(timetable)) {
            if (event.type === "VEVENT" && event.start > new Date()) {
                let descriptionRaw = event.description || "";
                const teacherMatch = descriptionRaw.match(/Created By:\s*([^\n]+)/i);
                const assignmentURLMatch = descriptionRaw.match(/View Task:\s*([^\n]+)/i);

                const teacher = teacherMatch?.[1]?.trim() ? ` (${teacherMatch[1].trim()})` : "";
                const assignmentURL = assignmentURLMatch?.[1]?.trim() ? `<h5>View Assignment: <a href="${assignmentURLMatch[1].trim()}">${assignmentURLMatch[1].trim()}</a></h5>` : "";

                const descriptionMatch = descriptionRaw.match(/Description:\s*([\s\S]*?)\s*Created By:/i);
                const description = descriptionMatch ? descriptionMatch[1].replace(/\\n/g, "\n").replace(/[ \t]+/g, " ").trim() : "";
                events += `
                    <div style="border: solid black;">
                        <h3 id="title">${event.summary || "Untitled Assignment"}${teacher}</h3>
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
                            ${description.split(/\r?\n/).map(line => line.trim() ? `<p>${line.trim()}</p>` : "").join("")}
                        </div>
                        ${assignmentURL}
                    </div>
                `;
            }
        }
    } catch {
        return "<span>Invalid URL...</span>";
    }

    return events;
}
