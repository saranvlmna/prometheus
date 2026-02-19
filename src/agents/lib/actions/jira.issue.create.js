import axios from "axios";

export const createJiraIssue = async (issueDetails) => {
  const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;

  if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error("Missing Jira credentials in environment variables");
  }

  try {
    const response = await axios.post(
      `https://${JIRA_DOMAIN}/rest/api/3/issue`,
      {
        fields: {
          project: {
            key: issueDetails.projectKey || "PROJ",
          },
          summary: issueDetails.summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: issueDetails.description || "Created via AI Agent",
                  },
                ],
              },
            ],
          },
          issuetype: {
            name: "Task",
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );
    return `Jira Issue created successfully. Key: ${response.data.key}`;
  } catch (error) {
    console.error(error.response?.data || error.message);
    throw new Error("Failed to create Jira issue");
  }
};
