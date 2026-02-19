import * as actions from "./actions.js";

export default (userToken) => {
  return [
    {
      type: "function",
      function: {
        name: "create_todo_task",
        description: "Create a new task in Microsoft To-Do.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The title of the task" },
            description: { type: "string", description: "Details or description of the task" },
            dueDate: { type: "string", description: "The due date/time in ISO format (YYYY-MM-DDTHH:mm:ss)" },
          },
          required: ["title"],
        },
      },
      execute: async (args) => await actions.createTodoTask(args, userToken),
    },
    {
      type: "function",
      function: {
        name: "schedule_meeting",
        description: "Schedule a meeting or event in the calendar.",
        parameters: {
          type: "object",
          properties: {
            subject: { type: "string", description: "The subject or title of the meeting" },
            description: { type: "string", description: "Agenda or description of the meeting" },
            start: { type: "string", description: "The start time in ISO format (YYYY-MM-DDTHH:mm:ss)" },
            end: { type: "string", description: "The end time in ISO format." },
          },
          required: ["subject", "start"],
        },
      },
      execute: async (args) => await actions.createCalendarEvent(args, userToken),
    },
    {
      type: "function",
      function: {
        name: "create_jira_issue",
        description: "Create a bug report or issue in Jira.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "A brief summary of the issue" },
            description: { type: "string", description: "Detailed description of the bug or issue" },
            projectKey: { type: "string", description: "The project key (e.g., 'PROJ')." },
          },
          required: ["summary"],
        },
      },
      execute: async (args) => await actions.createJiraIssue(args),
    },
  ];
};
