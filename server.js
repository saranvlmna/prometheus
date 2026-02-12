import express from "express";
import teamsRouter from "./src/teams/router.js";
import webhookRouter from "./src/webhooks/router.js";

const server = express();

server.get("/", (req, res) => {
  res.send("Prometheus Health Is Ok");
});

server.use("/webhook", webhookRouter);
server.use("/teams", teamsRouter);

server.listen(4000, () => {
  console.log("Prometheus server is running on port 4000");
});
