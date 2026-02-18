import { google } from "googleapis";
import googleConfig from "../../config/google.config.js";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";

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

    console.log("[GoogleAuth] User Info:", userInfo.data);

    // 1. Manage User (Identity)
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email });
      console.log("[GoogleAuth] Created new user:", email);
    } else {
      console.log("[GoogleAuth] Found existing user:", email);
    }

    // Manage Subscription (Credentials)
    let sub = await Subscription.findOne({ userId: user._id, provider: "google" });

    // Extract toolId from state
    let toolId = null;
    try {
      if (req.query.state) {
        const state = JSON.parse(req.query.state);
        toolId = state.toolId;
      }
    } catch (e) {
      console.error("[GoogleAuth] Failed to parse state:", e.message);
    }

    const subData = {
      userId: user._id,
      provider: "google",
      providerId: id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || sub?.refreshToken,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      lastLogin: new Date(),
    };

    if (sub) {
      Object.assign(sub, subData);
      await sub.save();
      console.log("[GoogleAuth] Updated existing subscription for", email);
    } else {
      sub = await Subscription.create(subData);
      console.log("[GoogleAuth] Created new subscription for", email);
    }

    // 3. Record Tool Connection if toolId is present
    console.log("[GoogleAuth] Processing tool connection. toolId:", toolId, "userId:", user._id);
    if (toolId) {
      const ConnectedTool = (await import("../../database/model/connected-tool.js")).default;
      const result = await ConnectedTool.findOneAndUpdate(
        { userId: user._id, toolId },
        { status: "connected" },
        { upsert: true, new: true }
      );
      console.log("[GoogleAuth] Recorded connection for tool:", toolId, "Result:", result ? "Success" : "Failed");
    } else {
      console.warn("[GoogleAuth] No toolId found in state, skipping tool connection record.");
    }

    // 3. Activate Gmail Watch
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    let gmailWatch = null;
    try {
      const response = await gmail.users.watch({
        userId: "me",
        requestBody: {
          topicName: "projects/prometheus-487614/topics/gmail-notifications",
          labelIds: ["INBOX"],
        },
      });
      gmailWatch = response.data;
      console.log("[GoogleAuth] Gmail Watch activated:", gmailWatch);

      sub.subscriptionId = gmailWatch.historyId; // Storing historyId as an initial point
      await sub.save();
    } catch (watchError) {
      console.error("[GoogleAuth] Failed to activate Gmail watch:", watchError.message);
    }

    // 4. Activate Google Chat Watch
    let chatWatch = "Not attempted";
    try {
      const workspaceevents = google.workspaceevents({ version: "v1", auth: oAuth2Client });
      const chatSub = await workspaceevents.subscriptions.create({
        requestBody: {
          targetResource: `//chat.googleapis.com/users/me/spaces`,
          eventTypes: ["google.workspace.chat.message.v1.created"],
          notificationEndpoint: {
            pubsubTopic: process.env.GOOGLE_CHAT_TOPIC,
          },
          payloadOptions: { includeResource: true },
        },
      });
      chatWatch = chatSub.data;
      console.log("[GoogleAuth] Chat subscription created:", chatWatch);
    } catch (chatWatchError) {
      console.warn("[GoogleAuth] Failed to activate Chat watch:", chatWatchError.message);
    }

    return res.send(`
      <html>
        <body>
          <script>
            console.log("Sending AUTH_SUCCESS to opener...");
            window.opener.postMessage({ 
              type: 'AUTH_SUCCESS', 
              toolId: '${toolId}',
              userId: '${user._id}'
            }, "*");
            window.close();
          </script>
          <p>Authentication successful! This window will close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[GoogleAuth] Error:", error);
    return res.send(`
      <html>
        <body>
          <script>
            console.log("Sending AUTH_ERROR to opener...");
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              error: '${error.message || "Unknown error"}' 
            }, "*");
            window.close();
          </script>
        </body>
      </html>
    `);
  }
};
