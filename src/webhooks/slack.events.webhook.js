import googleConfig from "../../config/google.config.js";
import ProcessedEmail from "../../database/model/processed_email.model.js"; // Reuse model for dedup
import Subscription from "../../database/model/subscription.js";
import User from "../../database/model/user.js";
import { SUBSCRIPTION } from "../../shared/constants/system.js";
import { orchestrateActions } from "../agents/lib/executor/action.orchestrator.js";
import { runSlackAnalysis } from "../agents/slack_analysis.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";

export default async (req, res) => {
  if (req.body.type === "url_verification") {
    return res.status(200).send(req.body.challenge);
  }

  res.status(200).send("OK");

  try {
    const { event } = req.body;

    if (event.type !== "message" || event.bot_id || event.subtype === "bot_message") {
      return;
    }

    console.log(`[SlackWebhook] 💬 Processing message from user ${event.user} in channel ${event.channel}`);
    const sub = await Subscription.findOne({ provider: "slack" });
    if (!sub) {
      console.warn("[SlackWebhook] No Slack subscription found in DB. Connect Slack first.");
      return;
    }

    const user = await User.findById(sub.userId);
    if (!user) {
      console.error("[SlackWebhook] User not found for subscription.");
      return;
    }

    const messageId = event.client_msg_id || event.ts;
    const alreadyProcessed = await ProcessedEmail.findOne({ userId: user._id, messageId });
    if (alreadyProcessed) {
      console.log("[SlackWebhook] Skipping already processed message:", messageId);
      return;
    }
    await ProcessedEmail.create({ userId: user._id, messageId });

    const slackData = {
      user: event.user,
      userId: event.user,
      channel: event.channel,
      ts: event.ts,
      ts_iso: new Date(parseFloat(event.ts) * 1000).toISOString(),
      text: event.text,
    };

    console.log("[SlackWebhook] Starting AI Analysis...");
    const analysis = await runSlackAnalysis(slackData);

    const googleSub = await subscriptionFind(user._id, SUBSCRIPTION.GOOGLE);
    let oAuth2Client = null;
    if (googleSub) {
      oAuth2Client = googleConfig();
      oAuth2Client.setCredentials({
        access_token: googleSub.accessToken,
        refresh_token: googleSub.refreshToken,
      });
    }

    const autoExecute = user.preferences?.autoExecuteActions ?? false;

    const sourceData = {
      id: messageId,
      subject: `Slack message in ${event.channel}`,
      from: event.user,
      context: {
        channel: event.channel,
        ts: event.ts,
      },
      ...slackData,
    };

    console.log("[SlackWebhook] Orchestrating actions...");
    const report = await orchestrateActions(analysis, sourceData, user, oAuth2Client, { autoExecute, source: "slack" });

    console.log("[SlackWebhook] Processing complete. Report:", JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("[SlackWebhook] Error processing event:", error.stack || error.message);
  }
};
