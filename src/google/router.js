import { Router } from "express";
import googleAuthentication from "./google.authentication.js";

const googleRouter = Router();

googleRouter.get("/auth", googleAuthentication);

export default googleRouter;
