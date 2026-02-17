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
  // res.status(200).send("OK");
  console.log("[Webhook] Received Pub/Sub message");

  try {
    const pubsubMessage = req.body?.message;
    if (!pubsubMessage?.data) {
      console.warn("[Webhook] Received empty or invalid Pub/Sub message");
      return;
    }

    const decoded = JSON.parse(
      Buffer.from(pubsubMessage.data, "base64").toString("utf-8")
    );
    const { emailAddress, historyId: incomingHistoryId } = decoded;

    console.log(`[Webhook] 📬 Processing Gmail update for ${emailAddress}, historyId: ${incomingHistoryId}`);

    // 1. Load user identity
    const user = await User.findOne({ email: emailAddress });
    if (!user) {
      console.error(`[Webhook] ❌ No user found in database for email: ${emailAddress}`);
      return;
    }
    console.log(`[Webhook] Found user: ${user.name || user.email} (${user._id})`);

    // 2. Load provider credentials (Subscription)
    const sub = await Subscription.findOne({ userId: user._id, provider: "google" });
    if (!sub?.refreshToken) {
      console.error(`[Webhook] ❌ No active Google subscription or refresh token found for user ID: ${user._id}`);
      return;
    }
    console.log(`[Webhook] Subscription verified. Last historyId processed: ${sub.lastHistoryId}`);

    // 3. Build OAuth client
    const oAuth2Client = googleConfig();
    oAuth2Client.setCredentials({
      access_token: sub.accessToken,
      refresh_token: sub.refreshToken,
    });

    // Auto-refresh token if needed
    oAuth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        console.log(`[Webhook] 🔑 Access token expired. Rotating for user: ${emailAddress}`);
        await Subscription.findByIdAndUpdate(sub._id, { accessToken: tokens.access_token });
        console.log(`[Webhook] Rotated access token stored successfully.`);
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // 4. Fetch only NEW message IDs since last processed historyId
    const startHistoryId = sub.lastHistoryId || incomingHistoryId;
    console.log(`[Webhook] Fetching new message IDs since startHistoryId: ${startHistoryId}`);

    const { messageIds, newHistoryId } = await getNewMessageIds(gmail, startHistoryId);

    if (messageIds.length === 0) {
      console.log(`[Webhook] ℹ️ No new messages found to process for ${emailAddress}`);
      // Even if no messages, we might want to update historyId if it's newer
      if (newHistoryId && newHistoryId !== sub.lastHistoryId) {
        await Subscription.findByIdAndUpdate(sub._id, { lastHistoryId: newHistoryId });
        console.log(`[Webhook] Updated historyId to ${newHistoryId} even with no new messages.`);
      }
      return;
    }

    console.log(`[Webhook] Found ${messageIds.length} new message(s) to process. Total batch size: ${messageIds.length}`);

    // Persist new historyId immediately so next webhook has correct starting point
    if (newHistoryId) {
      console.log(`[Webhook] Updating subscription lastHistoryId to: ${newHistoryId}`);
      await Subscription.findByIdAndUpdate(sub._id, { lastHistoryId: newHistoryId });
    }

    // 5. Process each message
    const autoExecute = user.preferences?.autoExecuteActions ?? false;
    console.log(`[Webhook] Starting message processing loop. Auto-execute: ${autoExecute}`);

    for (const [index, messageId] of messageIds.entries()) {
      const batchLabel = `[${index + 1}/${messageIds.length}]`;
      console.log(`[Webhook] ${batchLabel} Processing message ID: ${messageId}`);

      try {
        // Deduplication check
        const alreadyProcessed = await ProcessedEmail.findOne({
          userId: user._id,
          messageId,
        });
        if (alreadyProcessed) {
          console.log(`[Webhook] ${batchLabel} Skipping already-processed message: ${messageId}`);
          continue;
        }

        // Mark as processed immediately (before analysis) to prevent race conditions
        console.log(`[Webhook] ${batchLabel} Marking message ${messageId} as processed in DB...`);
        await ProcessedEmail.create({ userId: user._id, messageId });

        // Fetch full email
        console.log(`[Webhook] ${batchLabel} Triggering email data fetch...`);
        const emailData = await fetchEmailData(gmail, messageId);
        console.log(`[Webhook] ${batchLabel} Analyzing email: "${emailData.subject}" from ${emailData.from}`);

        // Phase 1: AI Analysis
        console.log(`[Webhook] ${batchLabel} Starting Phase 1: AI Analysis...`);
        const analysis = await runGmailAnalysis(emailData);
        console.log(
          `[Webhook] ${batchLabel} Analysis Result → Importance: ${analysis.importance}, ` +
          `Actions: [${analysis.actions.map((a) => a.type).join(", ")}]`
        );

        // Phase 2: Orchestrate actions
        console.log(`[Webhook] ${batchLabel} Starting Phase 2: Action Orchestration...`);
        const report = await orchestrateActions(
          analysis,
          emailData,
          user,
          oAuth2Client,
          { autoExecute }
        );

        console.log(`[Webhook] ${batchLabel} ✅ Processing complete for ${messageId}. Report:`, JSON.stringify(report, null, 2));
      } catch (msgError) {
        // Don't let one message failure kill the entire batch
        console.error(`[Webhook] ${batchLabel} ❌ Failed to process message ${messageId}:`, msgError.stack || msgError.message);
      }
    }
    console.log(`[Webhook] 🏁 Finished processing all ${messageIds.length} messages for ${emailAddress}`);
  } catch (error) {
    console.error("[Webhook] 🚨 FATAL WEBHOOK ERROR:", error.stack || error);
  }
};
