import { azureOpenAIClient as client } from "./lib/azure_openai.js";

const deployment = process.env.AZURE_DEPLOYMENT;

export const runChatAnalysis = async (chatHistory) => {
  const prompt = `
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

    Chat History (most recent first):
    ${chatHistory.map(m => `${m.sender}: ${m.text}`).join('\n')}
  `;

  try {
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: "You are an expert chat analyst. Respond only with structured JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Azure OpenAI Chat Analysis Error:", error);
    return { type: "none", confidence: 0, reasoning: "Error during analysis via Azure OpenAI" };
  }
};
