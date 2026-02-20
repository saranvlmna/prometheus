import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import profile from "./profile.js";
import login from "./signin.js";
import { getPersona, createPersona } from "./persona.js";

const userRouter = Router();

userRouter.post("/signin", login);
userRouter.post("/persona", authentication, createPersona);
userRouter.get("/persona", authentication, getPersona);
userRouter.get("/profile", authentication, profile);
export default userRouter;
