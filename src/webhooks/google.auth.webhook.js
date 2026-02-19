import { google } from "googleapis";
import googleConfig from "../../config/google.js";
import Tool from "../../database/model/tools.js";
import { SUBSCRIPTION } from "../../shared/constants/system.js";
import subscriptionCreate from "../subscription/lib/subscription.create.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";
import subscriptionUpdate from "../subscription/lib/subscription.update.js";
import userFindByEmail from "../user/lib/user.find.by.email.js";

export default async (req, res) => {
  try {
    const code = req.query.code;
    const oAuth2Client = googleConfig();

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    const { id, email } = userInfo.data;
    let user = await userFindByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    let subscription = await subscriptionFind(user._id, SUBSCRIPTION.GOOGLE);

    const subData = {
      userId: user._id,
      provider: "google",
      providerId: id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || subscription?.refreshToken,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      lastLogin: new Date(),
    };

    if (subscription) {
      Object.assign(subscription, subData);
      await subscriptionUpdate(subscription._id, subData);
    } else {
      subscription = await subscriptionCreate(subData);
    }

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    let gmailWatch = null;

    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: "projects/prometheus-487614/topics/gmail-notifications",
        labelIds: ["INBOX"],
      },
    });
    gmailWatch = response.data;

    subscription.subscriptionId = gmailWatch.historyId;
    await subscriptionUpdate(subscription._id, subscription);

    if (req.query?.state) {
      try {
        const state = JSON.parse(req.query.state);
        const toolId = state?.toolId;
        if (toolId) {
          await Tool.findOneAndUpdate(
            { userId: user._id, toolId },
            { $set: { status: "connected" }, $setOnInsert: { userId: user._id, toolId } },
            { upsert: true, new: true },
          );
          console.log("[GoogleAuth] Recorded connection for toolId:", toolId);
        }
      } catch (e) {
        console.warn("[GoogleAuth] Could not parse state parameter:", e.message);
      }
    }

    return res.json({
      status: "success",
      userId: user._id,
      email: user.email,
      gmailWatch,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
