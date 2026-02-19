import client from "../../config/azure.openai.js";
import { ensureValidToken } from "../../shared/azure/refreshToken.js";
import { SOURSE } from "../../shared/constants/system.js";
import userFindOne from "../user/lib/user.find.one.js";
import { getTools } from "./tools.js";

const deployment = process.env.AZURE_DEPLOYMENT;

export default async (source, eventData) => {
  console.log(`Processing ${source} event using Azure OpenAI Agent`);

  let messageContent = "";
  if (source === SOURSE.TEAMS && eventData.resourceData?.body) {
    messageContent = eventData.resourceData.body.content.replace(/<[^>]*>?/gm, "");
  } else if (source === SOURSE.OUTLOOK) {
    messageContent = eventData.resourceData.body?.content || "No content";
  }

  if (!messageContent) {
    console.log("No content found to process.");
    return;
  }

  let userToken;
  let userId = eventData.user?._id || eventData.userId;

  if (!userId) {
    const user = await userFindOne();
    userId = user?._id;
  }

  if (userId) {
    userToken = await ensureValidToken(userId, "azure");
  }

  const tools = getTools(userToken);

  try {
    const messages = [
      {
        role: "system",
        content: `You are a helpful office assistant. Analyze the user's message and perform the necessary actions using the available tools.
                  If the user wants to create a task, use 'create_todo_task'.
                  If the user wants to schedule a meeting, use 'schedule_meeting'.
                  If the user reports a bug, use 'create_jira_issue'.`,
      },
      { role: "user", content: messageContent },
    ];

    const response = await client.chat.completions.create({
      model: deployment,
      messages,
      tools: tools.map((t) => ({ type: t.type, function: t.function })),
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.tool_calls) {
      messages.push(responseMessage);
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        const toolToExecute = tools.find((t) => t.function.name === toolName);

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
