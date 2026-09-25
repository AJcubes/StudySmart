import { email } from "./email.js";

export default async (request) => {
    return await email();
};

export const config = {
    schedule: "0 2 * * 0,6"
};
