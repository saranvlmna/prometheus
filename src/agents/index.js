import { LlmAgent, Runner, InMemorySessionService, isFinalResponse } from "@google/adk";
import { getTools } from "./tools.js";
import User from "../../database/model/user.js";

export default async (source, eventData) => {
    console.log(`Processing ${source} event using @google/adk Agent`);
    const sessionService = new InMemorySessionService();

    let messageContent = "";
    // Extract content
    if (source === "teams" && eventData.resourceData?.body) {
        messageContent = eventData.resourceData.body.content.replace(/<[^>]*>?/gm, '');
    } else if (source === "outlook") {
        messageContent = eventData.resourceData.body?.content || "No content";
    }

    if (!messageContent) {
        console.log("No content found to process.");
        return;
    }

    // Get User for Graph Token
    let userToken;
    let userId = "unknown_user";
    if (eventData.user) {
        userToken = eventData.user.accessToken;
        userId = eventData.user.id || eventData.user.email || userId;
    } else {
        const user = await User.findOne().sort({ updatedAt: -1 });
        userToken = user?.accessToken;
        userId = user?._id.toString() || userId;
    }

    // Initialize Tools with User Token
    const agentTools = getTools(userToken);

    // Initialize Agent
    const agent = new LlmAgent({
        name: "productivity_assistant",
        model: "gemini-pro",
        description: "Helps users manage tasks, meetings, and issues.",
        instruction: `You are a helpful office assistant. Analyze the user's message and perform the necessary actions using the available tools.
                  If the user wants to create a task, use 'create_todo_task'.
                  If the user wants to schedule a meeting, use 'schedule_meeting'.
                  If the user reports a bug, use 'create_jira_issue'.`,
        tools: agentTools,
    });

    const appName = "productivity_app";
    const sessionId = `session_${source}_${eventData.id || "default"}`;

    const runner = new Runner({
        agent,
        appName,
        sessionService
    });

    console.log("Analyzing content:", messageContent);

    try {
        await sessionService.createSession({
            appName,
            userId,
            sessionId
        });

        const events = runner.runAsync({
            userId,
            sessionId,
            newMessage: { role: "user", parts: [{ text: messageContent }] }
        });

        for await (const event of events) {
            if (isFinalResponse(event) && event.content?.parts?.[0]?.text) {
                console.log("Agent Final Response:", event.content.parts[0].text);
            }
        }
    } catch (error) {
        console.error("Agent Execution Error:", error);
    }
};
