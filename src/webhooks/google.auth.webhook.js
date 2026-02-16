import { google } from "googleapis";
import googleConfig from "../../config/google.config.js";
import User from "../../database/model/user.js";

export default async (req, res) => {
  try {
    const code = req.query.code;

    const oAuth2Client = googleConfig();

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    // Fetch user profile from Google
    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();
    const { id, email, name } = userInfo.data;

    console.log("Google User Info:", userInfo.data);

    // Update or create user in DB
    let user = await User.findOne({ type: "google", providerId: id });
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      user.type = "google";
      user.providerId = id;
      user.accessToken = tokens.access_token;
      user.refreshToken = tokens.refresh_token || user.refreshToken; // Use existing refresh token if not provided
      user.expiry = new Date(tokens.expiry_date);
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        type: "google",
        providerId: id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiry: new Date(tokens.expiry_date),
      });
    }

    console.log("User saved/updated:", user.email);

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
