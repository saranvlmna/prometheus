import { Router } from "express";
import gmailWebhook from "./gmail.webhook.js";
import outLookWebhook from "./outlook.webhook.js";
import teamsChannelsWebhook from "./teams-channels.webhook.js";
import teamsWebhook from "./teams.webhook.js";

const webhookRouter = Router();

webhookRouter.post("/outlook", outLookWebhook);
webhookRouter.post("/teams", teamsWebhook);
webhookRouter.post("/teams-channels", teamsChannelsWebhook);
webhookRouter.get("/gmail", gmailWebhook);

export default webhookRouter;
