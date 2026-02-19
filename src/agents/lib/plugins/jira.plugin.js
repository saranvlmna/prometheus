import { PLUGIN_TYPES } from "../../../../shared/constants/system.js";

const JiraPlugin = {
  type: PLUGIN_TYPES.JIRA_TICKET,
  label: [PLUGIN_TYPES.JIRA_TICKET],

  validate(payload) {
    const errors = [];
    if (!payload.summary) errors.push("summary is required");
    if (!payload.issue_type) errors.push("issue_type is required");
    return { valid: errors.length === 0, errors };
  },

  async execute(payload, context) {
    const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY } = process.env;

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
      return { success: false, error: "Jira environment variables not configured." };
    }

    const projectKey = context.jiraProjectKey || JIRA_PROJECT_KEY;
    const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

    const issueBody = {
      fields: {
        project: { key: projectKey },
        summary: payload.summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: payload.description || payload.summary }],
            },
          ],
        },
        issuetype: { name: payload.issue_type || "Task" },
        priority: { name: payload.priority || "Medium" },
        labels: payload.labels || [],
      },
    };

    if (payload.story_points) {
      issueBody.fields["story_points"] = payload.story_points;
    }

    if (payload.due_date) {
      issueBody.fields.duedate = new Date(payload.due_date).toISOString().split("T")[0];
    }

    try {
      const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueBody),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Jira API ${response.status}: ${err}`);
      }

      const data = await response.json();
      return {
        success: true,
        result: {
          issueKey: data.key,
          issueId: data.id,
          issueLink: `${JIRA_BASE_URL}/browse/${data.key}`,
          summary: payload.summary,
        },
      };
    } catch (error) {
      console.error(error.message);
      return { success: false, error: error.message };
    }
  },
};

export default JiraPlugin;
