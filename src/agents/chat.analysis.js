import client from "../../config/azure.openai.js";

const deployment = process.env.AZURE_DEPLOYMENT;

export default async (chatHistory) => {
  try {

    const prompt = `
        You are an expert chat analyst for professionals.
        Current datetime (ISO 8601, UTC): ${new Date().toISOString()}

        ═══════════════════════════════════════════
        USER PERSONA
        ═══════════════════════════════════════════
          Role              : ${userPersona.role || "not specified"}
          Company           : ${userPersona.company || "not specified"}
          Project Keywords  : ${(userPersona.projectKeywords || []).join(", ") || "not specified"}
          Tools & Platforms : ${(userPersona.tools || []).join(", ") || "not specified"}

        CLASSIFICATION RULES:
          1. ROLE — Use the job title to judge if the chat implies an action relevant to this user.
            A developer's task looks different from a PM's or CEO's — calibrate accordingly.

          2. PROJECT KEYWORDS — Scan messages for: ${(userPersona.projectKeywords || []).join(", ") || "none"}.
            A keyword match boosts confidence and should be mentioned in reasoning.

          3. TOOL FILTERING — Only suggest tool-specific actions if that tool is in the user's stack.
            e.g. only suggest a Jira task if Jira is listed in their tools.

          4. COMPANY CONTEXT — Use "${userPersona.company || "unknown"}" to distinguish internal
            team chats from external client/vendor conversations. Internal chats with commitments
            are higher priority than casual external exchanges.

        ═══════════════════════════════════════════
        TASK
        ═══════════════════════════════════════════
        Analyze the last 5 messages of the chat history and classify the intent.

        STEP 1 — CLASSIFICATION
          "type": "task" | "mail" | "none"

          task → Conversation implies a commitment, assignment, or action that needs tracking.
          mail → Conversation suggests a follow-up email or summary needs to be sent.
          none → General chat, social, or no structured action required.

        STEP 2 — CONTENT EXTRACTION (only if type is task or mail)

          For task:
            title    : short descriptive title (max 8 words), tailored to user's role
            notes    : key context and details extracted from the chat
            due_date : ISO 8601 if a deadline is mentioned, else null
            priority : "high" | "medium" | "low" — based on urgency in conversation

          For mail:
            to      : recipient name or identifier if mentioned, else null
            subject : email subject line
            body    : professionally written email body — tone matched to user's role and seniority

        STEP 3 — METADATA
          "confidence" : 0.0–1.0 — how confident you are in this classification
          "reasoning"  : explain the classification — mention role fit, keyword match,
                        tool relevance, and internal/external context if applicable.

        ═══════════════════════════════════════════
        OUTPUT — valid JSON only, no markdown, no extra text:
        ═══════════════════════════════════════════
        {
          "type": "task" | "mail" | "none",
          "confidence": 0.0-1.0,
          "content": {
            // task fields OR mail fields based on type, omit if none
          },
          "reasoning": "..."
        }

        ═══════════════════════════════════════════
        CHAT HISTORY (most recent first)
        ═══════════════════════════════════════════
        ${chatHistory.map((m) => `${m.sender}: ${m.text}`).join("\n")}
            `;



    //   const prompt = `
    //   Analyze the provided chat history (last 5 messages) and classify the intent into one of: 'task', 'mail', or 'none'.

    //   - 'task': If the conversation implies a commitment, assignment, or action that needs tracking.
    //   - 'mail': If the conversation suggests a need to follow up with someone via email or send a summary.
    //   - 'none': If it's general chat, social, or doesn't require structured action.

    //   If you classify as 'task' or 'mail', extract the necessary content in the following JSON format:
    //   {
    //     "type": "task" | "mail" | "none",
    //     "confidence": number,
    //     "content": {
    //       // For task:
    //       "title": "Short descriptive title",
    //       "notes": "Context and details from chat"

    //       // For mail:
    //       "subject": "Email subject",
    //       "body": "Email body content"
    //     },
    //     "reasoning": "Brief explanation of why this classification was chosen"
    //   }

    //   Return ONLY the JSON object.

    //   Chat History (most recent first):
    //   ${chatHistory.map((m) => `${m.sender}: ${m.text}`).join("\n")}
    // `;

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: "You are an expert chat analyst. Respond only with structured JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message.content;
    return JSON.parse(responseText);
  } catch (error) {
    console.error(error);
    return { type: "none", confidence: 0, reasoning: "Error during analysis via Azure OpenAI" };
  }
};
