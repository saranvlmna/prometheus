import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import profile from "./profile.js";
import login from "./signin.js";
import persona from "./persona.js";

const userRouter = Router();

userRouter.post("/signin", login);
userRouter.post("/persona", authentication, persona);
userRouter.get("/persona", authentication, persona);
userRouter.get("/profile", authentication, profile);
export default userRouter;
