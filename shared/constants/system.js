export const STATUS = {
  DECLINED: "declined",
  APPROVED: "approved",
  COMPLETED: "completed",
  FAILED: "failed",
  IGNORE: "ignore",
  EXECUTING: "executing",
  PENDING: "pending",
};

export const SUBSCRIPTION = {
  GOOGLE: "google",
  SLACK: "slack",
};

export const ACTION_TYPES = {
  TASK: "task",
  GOOGLE_TASK: "google_task",
  MAIL: "mail",
  MAIL_REPLY: "gmail_reply",
};

export const PLUGIN_TYPES = {
  CALENDAR_REMINDER: "calendar_reminder",
  GMAIL_REPLY: "gmail_reply",
  GOOGLE_TASK: "google_task",
  JIRA_TICKET: "jira_ticket",
};

export const PLUGIN_LABELS = {
  [PLUGIN_TYPES.CALENDAR_REMINDER]: "Google Calendar Reminder",
  [PLUGIN_TYPES.GMAIL_REPLY]: "Gmail Reply",
  [PLUGIN_TYPES.GOOGLE_TASK]: "Google Task",
  [PLUGIN_TYPES.JIRA_TICKET]: "Jira Ticket",
};

export const SOURSE = {
  TEAMS: "teams",
  OUTLOOK: "outlook",
  GMAIL: "gmail",
};
