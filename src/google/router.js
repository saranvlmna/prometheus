import { Router } from "express";
import googleAuthentication from "./google.authentication.js";
import actionsGet from "./actions.get.js";
import actionsUpdate from "./actions.update.js";

const googleRouter = Router();

googleRouter.get("/auth", googleAuthentication);

googleRouter.get("/actions", actionsGet);
googleRouter.post("/actions/:id/status", actionsUpdate);

export default googleRouter;
