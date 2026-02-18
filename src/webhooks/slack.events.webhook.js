import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";
import ProcessedEmail from "../../database/model/processed_email.model.js"; // Reuse model for dedup
import { runSlackAnalysis } from "../agents/slack_analysis.js";
import { orchestrateActions } from "../agents/lib/executor/action.orchestrator.js";
import googleConfig from "../../config/google.config.js";

export default async (req, res) => {
    // 1. Handle Slack Challenge
    if (req.body.type === "url_verification") {
        return res.status(200).send(req.body.challenge);
    }

    // ACK immediately to Slack
    res.status(200).send("OK");

    try {
        const { event } = req.body;

        // 2. Filter for message events and ignore bot messages
        if (event.type !== "message" || event.bot_id || event.subtype === "bot_message") {
            return;
        }

        console.log(`[SlackWebhook] 💬 Processing message from user ${event.user} in channel ${event.channel}`);

        // 3. Load user identity
        // For now, we'll try to find a user who has a Slack subscription
        // In a production app, we'd map Slack User ID to our User ID
        // Since we don't have a reliable mapping yet, we'll fetch the first user who connected Slack
        // OR try to find by email if we can get it from Slack (requires more scopes)

        // TEMPORARY: Finding the first user with a Slack subscription for demo purposes
        // Ideally, event.user should be looked up in a SlackUserMapping collection
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

        // 4. Deduplication
        const messageId = event.client_msg_id || event.ts;
        const alreadyProcessed = await ProcessedEmail.findOne({ userId: user._id, messageId });
        if (alreadyProcessed) {
            console.log("[SlackWebhook] Skipping already processed message:", messageId);
            return;
        }
        await ProcessedEmail.create({ userId: user._id, messageId });

        // 5. Build context for AI analysis
        const slackData = {
            user: event.user,
            userId: event.user,
            channel: event.channel,
            ts: event.ts,
            ts_iso: new Date(parseFloat(event.ts) * 1000).toISOString(),
            text: event.text,
        };

        // 6. Phase 1: AI Analysis
        console.log("[SlackWebhook] Starting AI Analysis...");
        const analysis = await runSlackAnalysis(slackData);

        // 7. Phase 2: Action Orchestration
        // If actions require Google access, we need the Google OAuth2 client
        const googleSub = await Subscription.findOne({ userId: user._id, provider: "google" });
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
            ...slackData
        };

        console.log("[SlackWebhook] Orchestrating actions...");
        const report = await orchestrateActions(
            analysis,
            sourceData,
            user,
            oAuth2Client,
            { autoExecute, source: "slack" }
        );

        console.log("[SlackWebhook] Processing complete. Report:", JSON.stringify(report, null, 2));

    } catch (error) {
        console.error("[SlackWebhook] Error processing event:", error.stack || error.message);
    }
};
