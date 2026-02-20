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

  const event = {
    summary: data.title,
    description: data.description,
    start: {
      dateTime: data.start,
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: data.end,
      timeZone: "Asia/Kolkata",
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return response.data;
};
