import { Router } from "express";
import gmailWebhook from "./gmail.webhook.js";
import googleAuthWebhook from "./google.auth.webhook.js";
import outLookWebhook from "./outlook.webhook.js";
import teamsChannelsWebhook from "./teams-channels.webhook.js";
import teamsWebhook from "./teams.webhook.js";
import googleChatWebhook from "./google.chat.webhook.js";
import { getActions, updateActionStatus } from "../google/google_actions.controller.js";

const webhookRouter = Router();

webhookRouter.post("/outlook", outLookWebhook);
webhookRouter.post("/teams", teamsWebhook);
webhookRouter.post("/teams-channels", teamsChannelsWebhook);
webhookRouter.get("/google/auth", googleAuthWebhook);
webhookRouter.post("/gmail", gmailWebhook);
webhookRouter.post("/google/chat", googleChatWebhook);

// Google Actions Approval API
webhookRouter.get("/google/actions", getActions);
webhookRouter.post("/google/actions/:id/status", updateActionStatus);

export default webhookRouter;
