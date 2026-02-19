import { google } from "googleapis";
import googleConfig from "../../../config/google.js";

export default async (tokens, taskData) => {
  try {
    const oAuth2Client = googleConfig();
    oAuth2Client.setCredentials(tokens);

    const tasks = google.tasks({ version: "v1", auth: oAuth2Client });

    const response = await tasks.tasks.insert({
      tasklist: "@default",
      requestBody: {
        title: taskData.title,
        notes: taskData.notes,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating Google Task:", error);
    throw error;
  }
};
