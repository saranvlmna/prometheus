import { google } from "googleapis";
import googleConfig from "../../config/google.config.js";
import User from "../../database/model/user.js";
import { runGmailAnalysis } from "../agents/gmail_analysis.js";
import GoogleAction from "../../database/model/google_action.js";

export default async (req, res) => {
  try {
    console.log("Webhook received");

    const pubsubMessage = req.body.message;

    if (!pubsubMessage?.data) {
      return res.status(400).send("No data");
    }

    const decoded = JSON.parse(Buffer.from(pubsubMessage.data, "base64").toString("utf-8"));
    console.log("Decoded Webhook Data:", decoded);

    const { emailAddress, historyId: newHistoryId } = decoded;

    // 1. Get User/Tokens
    const user = await User.findOne({ email: emailAddress, type: "google" });
    if (!user || (!user.accessToken && !user.refreshToken)) {
      console.warn("No user or tokens found for email:", emailAddress);
      return res.status(200).send("OK");
    }

    const oAuth2Client = googleConfig();
    oAuth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Note: In a real-world app, you should store the last processed historyId in DB.
    // For this implementation, we'll try to list recent history records.
    // If you don't have a startHistoryId, this might fail or return nothing useful.
    // Placeholder: Fetching the specific messages mentioned in history if possible,
    // or just fetching the last few emails as context.

    // For demonstration, let's fetch the last few messages to analyze context
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults: 3,
    });

    if (listResponse.data.messages) {
      for (const msg of listResponse.data.messages) {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        const headers = fullMessage.data.payload.headers;
        const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const from = headers.find((h) => h.name === "From")?.value || "Unknown Sender";
        let body = "";

        const parts = fullMessage.data.payload.parts;
        if (parts) {
          const part = parts.find((p) => p.mimeType === "text/plain");
          if (part?.body?.data) {
            body = Buffer.from(part.body.data, "base64").toString("utf-8");
          }
        } else if (fullMessage.data.payload.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString("utf-8");
        }

        const emailData = {
          id: msg.id,
          from,
          subject,
          snippet: fullMessage.data.snippet,
          body,
        };

        // 2. Analyze with AI Agent
        const analysis = await runGmailAnalysis(emailData);
        console.log(`Analysis for email ${msg.id}:`, analysis);

        // 3. If actionable, save as 'pending'
        if ((analysis.type === "task" || analysis.type === "mail") && analysis.confidence > 0.6) {
          const newAction = new GoogleAction({
            userId: user._id,
            title: analysis.title,
            description: analysis.description,
            type: analysis.type,
            status: "pending",
            content: analysis.content,
            reasoning: analysis.reasoning,
            reference: {
              threadId: fullMessage.data.threadId,
              messageId: msg.id
            }
          });
          await newAction.save();
          console.log(`Pending ${analysis.type} action saved for email ${msg.id}.`);
        }
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error");
  }
};
