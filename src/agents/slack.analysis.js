import { azureOpenAIClient as client } from "./lib/azure_openai.js";
import pluginRegistry from "./lib/plugins/plugin.registry.js";

const deployment = process.env.AZURE_DEPLOYMENT;

const buildPrompt = (slackMessages, userPersona) => {
  const knownTypes = pluginRegistry.getTypes().join(" | ");
  const now = new Date().toISOString();

  // The last message in the array is the current one
  const currentMessage = slackMessages[slackMessages.length - 1];
  const history = slackMessages.slice(0, -1);

  const formattedHistory = history.length > 0
    ? history.map(m => `[${m.fromUser}]: ${m.message}`).join("\n")
    : "No previous history.";

  return `
You are an expert chat triage agent for professionals.
Current datetime (ISO 8601, UTC): ${now}

═══════════════════════════════════════════
USER PERSONA
═══════════════════════════════════════════
  Role              : ${userPersona?.role}
  Company           : ${userPersona?.company || "not specified"}
  Project Keywords  : ${(userPersona?.projectKeywords || []).join(", ") || "not specified"}
  Tools & Platforms : ${(userPersona?.tools || []).join(", ") || "not specified"}

═══════════════════════════════════════════
TASK
═══════════════════════════════════════════
Analyze the Slack conversation below and return a structured JSON object.
Focus on the CURRENT MESSAGE to detect actions, using the HISTORY for context if needed.

STEP 1 — IMPORTANCE
Decide if the CURRENT MESSAGE is actionable/important.
Assign:
  "importance": "high" | "medium" | "low" | "ignore"
  "audience": array of roles this is most relevant for → ["developer","pm","ceo","designer","qa","devops","all"]

STEP 2 — MULTI-INTENT DETECTION
Detect all applicable actions from this set: ${knownTypes}

For EACH action detected, produce an entry in the "actions" array.

ACTION SHAPES:
─────────────────────────────────────────
type: "google_task"
  title       : concise task title
  notes       : key context from the message
  due_date    : ISO 8601 if a deadline is mentioned, else null
  priority    : "high" | "medium" | "low"

type: "calendar_reminder"
  title       : event/reminder title
  description : what the reminder is for
  start_time  : ISO 8601 datetime (compute from message + current datetime ${now})
  end_time    : ISO 8601 datetime (default 30 min after start if not specified)
  all_day     : boolean

type: "gmail_reply"
  subject     : appropriate subject line for an email based on this chat context
  body        : full professionally written email body
  tone        : "formal" | "friendly" | "urgent"
  to          : recipient email if mentioned, else null

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
  "summary"   : 1-2 sentence plain-English summary of the current message (contextualized by history)
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
SLACK CONTEXT
═══════════════════════════════════════════
Channel: ${currentMessage.channelName}

HISTORY:
${formattedHistory}

CURRENT MESSAGE (Analyze this for actions):
From: ${currentMessage.fromUser}
To: ${currentMessage.toUser || "Channel"}
Message: ${currentMessage.message}
`;
};

export const runSlackAnalysis = async (slackMessages, userPersona) => {
  const prompt = buildPrompt(slackMessages, userPersona);

  try {
    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content:
            "You are an expert chat triage agent. You always respond with valid JSON only. No markdown fences. No extra text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.actions)) parsed.actions = [];

    parsed.actions = parsed.actions.filter((a) => (a.confidence ?? 1) >= 0.6);
    console.log("[SlackAnalysisAgent] Analysis completed:", parsed);
    return parsed;
  } catch (error) {
    console.error("[SlackAnalysisAgent] Error:", error);
    return {
      importance: "low",
      audience: [],
      summary: "Analysis failed.",
      reasoning: "Error during AI analysis.",
      actions: [],
    };
  }
};
