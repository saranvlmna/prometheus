import { google } from "googleapis";
import googleConfig from "../../../config/google.config.js";

export default async (code) => {
  try {
    const config = googleConfig();

    const { tokens } = await config.getToken(code);

    config.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: config });

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });

    if (!list.data.messages) {
      return [];
    }

    const messages = await Promise.all(
      list.data.messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        const headers = message.data.payload.headers;

        const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";

        const from = headers.find((h) => h.name === "From")?.value || "Unknown Sender";

        let body = "";

        const parts = message.data.payload.parts;

        if (parts) {
          const part = parts.find((p) => p.mimeType === "text/plain");
          if (part?.body?.data) {
            body = Buffer.from(part.body.data, "base64").toString("utf-8");
          }
        } else if (message.data.payload.body?.data) {
          body = Buffer.from(message.data.payload.body.data, "base64").toString("utf-8");
        }

        return {
          id: msg.id,
          from,
          subject,
          snippet: message.data.snippet,
          body,
        };
      }),
    );

    return messages;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
