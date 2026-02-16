import listChatMessages from "../google/lib/chat.messages.list.js";
import { runChatAnalysis } from "../agents/chat_analysis.js";
import GoogleAction from "../../database/model/google_action.js";
import User from "../../database/model/user.js";

export default async (req, res) => {
    try {
        console.log("Google Chat Webhook received");

        const pubsubMessage = req.body.message;
        let event;

        if (pubsubMessage?.data) {
            // Case 1: Pub/Sub delivery (Workspace Events API)
            event = JSON.parse(Buffer.from(pubsubMessage.data, "base64").toString("utf-8"));
        } else {
            // Case 2: Direct HTTP delivery (Google Chat App configuration)
            event = req.body;
        }

        console.log("Chat Event:", JSON.stringify(event, null, 2));

        // Handle space message events
        // For Workspace Events API, the type might be 'google.workspace.chat.message.v1.created'
        // For direct Chat App events, the type is 'MESSAGE'
        const isMessageEvent = event.type === "MESSAGE" ||
            event.type === "google.workspace.chat.message.v1.created";

        if (isMessageEvent) {
            const message = event.message;
            const space = event.space;
            const text = message?.text || "No text";

            console.log(`New message in ${space?.name || "unknown space"}: ${text}`);

            // 1. Get User/Tokens (Placeholder logic - @tom to ensure user ID/Email mapping)
            // Assuming we can find the user by email or some mapping from the Chat event
            const user = await User.findOne().sort({ updatedAt: -1 }); // Fallback for demo
            if (!user) {
                console.warn("No user found for processing Chat event");
                return res.status(200).send("OK");
            }

            const tokens = { access_token: user.accessToken, refresh_token: user.refreshToken };

            // 2. Fetch last 5 messages for context
            const recentMessages = await listChatMessages(tokens, space.name, 5);
            const normalizedContext = recentMessages.map(m => ({
                sender: m.sender?.displayName || "Unknown",
                text: m.text,
                timestamp: m.createTime
            }));

            // 3. Analyze with AI Agent
            const analysis = await runChatAnalysis(normalizedContext);
            console.log("Analysis Result:", analysis);

            // 4. If actionable, save as 'pending'
            if (analysis.type === "task" || analysis.type === "mail") {
                const newAction = new GoogleAction({
                    userId: user._id,
                    type: analysis.type,
                    status: "pending",
                    content: analysis.content,
                    reasoning: analysis.reasoning,
                    reference: {
                        spaceName: space.name,
                        messageName: message.name
                    }
                });
                await newAction.save();
                console.log(`Pending ${analysis.type} action saved.`);
            }
        }

        return res.status(200).send("OK");
    } catch (error) {
        console.error("Error in Google Chat Webhook:", error);
        return res.status(500).send("Error");
    }
};
