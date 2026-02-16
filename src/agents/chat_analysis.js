import { LlmAgent, Runner, InMemorySessionService, isFinalResponse } from "@google/adk";

export const runChatAnalysis = async (chatHistory) => {
  const sessionService = new InMemorySessionService();
  const agent = new LlmAgent({
    name: "chat_analyst",
    model: "gemini-2.5-flash",
    description: "Analyzes chat conversations to identify tasks or email drafting needs.",
    instruction: `
      You are an expert at analyzing chat conversations.
      Analyze the provided chat history (last 5 messages) and classify the intent into one of: 'task', 'mail', or 'none'.

      - 'task': If the conversation implies a commitment, assignment, or action that needs tracking.
      - 'mail': If the conversation suggests a need to follow up with someone via email or send a summary.
      - 'none': If it's general chat, social, or doesn't require structured action.

      If you classify as 'task' or 'mail', extract the necessary content in the following JSON format:
      {
        "type": "task" | "mail" | "none",
        "confidence": number,
        "content": {
          // For task:
          "title": "Short descriptive title",
          "notes": "Context and details from chat"

          // For mail:
          "subject": "Email subject",
          "body": "Email body content"
        },
        "reasoning": "Brief explanation of why this classification was chosen"
      }

      Return ONLY the JSON object.
    `,
  });

  const appName = "chat_analysis_app";
  const userId = "system";
  const sessionId = "current_chat";

  const runner = new Runner({
    agent,
    appName,
    sessionService
  });

  const prompt = `Chat History (most recent first):\n${chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}`;

  try {
    await sessionService.createSession({
      appName,
      userId,
      sessionId
    });

    const events = runner.runAsync({
      userId,
      sessionId,
      newMessage: { role: "user", parts: [{ text: prompt }] }
    });

    let finalAnswer = "";
    for await (const event of events) {
      if (isFinalResponse(event) && event.content?.parts?.[0]?.text) {
        finalAnswer = event.content.parts[0].text;
      }
    }

    if (!finalAnswer) return { type: "none", confidence: 0, reasoning: "No response from agent" };

    // Cleanup response if LLM wraps it in markdown blocks
    const jsonString = finalAnswer.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Agent Analysis Error:", error);
    return { type: "none", confidence: 0, reasoning: "Error during analysis" };
  }
};
