import ical from 'node-ical';

export async function getTimetable(email, store) {
    const userData = store.get(email, { type: "json" });
    let url = userData["url"];

    console.log(JSON.stringify(userData), url);

    if (!url) {
        return "<span>No URL found for this account...</span>"
    }

    const timetableResponse = await fetch(url, { redirect: "follow" });
    const content = await timetableResponse.text();

    const timetable = ical.sync.parseICS(content);
    let events = "";

    for (const event in Object.values(timetable)) {
        if (event.type === "VEVENT" && event.start > new Date()) {
            let descriptionRaw = (event.description || "").replace(/\r?\n[ \t]/g, "").replace(/\\([,;])/g, "$1");
            const teacher = descriptionRaw.match(/Created By:\s*([^\n]+)/i)[1].trim() || "";
            const assignmentURL = descriptionRaw.match(/View Task:\s*([^\n]+)/i)[1].trim() || "";
            const description = descriptionRaw.match(/Description:\s*([\s\S]*?)\s*Created By:/i)[1].replace(/\\n/g, "\n").replace(/[ \t]+/g, " ").trim() || "";
            events += `
                <div>
                    <h3 id="title">${event.summary || "Untitled Assignment"}${teacher ? ` (${teacher})` : ""}</h3>
                    <h6 id="due">Due on ${event.end.toLocaleString("en-GB", {
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
                    <h5>View Assignment: ${assignmentURL}</h5>
                </div>
            `;
        }
    }

    return events;
}
