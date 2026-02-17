import dotenv from "dotenv";
import express from "express";
import googleRouter from "./src/google/router.js";
import teamsRouter from "./src/teams/router.js";
import userRouter from "./src/user/router.js";
import webhookRouter from "./src/webhooks/router.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Prometheus Health Is Ok and v00.1");
});

app.use("/webhook", webhookRouter);
app.use("/teams", teamsRouter);
app.use("/user", userRouter);
app.use("/google", googleRouter);

export default app;
