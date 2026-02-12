import { Router } from "express";
import login from "./login.js";

const userRouter = Router();

userRouter.get("/login", login);

export default userRouter;
