import { Router } from "express";
import googleAuthentication from "./google.authentication.js";

const googleRouter = Router();

/**
 * @swagger
 * /google/auth:
 *   get:
 *     summary: Google authentication
 *     tags: [Google]
 *     responses:
 *       200:
 *         description: Success
 */
googleRouter.get("/auth", googleAuthentication);

export default googleRouter;
