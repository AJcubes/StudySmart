import { email } from "./email.js";

export default async (request) => {
    return await email();
};

export const config = {
    schedule: "30 7 * * 1-5"
};
