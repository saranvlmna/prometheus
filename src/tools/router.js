import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import toolsList from "./list.js";

const toolsRouter = Router();

toolsRouter.get("/connected", authentication, toolsList);

export default toolsRouter;
