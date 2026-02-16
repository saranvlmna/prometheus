import { LlmAgent } from "@google/adk";

export const runGmailAnalysis = async (emailData) => {
    const agent = new LlmAgent({
        name: "gmail_analyst",
        model: "gemini-2.5-flash",
        description: "Analyzes emails to identify tasks or potential follow-up email drafts.",
        instruction: `
      You are an expert at analyzing email content. 
      Analyze the provided email (From, Subject, Body) and classify the intent into one of: 'task', 'mail', or 'none'.
      
      - 'task': If the email implies a commitment, assignment, or action that needs tracking.
      - 'mail': If the email suggests a need to follow up with someone else or send a summary/reply.
      - 'none': If it's a notification, newsletters, or doesn't require structured action.

      If you classify as 'task' or 'mail', extract the necessary content in the following JSON format:
      {
        "type": "task" | "mail" | "none",
        "confidence": number (0 to 1),
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
    `,
    });

    const prompt = `
    Email Data:
    From: ${emailData.from}
    Subject: ${emailData.subject}
    Snippet: ${emailData.snippet}
    Body: ${emailData.body}
  `;

    try {
        const rawResponse = await agent.run(prompt);
        // Cleanup response if LLM wraps it in markdown blocks
        const jsonString = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Gmail Agent Analysis Error:", error);
        return { type: "none", confidence: 0, reasoning: "Error during analysis" };
    }
};
