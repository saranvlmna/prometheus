import { Router } from "express";
import gmailWebhook from "./gmail.webhook.js";
import googleAuthWebhook from "./google.auth.webhook.js";
import slackAuthWebhook from "./slack.auth.webhook.js";
import slackWebhook from "./slack.webhook.js";

const webhookRouter = Router();

webhookRouter.get("/google/auth", googleAuthWebhook);
webhookRouter.post("/gmail", gmailWebhook);
webhookRouter.get("/slack/auth", slackAuthWebhook);
webhookRouter.post("/slack", slackWebhook);
export default webhookRouter;
