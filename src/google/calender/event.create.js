import { google } from "googleapis";
import oAuth2Client from "../../../config/google.js";

export default async (refreshToken, data) => {
  const oauth2Client = oAuth2Client();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth2Client,
  });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const eventStart = data.start ? new Date(data.start) : new Date(Date.now() + 86400000);
  const eventEnd = data.end ? new Date(data.end) : new Date(eventStart.getTime() + 60 * 60000);

  const event = {
    summary: `📋 Task: ${data.title}`,
    description: data.description || "",
    start: { dateTime: eventStart.toISOString(), timeZone: tz },
    end: { dateTime: eventEnd.toISOString(), timeZone: tz },
    colorId: "6",
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }] },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return response.data;
};
