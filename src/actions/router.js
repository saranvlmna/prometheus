import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import actionGet from "./get.js";
import actionsList from "./list.js";
import actionUpdatePayload from "./update.payload.js";
import actionUpdateStatus from "./update.status.js";
import actionEnhance from "./enhance.action.js";

const actionsRouter = Router();

actionsRouter.get("/", authentication, actionsList);
actionsRouter.get("/:id", authentication, actionGet);
actionsRouter.post("/:id/status", authentication, actionUpdateStatus);
actionsRouter.post("/:id/payload", authentication, actionUpdatePayload);
actionsRouter.post("/enhance/:actionId", authentication, actionEnhance);

export default actionsRouter;
