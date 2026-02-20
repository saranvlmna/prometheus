import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import approve from "./approve.js";
import actionDelete from "./delete.js";
import actionEnhance from "./enhance.action.js";
import actionGet from "./get.js";
import actionsList from "./list.js";
import actionUpdate from "./update.action.js";
import actionUpdatePayload from "./update.payload.js";
import actionUpdateStatus from "./update.status.js";

const actionsRouter = Router();

actionsRouter.post("/approve", authentication, approve);
actionsRouter.post("/delete", authentication, actionDelete);
actionsRouter.get("/", authentication, actionsList);
actionsRouter.get("/:id", authentication, actionGet);
actionsRouter.post("/:id", authentication, actionUpdate);
actionsRouter.post("/:id/status", authentication, actionUpdateStatus);
actionsRouter.post("/:id/payload", authentication, actionUpdatePayload);
actionsRouter.post("/enhance/:actionId", authentication, actionEnhance);

export default actionsRouter;
