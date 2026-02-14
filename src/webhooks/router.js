import { Router } from "express";
import outLookWebhook from "./outlook.webhook.js";
import teamsWebhook from "./teams.webhook.js";

const webhookRouter = Router();

webhookRouter.post("/outlook", outLookWebhook);
webhookRouter.post("/teams", teamsWebhook);

export default webhookRouter;
