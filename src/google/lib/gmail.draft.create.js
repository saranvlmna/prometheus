import { google } from "googleapis";
import googleConfig from "../../../config/google.config.js";


export default async (tokens, draftData) => {
    try {
        const oAuth2Client = googleConfig();
        oAuth2Client.setCredentials(tokens);

        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

        const utf8Subject = `=?utf-8?B?${Buffer.from(draftData.subject).toString('base64')}?=`;
        const messageParts = [
            `Subject: ${utf8Subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=utf-8',
            'Content-Transfer-Encoding: 7bit',
            '',
            draftData.body,
        ];
        const message = messageParts.join('\n');

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: {
                    raw: encodedMessage,
                },
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error creating Gmail draft:", error);
        throw error;
    }
};
