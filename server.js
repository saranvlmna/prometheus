import dotenv from "dotenv";
import express from "express";
import connectDB from "./database/config/config.js";
import teamsRouter from "./src/teams/router.js";
import userRouter from "./src/user/router.js";
import webhookRouter from "./src/webhooks/router.js";

dotenv.config();

const server = express();
server.use(express.json());

server.get("/", (req, res) => {
  res.send("Prometheus Health Is Ok");
});

connectDB();

server.use("/webhook", webhookRouter);
server.use("/teams", teamsRouter);
server.use("/user", userRouter);

server.listen(4000, () => {
  console.log("Prometheus server is running on port 4000");
});
