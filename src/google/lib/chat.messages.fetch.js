import { google } from "googleapis";
import googleConfig from "../../../config/google.config.js";

export default async (tokens, messageName) => {
    try {
        const oAuth2Client = googleConfig();
        oAuth2Client.setCredentials(tokens);

        const chat = google.chat({ version: "v1", auth: oAuth2Client });

        const response = await chat.spaces.messages.get({
            name: messageName,
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching Google Chat message:", error);
        throw error;
    }
};
