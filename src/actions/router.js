import { Router } from "express";
import actionGet from "./get.js";
import actionsList from "./list.js";
import actionUpdatePayload from "./update.payload.js";
import actionUpdateStatus from "./update.status.js";

const actionsRouter = Router();

actionsRouter.get("/", actionsList);
actionsRouter.get("/:id", actionGet);
actionsRouter.post("/:id/status", actionUpdateStatus);
actionsRouter.post("/:id/payload", actionUpdatePayload);

export default actionsRouter;
