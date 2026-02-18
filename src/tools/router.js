import { Router } from "express";
import toolsList from "./list.js";
import slackAuthentication from "../slack/slack.authentication.js";

const toolsRouter = Router();

/**
 * @swagger
 * /tools:
 *   get:
 *     summary: List all tools (connected and available)
 *     tags: [Tools]
 *     responses:
 *       200:
 *         description: A list of tools
 */
toolsRouter.get("/", toolsList);

/**
 * @swagger
 * /tools/slack/auth:
 *   get:
 *     summary: Slack authentication
 *     tags: [Tools]
 *     responses:
 *       200:
 *         description: Success
 */
toolsRouter.get("/slack/auth", slackAuthentication);

export default toolsRouter;
