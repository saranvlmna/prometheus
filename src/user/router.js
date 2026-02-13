import { Router } from "express";
import login from "./login.js";

const userRouter = Router();

userRouter.post("/login", login);

export default userRouter;
