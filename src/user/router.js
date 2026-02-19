import { Router } from "express";
import authentication from "../../shared/middlewares/authentication.js";
import profile from "./profile.js";
import login from "./signin.js";

const userRouter = Router();

userRouter.post("/signin", login);
userRouter.get("/profile", authentication, profile);
export default userRouter;
