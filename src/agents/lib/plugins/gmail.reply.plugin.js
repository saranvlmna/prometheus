import { google } from "googleapis";
import { PLUGIN_LABELS, PLUGIN_TYPES } from "../../../../shared/constants/system.js";

const GmailReplyPlugin = {
  type: PLUGIN_TYPES.GMAIL_REPLY,
  label: PLUGIN_LABELS[PLUGIN_TYPES.GMAIL_REPLY],

  validate(payload) {
    const errors = [];
    if (!payload.to) errors.push("'to' is required");
    if (!payload.subject) errors.push("'subject' is required");
    if (!payload.body) errors.push("'body' is required");
    return { valid: errors.length === 0, errors };
  },

  async execute(payload, context) {
    const { oAuth2Client } = context;
    try {
      const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

      const emailLines = [
        `To: ${payload.to}`,
        `Subject: ${payload.subject}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        payload.body,
      ];
      const email = emailLines.join("\r\n").trim();
      const encodedEmail = Buffer.from(email).toString("base64url");

      const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      });

      return {
        success: true,
        result: {
          messageId: res.data.id,
          threadId: res.data.threadId,
        },
      };
    } catch (error) {
      console.error(error.message);
      return { success: false, error: error.message };
    }
  },
};

export default GmailReplyPlugin;
