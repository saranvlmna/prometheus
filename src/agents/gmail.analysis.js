import client from "../../config/azure.openai.js";
import pluginRegistry from "./lib/plugins/plugin.registry.js";

const deployment = process.env.AZURE_DEPLOYMENT;

const buildPrompt = (emailData, userPersona) => {
  const knownTypes = pluginRegistry.getTypes().join(" | ");
  const now = new Date().toISOString();

  return `
    You are an expert email triage agent for professionals.
    Current datetime (ISO 8601, UTC): ${now}

    ═══════════════════════════════════════════
    USER PERSONA
    ═══════════════════════════════════════════
      Role              : ${userPersona?.role}
      Company           : ${userPersona?.company || "not specified"}
      Project Keywords  : ${(userPersona?.projectKeywords || []).join(", ") || "not specified"}
      Tools & Platforms : ${(userPersona?.tools || []).join(", ") || "not specified"}

    CLASSIFICATION RULES:
      1. ROLE — Use the job title as the primary relevance signal. Match email content to
        what that role genuinely cares about. Downgrade anything outside their scope.

      2. INTERNAL vs EXTERNAL — If sender domain matches "${userPersona?.company}", it's
        internal (higher priority). External emails get stricter filtering — downgrade
        cold outreach, newsletters, and vendor spam unless directly actionable.

      3. PROJECT KEYWORDS — Scan subject + body for: ${(userPersona?.projectKeywords || []).join(", ") || "none"}.
        A match boosts importance by one level. Mention the matched keyword in reasoning.

      4. TOOL FILTERING — Only create jira_ticket if Jira is in tools. Notifications from
        tools NOT in the user's stack → "ignore". Notifications from tools they USE:
        informational = "low", requires action/decision = "medium" or "high".
        Never create duplicate actions for the same trigger.

    ═══════════════════════════════════════════
    TASK
    ═══════════════════════════════════════════
    STEP 1 — IMPORTANCE
      "importance": "high" | "medium" | "low" | "ignore"

      high   → Requires prompt action, directly tied to user's role.
      medium → Relevant but not urgent, may need future action.
      low    → Marginally relevant, safe to read later.
      ignore → Not relevant to role, company, or projects.

    STEP 2 — ACTIONS  (only include genuinely warranted actions from: ${knownTypes})

      { type: "google_task",       title, notes, due_date, priority }
      { type: "calendar_reminder", title, description, start_time, end_time, all_day }
      { type: "gmail_reply",       subject, body, tone, to }
      { type: "jira_ticket",       summary, description, issue_type, priority, labels, story_points, due_date }

      - gmail_reply body: professionally written, tone matched to user's role.
      - calendar times: ISO 8601, default end = 30 min after start.
      - jira_ticket: only if Jira is in tools, description in Jira markdown.

    STEP 3 — METADATA
      "summary"   : 1-2 sentence plain-English email summary.
      "reasoning" : explain importance decision — role fit, internal/external, keyword match, tool filter.

    ═══════════════════════════════════════════
    OUTPUT — valid JSON only, no markdown, no extra text:
    ═══════════════════════════════════════════
    {
      "importance": "...",
      "summary": "...",
      "reasoning": "...",
      "actions": [{ "type": "...", "confidence": 0.0-1.0, ...fields }]
    }

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

//   return `
// You are an expert email triage agent for professionals (developers, project managers, CEOs).
// Current datetime (ISO 8601, UTC): ${now}

// ═══════════════════════════════════════════
// USER PERSONA
// ═══════════════════════════════════════════
// You are triaging emails on behalf of the following professional. Use this context to
// determine whether an email is truly relevant to them, and to tailor actions accordingly.

//   Role        : ${userPersona.role}
//   Seniority   : ${userPersona.seniority || "not specified"}
//   Focus Areas : ${(userPersona.focusAreas || []).join(", ") || "not specified"}
//   Tools Used  : ${(userPersona.tools || []).join(", ") || "not specified"}
//   Preferences : ${userPersona.preferences || "none"}

// Use the persona above to:
//   - Downgrade or ignore emails that are irrelevant to this user's role and focus
//   - Prioritize actions that match the user's toolset (e.g. only create jira_ticket if they use Jira)
//   - Adjust tone and detail level of gmail_reply drafts to match their seniority
//   - Skip action types that make no sense for this user (e.g. a CEO rarely needs a Jira ticket)

// ═══════════════════════════════════════════
// TASK
// ═══════════════════════════════════════════
// Analyze the email below and return a structured JSON object.

// STEP 1 — IMPORTANCE
// Decide if this email is actionable/important for a professional.
// Assign:
//   "importance": "high" | "medium" | "low" | "ignore"
//   "audience": array of roles this is most relevant for → ["developer","pm","ceo","designer","qa","devops","all"]

// STEP 2 — MULTI-INTENT DETECTION
// An email can require MULTIPLE actions simultaneously.
// Detect all applicable actions from this set: ${knownTypes}

// For EACH action detected, produce an entry in the "actions" array.

// ACTION SHAPES:
// ─────────────────────────────────────────
// type: "google_task"
//   title       : concise task title
//   notes       : key context from the email
//   due_date    : ISO 8601 if a deadline is mentioned, else null
//   priority    : "high" | "medium" | "low"

// type: "calendar_reminder"
//   title       : event/reminder title
//   description : what the reminder is for
//   start_time  : ISO 8601 datetime (compute from email + current datetime ${now})
//   end_time    : ISO 8601 datetime (default 30 min after start if not specified)
//   all_day     : boolean

// type: "gmail_reply"
//   subject     : reply subject line
//   body        : full professionally written reply email body
//   tone        : "formal" | "friendly" | "urgent"
//   to          : recipient email extracted from the From field

// type: "jira_ticket"
//   summary     : one-line ticket title
//   description : detailed ticket description in Jira markdown
//   issue_type  : "Task" | "Bug" | "Story" | "Epic" | "Subtask"
//   priority    : "Highest" | "High" | "Medium" | "Low" | "Lowest"
//   labels      : array of relevant labels e.g. ["backend","auth","urgent"]
//   story_points: estimated effort (1,2,3,5,8,13) or null
//   due_date    : ISO 8601 if mentioned, else null
// ─────────────────────────────────────────

// STEP 3 — OVERALL METADATA
//   "summary"   : 1-2 sentence plain-English summary of the email
//   "reasoning" : brief explanation of your classification decisions

// ═══════════════════════════════════════════
// OUTPUT FORMAT — return ONLY valid JSON, no markdown, no extra text:
// {
//   "importance": "high" | "medium" | "low" | "ignore",
//   "audience": [...],
//   "summary": "...",
//   "reasoning": "...",
//   "actions": [
//     {
//       "type": "...",
//       "confidence": 0.0-1.0,
//       ... (type-specific fields above)
//     }
//   ]
// }

// If no actions are needed, return "actions": [].

// ═══════════════════════════════════════════
// EMAIL
// ═══════════════════════════════════════════
// From    : ${emailData.from}
// Subject : ${emailData.subject}
// Date    : ${emailData.date || "unknown"}
// Snippet : ${emailData.snippet}
// Body:
// ${emailData.body}
// `;
// };

export const runGmailAnalysis = async (emailData, userPersona) => {
  const prompt = buildPrompt(emailData, userPersona);

  try {
    const azureAiClient = client();

    const completion = await azureAiClient.chat.completions.create({
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
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.actions)) parsed.actions = [];

    parsed.actions = parsed.actions.filter((a) => (a.confidence ?? 1) >= 0.6);
    console.log(parsed);
    return parsed;
  } catch (error) {
    console.error(error);
    return {
      importance: "low",
      summary: "Analysis failed.",
      reasoning: "Error during AI analysis.",
      actions: [],
    };
  }
};
