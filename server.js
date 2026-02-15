import dotenv from "dotenv";
import express from "express";
import connectDB from "./database/connection.js";
import googleRouter from "./src/google/router.js";
import "./src/shared/cron/renew.subscriptions.js";
import teamsRouter from "./src/teams/router.js";
import userRouter from "./src/user/router.js";
import webhookRouter from "./src/webhooks/router.js";

dotenv.config();

const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
await connectDB();

server.get("/", (req, res) => {
  res.send("Prometheus Health Is Ok");
});

server.use("/webhook", webhookRouter);
server.use("/teams", teamsRouter);
server.use("/user", userRouter);
server.use("/google", googleRouter);

server.listen(4000, "0.0.0.0", () => {
  console.log("Prometheus server is running on port 4000");
});
