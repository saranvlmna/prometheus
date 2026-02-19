import fs from "fs";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export default function setupSwagger(app) {
  try {
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
            url: process.env.BASE_URL || "http://localhost:4000",
          },
        ],
        components: {
          securitySchemes: {
            AccessToken: {
              type: "apiKey",
              in: "header",
              name: "x-access-token",
            },
          },
          schemas: {
            Action: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                status: { type: "string" },
                created_at: { type: "string", format: "date-time" },
              },
            },
          },
        },

        security: [{ AccessToken: [] }],
      },

      apis: ["./app.js", "./src/*/router.js"],
    };

    const swaggerSpec = swaggerJsdoc(swaggerOptions);

    const docsDir = path.resolve(process.cwd(), "shared", "docs");

    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".json"));

      for (const file of files) {
        const spec = JSON.parse(fs.readFileSync(path.join(docsDir, file), "utf8"));

        if (spec.paths) {
          swaggerSpec.paths = { ...(swaggerSpec.paths || {}), ...spec.paths };
        }

        if (spec.components) {
          swaggerSpec.components = {
            ...(swaggerSpec.components || {}),
            ...spec.components,
          };
        }

        if (spec.tags) {
          const existing = swaggerSpec.tags || [];
          const merged = [...existing, ...spec.tags];
          swaggerSpec.tags = Array.from(new Map(merged.map((t) => [t.name, t])).values());
        }
      }
    }

    const swaggerUiOptions = {
      customCss: `.models { display:none !important; }`,
    };

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    console.log("Swagger UI available at /api/docs");
  } catch (error) {
    console.error("Swagger setup error:", error);
    throw error;
  }
}
