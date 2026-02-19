import { google } from "googleapis";
import googleConfig from "../../config/google.js";
import ProcessedEmail from "../../database/model/email.processed.js";
import { SUBSCRIPTION } from "../../shared/constants/system.js";
import { runGmailAnalysis } from "../agents/gmail.analysis.js";
import actionOrchestrator from "../agents/lib/executor/action.orchestrator.js";
import gmailDataFetch from "../google/gmail/data.fetch.js";
import getNewMessageIds from "../google/gmail/message.ids.get.js";
import subscriptionFind from "../subscription/lib/subscription.find.js";
import subscriptionUpdate from "../subscription/lib/subscription.update.js";
import userFindByEmail from "../user/lib/user.find.by.email.js";

export default async (req, res) => {
  console.log("[Webhook] Received Pub/Sub message");
  res.status(200).send("OK");
  
  try {
    const pubsubMessage = req.body?.message;

    if (!pubsubMessage?.data) {
      console.log("[Webhook] Received empty or invalid Pub/Sub message");
      return;
    }

    const decoded = JSON.parse(Buffer.from(pubsubMessage.data, "base64").toString("utf-8"));
    const { emailAddress, historyId: incomingHistoryId } = decoded;

    console.log(`[Webhook] Processing Gmail update for ${emailAddress}, historyId: ${incomingHistoryId}`);

    const user = await userFindByEmail(emailAddress);
    if (!user) {
      console.error(`[Webhook] No user found in database for email: ${emailAddress}`);
      return;
    }
    console.log(`[Webhook] Found user: ${user.name || user.email} (${user._id})`);

    const subscription = await subscriptionFind(user._id, SUBSCRIPTION.GOOGLE);

    if (!subscription?.refreshToken) {
      console.log(`[Webhook] No active Google subscription or refresh token found for user ID: ${user._id}`);
      return;
    }
    console.log(`[Webhook] Subscription verified. Last historyId processed: ${subscription.lastHistoryId}`);

    const oAuth2Client = googleConfig();
    oAuth2Client.setCredentials({
      access_token: subscription.accessToken,
      refresh_token: subscription.refreshToken,
    });

    oAuth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        console.log(`[Webhook] Access token expired. Rotating for user: ${emailAddress}`);
        await subscriptionUpdate(subscription._id, { accessToken: tokens.access_token });
        console.log(`[Webhook] Rotated access token stored successfully.`);
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const startHistoryId = subscription.lastHistoryId || incomingHistoryId;
    console.log(`[Webhook] Fetching new message IDs since startHistoryId: ${startHistoryId}`);

    const { messageIds, newHistoryId } = await getNewMessageIds(gmail, startHistoryId);

    if (messageIds.length === 0) {
      console.log(`[Webhook] No new messages found to process for ${emailAddress}`);
      if (newHistoryId && newHistoryId !== subscription.lastHistoryId) {
        await subscriptionUpdate(subscription._id, { lastHistoryId: newHistoryId });
        console.log(`[Webhook] Updated historyId to ${newHistoryId} even with no new messages.`);
      }
      return;
    }

    console.log(
      `[Webhook] Found ${messageIds.length} new message(s) to process. Total batch size: ${messageIds.length}`,
    );

    if (newHistoryId) {
      console.log(`[Webhook] Updating subscription lastHistoryId to: ${newHistoryId}`);
      await subscriptionUpdate(subscription._id, { lastHistoryId: newHistoryId });
    }

    const autoExecute = user.preferences?.autoExecuteActions ?? false;
    console.log(`[Webhook] Starting message processing loop. Auto-execute: ${autoExecute}`);

    for (const [index, messageId] of messageIds.entries()) {
      const batchLabel = `[${index + 1}/${messageIds.length}]`;
      console.log(`[Webhook] ${batchLabel} Processing message ID: ${messageId}`);

      try {
        const alreadyProcessed = await ProcessedEmail.findOne({
          userId: user._id,
          messageId,
        });
        if (alreadyProcessed) {
          console.log(`[Webhook] ${batchLabel} Skipping already-processed message: ${messageId}`);
          continue;
        }

        console.log(`[Webhook] ${batchLabel} Marking message ${messageId} as processed in DB...`);
        await ProcessedEmail.create({ userId: user._id, messageId });

        console.log(`[Webhook] ${batchLabel} Triggering email data fetch...`);
        const emailData = await gmailDataFetch(gmail, messageId);
        console.log(`[Webhook] ${batchLabel} Analyzing email: "${emailData.subject}" from ${emailData.from}`);

        console.log(`[Webhook] ${batchLabel} Starting Phase 1: AI Analysis...`);
        const analysis = await runGmailAnalysis(emailData);
        console.log(
          `[Webhook] ${batchLabel} Analysis Result → Importance: ${analysis.importance}, ` +
            `Actions: [${analysis.actions.map((a) => a.type).join(", ")}]`,
        );

        console.log(`[Webhook] ${batchLabel} Starting Phase 2: Action Orchestration...`);
        const report = await actionOrchestrator(analysis, emailData, user, oAuth2Client, { autoExecute });

        console.log(
          `[Webhook] ${batchLabel} Processing complete for ${messageId}. Report:`,
          JSON.stringify(report, null, 2),
        );
      } catch (msgError) {
        console.error(
          `[Webhook] ${batchLabel} Failed to process message ${messageId}:`,
          msgError.stack || msgError.message,
        );
      }
    }
    console.log(`[Webhook] Finished processing all ${messageIds.length} messages for ${emailAddress}`);
  } catch (error) {
    console.error("[Webhook] FATAL WEBHOOK ERROR:", error.stack || error);
  }
};
