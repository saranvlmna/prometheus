import { google } from "googleapis";
import googleConfig from "../../../config/google.config.js";


export default async (tokens, spaceName, pageSize = 5) => {
    try {
        const oAuth2Client = googleConfig();
        oAuth2Client.setCredentials(tokens);

        const chat = google.chat({ version: "v1", auth: oAuth2Client });

        const response = await chat.spaces.messages.list({
            parent: spaceName,
            pageSize: pageSize,
        });

        return response.data.messages || [];
    } catch (error) {
        console.error("Error listing Google Chat messages:", error);
        throw error;
    }
};
