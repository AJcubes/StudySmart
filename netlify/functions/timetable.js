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

    const timetableResponse = await fetch(url, { redirect: "follow" });
    const content = await timetableResponse.text();

    if (!content || !content.trim().toUpperCase().startsWith("BEGIN:VCALENDAR")) {
        return "<span>Invalid URL...</span>";
    }

    const timetable = ical.sync.parseICS(content);
    let events = "";

    for (const event of Object.values(timetable)) {
        if (event.type === "VEVENT" && event.start > new Date()) {
            const descriptionRaw = event.description || "";
            const htmlRaw = event["ALT-DESC"]?.val || descriptionRaw;
            const teacherMatch = descriptionRaw.match(/Created By:\s*([^\n]+)/i);
            const assignmentURLMatch = descriptionRaw.match(/View Task:\s*([^\n]+)/i);

            const teacher = teacherMatch?.[1]?.trim() ? ` (${teacherMatch[1].trim()})` : "";
            const assignmentURL = assignmentURLMatch?.[1]?.trim() ? `<h5>View Assignment: <a href="${assignmentURLMatch[1].trim()}">${assignmentURLMatch[1].trim()}</a></h5>` : "";

            const htmlMatch = htmlRaw.match(/Description(?:<\/b>)?:?\s*([\s\S]*?)(?:<br\s*\/?>\s*<b>\s*Created By|Created By:|$)/i);
            const html = htmlMatch ? htmlMatch[1]
                .replace(/\\"/g, '"')
                .replace(/\\;/g, ';')
                .replace(/\\,/g, ',')
                .replace(/\\/g, '')
                .replace(/&nbsp;/gi, " ")
                .replace(/<\/p>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .split(/\r?\n/)
                .map(line => line.trim() ? `<p>${line}</p>` : "")
                .filter(line => line)
                .join("\n") : "";

            events += `
                <div style="margin: 20px 0; padding: 15px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
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
                        ${html}
                    </div>
                    ${assignmentURL}
                </div>
            `;
        }
    }

    return events || "<span>No events found...</span>";
}
