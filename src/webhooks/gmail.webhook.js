import { google } from "googleapis";
import googleConfig from "../../config/google.config.js";

export default async (req, res) => {
  try {
    console.log("Webhook received");

    const pubsubMessage = req.body.message;

    if (!pubsubMessage?.data) {
      return res.status(400).send("No data");
    }

    const decoded = JSON.parse(Buffer.from(pubsubMessage.data, "base64").toString("utf-8"));
    console.log("decoded", decoded);
    console.log("pubsubMessage", pubsubMessage);

    const newHistoryId = decoded.historyId;

    // const oAuth2Client = googleConfig();

    // oAuth2Client.setCredentials({
    //   refresh_token: "USER_REFRESH_TOKEN_FROM_DB",
    // });

    // const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // const history = await gmail.users.history.list({
    //   userId: "me",
    //   startHistoryId: "LAST_STORED_HISTORY_ID",
    //   historyTypes: ["messageAdded"],
    // });

    // const messages = [];

    // if (history.data.history) {
    //   for (const record of history.data.history) {
    //     if (record.messagesAdded) {
    //       for (const msg of record.messagesAdded) {
    //         const fullMessage = await gmail.users.messages.get({
    //           userId: "me",
    //           id: msg.message.id,
    //         });

    //         messages.push(fullMessage.data);
    //       }
    //     }
    //   }
    // }

    // console.log("New Messages:", messages);

    // // Update stored historyId in DB
    // // save newHistoryId

    // return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error");
  }
};
