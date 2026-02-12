import { Router } from "express";
import gmailWebhook from "./gmail.webhook.js";
import teamsWebhook from "./teams.webhook.js";

const webhookRouter = Router();

webhookRouter.get("/gmail", gmailWebhook);
webhookRouter.get("/teams", teamsWebhook);

export default webhookRouter;
