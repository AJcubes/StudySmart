// Import Netlify blob integration and calendar functions to parse .ics files
import ical from 'node-ical';

// This function fetches the timetable, parses it and returns an HTML string. It has 'export' so that other files can
// use this function.
export async function getTimetable(url){
    console.time("getTimetable");

    if (!url) {
        return "<h4>No URL found. Please retry...</h4>";
    }

    console.time("fetching");

    // Fetch the timetable using redirect follow in case it returns a redirect status code. This is specifically useful
    // in platforms like Toddle, which is what this application is designed for. It checks whether the URL and the
    // content is valid, and it is a Toddle URL so that errors don't occur during parsing.
    const timetableResponse = await fetch(url, { redirect: "follow" });
    const content = await timetableResponse.text();

    console.timeEnd("fetching");
    console.time("parsing");

    if (!content ||
        !content.trim().toUpperCase().startsWith("BEGIN:VCALENDAR") ||
        !content.trim().toUpperCase().includes("NAME:TODDLE")) {
        return "<h4>Not a Toddle URL...</h4>";
    }

    // Parse the timetable and loop through each event.
    const timetable = await ical.async.parseICS(content);
    let events = "";

    for (const event of Object.values(timetable)) {
        // Checks if the event type is a VEVENT (which is a .ics scheduled event) and checks if the start date is later
        // than today.
        if (event.type === "VEVENT" && event.start > new Date()) {
            // Gets the description from event.description and the experimental content. It finds the teacher's match
            // and the assignment URL's match from the data using a RegEx search - AI was used.
            const descriptionRaw = event.description || "";
            const htmlRaw = event["ALT-DESC"]?.val || descriptionRaw;
            const teacherMatch = descriptionRaw.match(/Created By:\s*([^\n]+)/i);
            const assignmentMatch = descriptionRaw.match(/View Task:\s*([^\n]+)/i);

            // Creates the teacher and assignment URL part of the HTML with a failsafe.
            const teacher = teacherMatch?.[1]?.trim() ? ` (${teacherMatch[1].trim()})` : "";
            const assignmentURL = assignmentMatch?.[1]?.trim() ?
                `<h5 style="margin: 0;">View Assignment: <a href="${assignmentMatch[1].trim()}"
                                                            target="_blank"
                                                            style="color: #758e96;">${assignmentMatch[1].trim()}</a>
                </h5>` : "";

            // Matches the description from the HTML and parses it - AI was used. It replaces all the extra text and
            // converts it into an HTML string with <p> tags for each newline.
            const htmlMatch = htmlRaw
                .match(/Description(?:<\/b>)?:?\s*([\s\S]*?)(?:<br\s*\/?>\s*<b>\s*Created By|Created By:|$)/i);
            const html = htmlMatch ? htmlMatch[1]
                .replace(/\\"/g, '"')
                .replace(/\\;/g, ';')
                .replace(/\\,/g, ',')
                .replace(/\\/g, '')
                .replace(/&nbsp;/gi, " ")
                .replace(/<\/p>/gi, "\n")
                .replace(/<[^>]+>/g, "")
                .split(/\r?\n/)
                .map(line => line.trim() ? `<p style="margin: 10px;">${line}</p>` : "")
                .filter(line => line)
                .join("\n") : "";

            // Gets the long date if an end is specified in the event otherwise nothing.
            const date = event.end ? `
                <h5 style="margin: 3px;">Due: ${event.end.toLocaleString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                })}
                </h5>
            ` : "";

            // Add the templated HTML to the events string. This template includes inline CSS to match the website so
            // it can be used in an email and in the website.
            events += `
                <div style="margin: 20px 0;
                            padding: 15px;
                            background-color: #f4f4f5;
                            border-radius: 10px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                    <h3 style="margin: 0;">${event.summary || "Untitled Assignment"}${teacher}</h3>
                    ${date}
                    <div style="margin: 25px;">
                        ${html}
                    </div>
                    ${assignmentURL}
                </div>
            `;
        }
    }

    console.timeEnd("parsing");
    console.timeEnd("getTimetable");
    // Returns the events string if any events were found otherwise it returns an error HTML string.
    return events || "<h4>You're free! No homework found...</h4>";
}
