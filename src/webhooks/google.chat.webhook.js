import listChatMessages from "../google/lib/chat.messages.list.js";
import { runChatAnalysis } from "../agents/chat_analysis.js";
import Action from "../../database/model/action.model.js";
import User from "../../database/model/user.js";
import Subscription from "../../database/model/subscription.js";
import googleConfig from "../../config/google.config.js";

export default async (req, res) => {
    try {
        console.log("[ChatWebhook] Received event");

        const pubsubMessage = req.body.message;
        let event;

        if (pubsubMessage?.data) {
            // Case 1: Pub/Sub delivery (Workspace Events API)
            event = JSON.parse(Buffer.from(pubsubMessage.data, "base64").toString("utf-8"));
        } else {
            // Case 2: Direct HTTP delivery (Google Chat App configuration)
            event = req.body;
        }

        console.log("[ChatWebhook] Event:", JSON.stringify(event, null, 2));

        // Handle space message events
        const isMessageEvent = event.type === "MESSAGE" ||
            event.type === "google.workspace.chat.message.v1.created";

        if (isMessageEvent) {
            const message = event.message;
            const space = event.space;
            const text = message?.text || "No text";

            console.log(`[ChatWebhook] New message in ${space?.name || "unknown space"}: ${text}`);

            // 1. Get User/Tokens
            // Find the most recent user who has a Google subscription (fallback logic)
            // Ideally, we'd map the space or user ID from the event to a specific user.
            const sub = await Subscription.findOne({ provider: "google" }).sort({ lastLogin: -1 });
            if (!sub) {
                console.warn("[ChatWebhook] No user with Google subscription found for processing");
                return res.status(200).send("OK");
            }

            const user = await User.findById(sub.userId);
            const tokens = { access_token: sub.accessToken, refresh_token: sub.refreshToken };

            const oAuth2Client = googleConfig();
            oAuth2Client.setCredentials(tokens);

            // Auto-refresh token if needed
            oAuth2Client.on("tokens", async (newTokens) => {
                if (newTokens.access_token) {
                    await Subscription.findByIdAndUpdate(sub._id, { accessToken: newTokens.access_token });
                    console.log(`[ChatWebhook] Rotated access token`);
                }
            });

            // 2. Fetch last 5 messages for context
            const recentMessages = await listChatMessages(oAuth2Client, space.name, 5);
            const normalizedContext = recentMessages.map(m => ({
                sender: m.sender?.displayName || "Unknown",
                text: m.text,
                timestamp: m.createTime
            }));

            // 3. Analyze with AI Agent
            const analysis = await runChatAnalysis(normalizedContext);
            console.log("[ChatWebhook] Analysis Result:", analysis);

            // 4. If actionable, save as 'pending' using unified Action model
            if (analysis.type === "task" || analysis.type === "mail") {
                const actionType = analysis.type === "task" ? "google_task" : "gmail_reply";

                await Action.create({
                    userId: user._id,
                    source: "google_chat",
                    sourceId: message.name,
                    context: {
                        spaceName: space.name,
                        messageText: text
                    },
                    type: actionType,
                    status: "pending",
                    title: analysis.content,
                    description: analysis.reasoning,
                    payload: { content: analysis.content },
                    reasoning: analysis.reasoning
                });
                console.log(`[ChatWebhook] Pending ${actionType} action saved.`);
            }
        }

        return res.status(200).send("OK");
    } catch (error) {
        console.error("[ChatWebhook] Error:", error);
        return res.status(500).send("Error");
    }
};
