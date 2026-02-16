import app from "./app.js";
import connectDB from "./database/connection.js";

// Connect to database and start server for local development
await connectDB();

app.listen(4000, "0.0.0.0", () => {
  console.log("Prometheus server is running on port 4000");
});
