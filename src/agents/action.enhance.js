import createAzureClient from "../../config/azure.openai.js";

const client = createAzureClient();
const deployment = process.env.AZURE_DEPLOYMENT;

export default async (action, description, persona) => {
    try {
        const personaContext = persona
            ? `The user's professional persona:
- Role: ${persona.role}
- Company: ${persona.company || "Not specified"}
- Project Keywords: ${(persona.projectKeywords || []).join(", ") || "Not specified"}
- Tools: ${(persona.tools || []).join(", ") || "Not specified"}`
            : "No professional persona specified.";

        const messages = [
            {
                role: "system",
                content: `You are an expert office assistant specializing in productivity and task management. Your job is to intelligently enhance or transform an action, its type, and its payload based on the user's refinement request and their professional context.

---

## Professional Context
${personaContext}

---

## Current Action
- **Type**: ${action.type}
- **Current Payload**: ${JSON.stringify(action.payload, null, 2)}

---

## Supported Action Types & Their Payload Schemas

\`\`\`json
{ "type": "google_task", "title": "string", "notes": "string", "due_date": "ISO8601 string or null", "priority": "low | medium | high" }
{ "type": "calendar_reminder", "title": "string", "description": "string", "start_time": "ISO8601 string", "end_time": "ISO8601 string", "all_day": "boolean" }
{ "type": "gmail_reply", "subject": "string", "body": "string", "tone": "formal | casual | assertive | empathetic", "to": "email string" }
{ "type": "jira_ticket", "summary": "string", "description": "string", "issue_type": "Bug | Task | Story | Epic", "priority": "Lowest | Low | Medium | High | Highest", "labels": ["string"], "story_points": "string or null", "due_date": "ISO8601 string or null" }
\`\`\`

---

## Your Task

Carefully analyze the user's refinement request. It may ask you to:
1. **Enhance** the current action (improve all payload values, add detail, adjust tone/priority, etc.)
2. **Change the action type** entirely (e.g., convert a google_task into a jira_ticket) — if so, rebuild the payload from scratch according to the new type's schema.

Always use the user's professional context to make the output relevant, specific, and professional.

---

## Output Format

Return a single JSON object with the following fields:

\`\`\`json
{
  "type": "the final action type (may be changed from original)",
  "enhancedPayload": { ... },
  "title": "concise, professional title for the action",
  "description": "clear description of what this action does and why",
  "reasoning": "brief explanation of changes made, including why the type was changed if applicable",
  "typeChanged": true or false
}
\`\`\`

Ensure the \`enhancedPayload\` strictly conforms to the schema of the final \`type\`. Do not include extra fields not defined in the schema.`,
            },
            {
                role: "user",
                content: `Refinement Request: "${description}"

Please analyze my request, determine if the action type should change, and return the fully enhanced action.`,
            },
        ];

        const response = await client.chat.completions.create({
            model: deployment,
            messages,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content);

        return {
            ...action,
            type: result.type ?? action.type,
            payload: result.enhancedPayload,
            context: action.context,
            title: result.title,
            description: result.description,
            reasoning: result.reasoning
        };
    } catch (error) {
        console.error("Action Enhancement Agent Error:", error);
        throw error;
    }
};