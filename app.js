import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import googleRouter from "./src/google/router.js";
import teamsRouter from "./src/teams/router.js";
import userRouter from "./src/user/router.js";
import webhookRouter from "./src/webhooks/router.js";
import actionsRouter from "./src/actions/router.js";
import toolsRouter from "./src/tools/router.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Prometheus API",
            version: "1.0.0",
            description: "API documentation for the Prometheus project",
        },
        servers: [
            {
                url: "http://localhost:4000",
                description: "Development server",
            },
        ],
    },
    apis: ["./app.js", "./src/*/router.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const swaggerUiOptions = {
    customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css",
    customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-bundle.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui-standalone-preset.js"
    ]
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get("/", (req, res) => {
    res.send("Prometheus Health Is Ok and v00.1");
});

app.use("/webhook", webhookRouter);
app.use("/teams", teamsRouter);
app.use("/user", userRouter);
app.use("/google", googleRouter);
app.use("/actions", actionsRouter);
app.use("/tools", toolsRouter);

export default app;
