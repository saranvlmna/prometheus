import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import setupSwagger from "./config/swagger.js";
import actionsRouter from "./src/actions/router.js";
import subscriptionRouter from "./src/subscription/router.js";
import toolsRouter from "./src/tools/router.js";
import userRouter from "./src/user/router.js";
import webhookRouter from "./src/webhooks/router.js";

dotenv.config();

const app = express();

setupSwagger(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/subscription", subscriptionRouter);
app.use("/webhook", webhookRouter);

app.use("/user", userRouter);
app.use("/actions", actionsRouter);
app.use("/tools", toolsRouter);

app.get("/", (req, res) => {
  res.send("Prometheus Health Is Ok");
});

export default app;
