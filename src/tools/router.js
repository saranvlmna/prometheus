import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import toolsList from "./list.js";
import toolDelete from "./tool.delete.js";

const toolsRouter = Router();

toolsRouter.get("/connected", authentication, toolsList);
toolsRouter.delete("/", authentication, toolDelete);

export default toolsRouter;
