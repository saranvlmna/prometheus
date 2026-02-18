import { Router } from "express";
import graphSubscriptionCreate from "./graph.subscription.create.js";

const teamsRouter = Router();

/**
 * @swagger
 * /teams/subscription/create:
 *   post:
 *     summary: Create a Microsoft Graph subscription
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Success
 */
teamsRouter.post("/subscription/create", graphSubscriptionCreate);

export default teamsRouter;
