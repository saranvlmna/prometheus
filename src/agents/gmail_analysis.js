import { azureOpenAIClient as client } from "./lib/azure_openai.js";

const deployment = process.env.AZURE_DEPLOYMENT;


export const runGmailAnalysis = async (emailData) => {
  const prompt = `
    Analyze the provided email and classify the intent into one of: 'task', 'mail', or 'none'.
    
    INTENT DEFINITIONS:
    - 'task': The email implies a commitment, assignment, action, or To-Do reminder that needs tracking.
    - 'mail': The email suggests a need to follow up with someone, send a summary, or reply.
    - 'none': General notifications, newsletters, or emails that don't require specific action.

    OUTPUT FORMAT:
    Return ONLY a structured JSON object with this exact shape:
    {
      "type": "task" | "mail" | "none",
      "confidence": number (0 to 1),
      "title": "A concise, actionable title for the event",
      "description": "A brief summary of the action required",
      "content": {
        // If type is 'task':
        "notes": "Context and key points extracted from the email body"
        
        // If type is 'mail':
        "subject": "Suggested email subject for follow-up",
        "body": "A draft of the proposed follow-up email"
      },
      "reasoning": "A short sentence explaining your classification"
    }

    EMAIL DATA:
    From: ${emailData.from}
    Subject: ${emailData.subject}
    Snippet: ${emailData.snippet}
    Body: ${emailData.body}
  `;

  try {
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: "You are an expert email analyst. You always respond with valid, structured JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Azure OpenAI Gmail Agent Analysis Error:", error);
    return { type: "none", confidence: 0, reasoning: "Error during analysis via Azure OpenAI" };
  }
};
