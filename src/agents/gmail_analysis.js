import { azureOpenAIClient as client } from "./lib/azure_openai.js";

const deployment = process.env.AZURE_DEPLOYMENT;

/**
 * Gmail Analysis Agent to determine intent and extract structured data from emails using Azure OpenAI.
 */
export const runGmailAnalysis = async (emailData) => {
  const prompt = `
    Analyze the provided email (From, Subject, Body) and classify the intent into one of: 'task', 'mail', or 'none'.
    
    - 'task': If the email implies a commitment, assignment, action or ToDo reminder that needs tracking.
    - 'mail': If the email suggests a need to follow up with someone else or send a summary/reply.
    - 'none': If it's a notification, newsletters, or doesn't require structured action.

    If you classify as 'task' or 'mail', extract the necessary content in the following JSON format:
    {
      "type": "task" | "mail" | "none",
      "confidence": number,
      "title": "Short Title about the action",
      "description": "Short description about the action",
      "content": {
        // For task:
        "title": "Short descriptive title based on email",
        "notes": "Context and key points extracted from the email body"
        
        // For mail:
        "subject": "Email subject for the draft",
        "body": "Proposed email body content for follow-up"
      },
      "reasoning": "Brief explanation of why this classification was chosen"
    }

    Return ONLY the JSON object.

    Email Data:
    From: ${emailData.from}
    Subject: ${emailData.subject}
    Snippet: ${emailData.snippet}
    Body: ${emailData.body}
  `;

  try {
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: "You are an expert email analyst. Respond only with structured JSON." },
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
