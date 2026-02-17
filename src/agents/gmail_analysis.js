import { azureOpenAIClient as client } from "./lib/azure_openai.js";
import pluginRegistry from "./lib/plugins/plugin.registry.js";

const deployment = process.env.AZURE_DEPLOYMENT;

// Dynamically build the known action types from registered plugins
const buildPrompt = (emailData) => {
  const knownTypes = pluginRegistry.getTypes().join(" | ");
  const now = new Date().toISOString();

  return `
You are an expert email triage agent for professionals (developers, project managers, CEOs).
Current datetime (ISO 8601, UTC): ${now}

═══════════════════════════════════════════
TASK
═══════════════════════════════════════════
Analyze the email below and return a structured JSON object.

STEP 1 — IMPORTANCE
Decide if this email is actionable/important for a professional.
Assign:
  "importance": "high" | "medium" | "low" | "ignore"
  "audience": array of roles this is most relevant for → ["developer","pm","ceo","designer","qa","devops","all"]

STEP 2 — MULTI-INTENT DETECTION
An email can require MULTIPLE actions simultaneously.
Detect all applicable actions from this set: ${knownTypes}

For EACH action detected, produce an entry in the "actions" array.

ACTION SHAPES:
─────────────────────────────────────────
type: "google_task"
  title       : concise task title
  notes       : key context from the email
  due_date    : ISO 8601 if a deadline is mentioned, else null
  priority    : "high" | "medium" | "low"

type: "calendar_reminder"
  title       : event/reminder title
  description : what the reminder is for
  start_time  : ISO 8601 datetime (compute from email + current datetime ${now})
  end_time    : ISO 8601 datetime (default 30 min after start if not specified)
  all_day     : boolean

type: "gmail_reply"
  subject     : reply subject line
  body        : full professionally written reply email body
  tone        : "formal" | "friendly" | "urgent"
  to          : recipient email extracted from the From field

type: "jira_ticket"
  summary     : one-line ticket title
  description : detailed ticket description in Jira markdown
  issue_type  : "Task" | "Bug" | "Story" | "Epic" | "Subtask"
  priority    : "Highest" | "High" | "Medium" | "Low" | "Lowest"
  labels      : array of relevant labels e.g. ["backend","auth","urgent"]
  story_points: estimated effort (1,2,3,5,8,13) or null
  due_date    : ISO 8601 if mentioned, else null
─────────────────────────────────────────

STEP 3 — OVERALL METADATA
  "summary"   : 1-2 sentence plain-English summary of the email
  "reasoning" : brief explanation of your classification decisions

═══════════════════════════════════════════
OUTPUT FORMAT — return ONLY valid JSON, no markdown, no extra text:
{
  "importance": "high" | "medium" | "low" | "ignore",
  "audience": [...],
  "summary": "...",
  "reasoning": "...",
  "actions": [
    {
      "type": "...",
      "confidence": 0.0-1.0,
      ... (type-specific fields above)
    }
  ]
}

If no actions are needed, return "actions": [].

═══════════════════════════════════════════
EMAIL
═══════════════════════════════════════════
From    : ${emailData.from}
Subject : ${emailData.subject}
Date    : ${emailData.date || "unknown"}
Snippet : ${emailData.snippet}
Body:
${emailData.body}
`;
};

export const runGmailAnalysis = async (emailData) => {
  const prompt = buildPrompt(emailData);

  try {
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content:
            "You are an expert email triage agent. You always respond with valid JSON only. No markdown fences. No extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // low temp for consistent structured output
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);

    // Normalise — ensure actions array always exists
    if (!Array.isArray(parsed.actions)) parsed.actions = [];

    // Filter out low-confidence actions
    parsed.actions = parsed.actions.filter((a) => (a.confidence ?? 1) >= 0.6);
    console.log("[GmailAnalysisAgent] Analysis completed:", parsed);
    return parsed;
  } catch (error) {
    console.error("[GmailAnalysisAgent] Error:", error);
    return {
      importance: "low",
      audience: [],
      summary: "Analysis failed.",
      reasoning: "Error during AI analysis.",
      actions: [],
    };
  }
};
