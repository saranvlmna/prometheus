import { google } from "googleapis";
import googleConfig from "../../config/google.config.js";

export default async (req, res) => {
  try {
    const code = req.query.code;

    const oAuth2Client = googleConfig();

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    // @tom need to store refresh_token in DB
    console.log("Tokens:", tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oAuth2Client,
    });

    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: "projects/hackathon-bot-487506/topics/gmail-notifications",
        labelIds: ["INBOX"],
      },
    });

    console.log("Watch activated:", response.data);

    // @tom: To subscribe to Google Chat events programmatically:
    // https://developers.google.com/workspace/chat/workspace-events-api
    /*
    const workspaceevents = google.workspaceevents({ version: 'v1', auth: oAuth2Client });
    const subscription = await workspaceevents.subscriptions.create({
      requestBody: {
        targetResource: `//chat.googleapis.com/users/me/spaces`,
        eventTypes: ['google.workspace.chat.message.v1.created'],
        notificationEndpoint: {
          pubsubTopic: 'projects/your-project/topics/your-topic'
        },
        payloadOptions: { includeResource: true }
      }
    });
    console.log("Chat subscription created:", subscription.data);
    */

    return res.json(response.data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};
