import { google } from "googleapis";
import googleConfig from "../../config/google.config.js";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";
import ProcessedEmail from "../../database/model/processed_email.model.js";
import { runGmailAnalysis } from "../agents/gmail_analysis.js";
import { orchestrateActions } from "../agents/lib/executor/action.orchestrator.js";
import { getNewMessageIds, fetchEmailData } from "./lib/gmail_fetcher.js";

export default async (req, res) => {
  // Always ACK pub/sub immediately — processing is async
  res.status(200).send("OK");

  try {
    const pubsubMessage = req.body?.message;
    if (!pubsubMessage?.data) return;

    const decoded = JSON.parse(
      Buffer.from(pubsubMessage.data, "base64").toString("utf-8")
    );
    const { emailAddress, historyId: incomingHistoryId } = decoded;

    console.log(`[Webhook] 📬 Received for ${emailAddress}, historyId: ${incomingHistoryId}`);

    // 1. Load user identity
    const user = await User.findOne({ email: emailAddress });
    if (!user) {
      console.warn(`[Webhook] No user found for ${emailAddress}`);
      return;
    }

    // 2. Load provider credentials (Subscription)
    const sub = await Subscription.findOne({ userId: user._id, provider: "google" });
    if (!sub?.refreshToken) {
      console.warn(`[Webhook] No active Google subscription/token for ${emailAddress}`);
      return;
    }

    // 3. Build OAuth client
    const oAuth2Client = googleConfig();
    oAuth2Client.setCredentials({
      access_token: sub.accessToken,
      refresh_token: sub.refreshToken,
    });

    // Auto-refresh token if needed
    oAuth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        await Subscription.findByIdAndUpdate(sub._id, { accessToken: tokens.access_token });
        console.log(`[Webhook] Rotated access token for ${emailAddress}`);
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // 4. Fetch only NEW message IDs since last processed historyId
    const startHistoryId = sub.lastHistoryId || incomingHistoryId;
    const { messageIds, newHistoryId } = await getNewMessageIds(gmail, startHistoryId);

    if (messageIds.length === 0) {
      console.log(`[Webhook] No new messages for ${emailAddress}`);
      return;
    }

    console.log(`[Webhook] ${messageIds.length} new message(s) to process`);

    // Persist new historyId immediately so next webhook has correct starting point
    if (newHistoryId) {
      await Subscription.findByIdAndUpdate(sub._id, { lastHistoryId: newHistoryId });
    }

    // 5. Process each message
    const autoExecute = user.preferences?.autoExecuteActions ?? false;

    for (const messageId of messageIds) {
      try {
        // Deduplication check
        const alreadyProcessed = await ProcessedEmail.findOne({
          userId: user._id,
          messageId,
        });
        if (alreadyProcessed) {
          console.log(`[Webhook] Skipping already-processed message: ${messageId}`);
          continue;
        }

        // Mark as processed immediately (before analysis) to prevent race conditions
        await ProcessedEmail.create({ userId: user._id, messageId });

        // Fetch full email
        const emailData = await fetchEmailData(gmail, messageId);
        console.log(`[Webhook] Analyzing: "${emailData.subject}" from ${emailData.from}`);

        // Phase 1: AI Analysis
        const analysis = await runGmailAnalysis(emailData);
        console.log(
          `[Webhook] Analysis → importance: ${analysis.importance}, ` +
          `actions: [${analysis.actions.map((a) => a.type).join(", ")}]`
        );

        // Phase 2: Orchestrate actions
        const report = await orchestrateActions(
          analysis,
          emailData,
          user,
          oAuth2Client,
          { autoExecute }
        );

        console.log(`[Webhook] ✅ Report for ${messageId}:`, JSON.stringify(report, null, 2));
      } catch (msgError) {
        // Don't let one message failure kill the entire batch
        console.error(`[Webhook] ❌ Failed for message ${messageId}:`, msgError.message);
      }
    }
  } catch (error) {
    console.error("[Webhook] Fatal error:", error);
  }
};
