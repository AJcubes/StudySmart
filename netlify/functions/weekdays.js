// Imports the email function from email.js
import { email } from "../../src/js/email.js";

// The main scheduled function that is called by Netlify
export default async (request) => {
    // Runs the email function and returns its response
    return await email();
};

// The config that is read by Netlify for them to know when to run the scheduled function (for weekdays)
export const config = {
    schedule: "30 7 * * 1-5"
};
