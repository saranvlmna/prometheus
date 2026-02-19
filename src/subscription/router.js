import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import googleAuthentication from "../google/google.authentication.js";
import slackAuthentication from "../slack/slack.authentication.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/google", authentication, googleAuthentication);
subscriptionRouter.get("/slack", authentication, slackAuthentication);

export default subscriptionRouter;
