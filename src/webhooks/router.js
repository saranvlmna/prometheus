import { Router } from "express";
import outLookWebhook from "./outlook.webhook.js";
import teamsWebhook from "./teams.webhook.js";

const webhookRouter = Router();

webhookRouter.get("/outlook", outLookWebhook);
webhookRouter.get("/teams", teamsWebhook);

export default webhookRouter;
