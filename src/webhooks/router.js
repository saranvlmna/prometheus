import { Router } from "express";
import gmailWebhook from "./gmail.webhook.js";
import googleAuthWebhook from "./google.auth.webhook.js";
import outLookWebhook from "./outlook.webhook.js";
import teamsChannelsWebhook from "./teams-channels.webhook.js";
import teamsWebhook from "./teams.webhook.js";


const webhookRouter = Router();

/**
 * @swagger
 * /webhook/outlook:
 *   post:
 *     summary: Outlook webhook receiver
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Success
 */
webhookRouter.post("/outlook", outLookWebhook);

/**
 * @swagger
 * /webhook/teams:
 *   post:
 *     summary: Teams webhook receiver
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Success
 */
webhookRouter.post("/teams", teamsWebhook);

/**
 * @swagger
 * /webhook/teams-channels:
 *   post:
 *     summary: Teams channels webhook receiver
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Success
 */
webhookRouter.post("/teams-channels", teamsChannelsWebhook);

/**
 * @swagger
 * /webhook/google/auth:
 *   get:
 *     summary: Google auth webhook receiver
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Success
 */
webhookRouter.get("/google/auth", googleAuthWebhook);

/**
 * @swagger
 * /webhook/gmail:
 *   post:
 *     summary: Gmail webhook receiver
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Success
 */
webhookRouter.post("/gmail", gmailWebhook);


export default webhookRouter;
