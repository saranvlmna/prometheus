import { Router } from "express";
import gmailWebhook from "./gmail.webhook.js";
import googleAuthWebhook from "./google.auth.webhook.js";

const webhookRouter = Router();

webhookRouter.get("/google/auth", googleAuthWebhook);
webhookRouter.post("/gmail", gmailWebhook);

export default webhookRouter;
