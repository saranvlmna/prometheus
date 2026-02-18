import { Router } from "express";
import actionsList from "./list.js";
import actionGet from "./get.js";
import actionUpdateStatus from "./update-status.js";
import actionUpdatePayload from "./update-payload.js";

const actionsRouter = Router();

/**
 * @swagger
 * /actions:
 *   get:
 *     summary: List all actions
 *     tags: [Actions]
 *     responses:
 *       200:
 *         description: A list of actions
 */
actionsRouter.get("/", actionsList);

/**
 * @swagger
 * /actions/{id}:
 *   get:
 *     summary: Get a specific action
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Action details
 */
actionsRouter.get("/:id", actionGet);

/**
 * @swagger
 * /actions/{id}/status:
 *   post:
 *     summary: Update action status (approved/declined)
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
actionsRouter.post("/:id/status", actionUpdateStatus);

/**
 * @swagger
 * /actions/{id}/payload:
 *   post:
 *     summary: Update action payload
 *     tags: [Actions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 */
actionsRouter.post("/:id/payload", actionUpdatePayload);

export default actionsRouter;
