// Import Netlify blob integration and calendar functions to parse .ics files
import { getStore } from "@netlify/blobs";
import ical from 'node-ical';

// This function fetches the timetable, parses it and returns an HTML string. It has 'export' so that other files can
// use this function.
export async function getTimetable(email) {
    // Set up the store to get user data and find URLs.
    const store = getStore("config");

    // A loop to get the userData within 5 attempts and have a timeout between each try, in case there are some
    // conflicting usages of the Netlify blob data - AI was used for the loop logic. It returns an error HTML string if
    // the user was not found.
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

    // Same type of loop logic to keep retrying (max 5 attempts) until a URL is found in the user's data - AI was used.
    // It returns an error HTML string if no URL was found.
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

    // Fetch the timetable using redirect follow in case it returns a redirect status code. This is specifically useful
    // in platforms like Toddle, which is what this application is designed for. It checks whether the URL and the
    // content is valid, and it is a Toddle URL so that errors don't occur during parsing.
    const timetableResponse = await fetch(url, { redirect: "follow" });
    const content = await timetableResponse.text();

    if (!content ||
        !content.trim().toUpperCase().startsWith("BEGIN:VCALENDAR") ||
        !content.trim().toUpperCase().includes("NAME:TODDLE")) {
        return "<span>Not a Toddle URL...</span>";
    }

    // Parse the timetable and loop through each event.
    const timetable = ical.sync.parseICS(content);
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
                <h6 style="margin: 3px;">Due: ${event.end.toLocaleString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                })}
                </h6>
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

    // Returns the events string if any events were found otherwise it returns an error HTML string.
    return events || "<span>No events found...</span>";
}
