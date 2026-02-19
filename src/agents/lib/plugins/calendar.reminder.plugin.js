import { google } from "googleapis";
import { PLUGIN_LABELS, PLUGIN_TYPES } from "../../../../shared/constants/system.js";

const CalendarReminderPlugin = {
  type: PLUGIN_TYPES.CALENDAR_REMINDER,
  label: PLUGIN_LABELS[PLUGIN_TYPES.CALENDAR_REMINDER],

  validate(payload) {
    const errors = [];
    if (!payload.title) errors.push("title is required");
    if (!payload.start_time) errors.push("start_time is required");
    return { valid: errors.length === 0, errors };
  },

  async execute(payload, context) {
    const { oAuth2Client } = context;
    try {
      const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

      const startDt = new Date(payload.start_time);
      const endDt = payload.end_time ? new Date(payload.end_time) : new Date(startDt.getTime() + 30 * 60 * 1000);

      const eventBody = payload.all_day
        ? {
            summary: payload.title,
            description: payload.description || "",
            start: { date: startDt.toISOString().split("T")[0] },
            end: { date: endDt.toISOString().split("T")[0] },
          }
        : {
            summary: payload.title,
            description: payload.description || "",
            start: { dateTime: startDt.toISOString(), timeZone: "UTC" },
            end: { dateTime: endDt.toISOString(), timeZone: "UTC" },
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: 30 },
                { method: "email", minutes: 60 },
              ],
            },
          };

      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: eventBody,
      });

      return {
        success: true,
        result: {
          eventId: event.data.id,
          eventLink: event.data.htmlLink,
          title: payload.title,
          start: startDt.toISOString(),
        },
      };
    } catch (error) {
      console.error(error.message);
      return { success: false, error: error.message };
    }
  },
};

export default CalendarReminderPlugin;
