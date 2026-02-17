import { azureOpenAIClient as client } from "./lib/azure_openai.js";
import { getTools } from "./tools.js";
import User from "../../database/model/user.js";

const deployment = process.env.AZURE_DEPLOYMENT;

export default async (source, eventData) => {
    console.log(`Processing ${source} event using Azure OpenAI Agent`);

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
    if (eventData.user) {
        userToken = eventData.user.accessToken;
    } else {
        const user = await User.findOne().sort({ updatedAt: -1 });
        userToken = user?.accessToken;
    }

    // Initialize Tools with User Token
    const tools = getTools(userToken);

    try {
        const messages = [
            {
                role: "system",
                content: `You are a helpful office assistant. Analyze the user's message and perform the necessary actions using the available tools.
                  If the user wants to create a task, use 'create_todo_task'.
                  If the user wants to schedule a meeting, use 'schedule_meeting'.
                  If the user reports a bug, use 'create_jira_issue'.`
            },
            { role: "user", content: messageContent }
        ];

        const response = await client.chat.completions.create({
            model: deployment,
            messages,
            tools: tools.map(t => ({ type: t.type, function: t.function })),
            tool_choice: "auto",
        });

        const responseMessage = response.choices[0].message;

        if (responseMessage.tool_calls) {
            messages.push(responseMessage);
            for (const toolCall of responseMessage.tool_calls) {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);
                const toolToExecute = tools.find(t => t.function.name === toolName);

                if (toolToExecute) {
                    console.log(`Executing tool: ${toolName}`, toolArgs);
                    const toolResult = await toolToExecute.execute(toolArgs);
                    messages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: toolName,
                        content: JSON.stringify(toolResult),
                    });
                }
            }

            // Get final response after tool execution
            const secondResponse = await client.chat.completions.create({
                model: deployment,
                messages,
            });
            console.log("Agent Final Response:", secondResponse.choices[0].message.content);
        } else {
            console.log("Agent Response:", responseMessage.content);
        }
    } catch (error) {
        console.error("Azure OpenAI Agent Execution Error:", error);
    }
};
