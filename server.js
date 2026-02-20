import app from "./app.js";
import connectDB from "./config/database.js";
const APP_PORT = process.env.APP_PORT || 4000;

await connectDB();

app.listen(APP_PORT, "0.0.0.0", () => {
  console.log(`Prometheus server is running on port ${APP_PORT}`);
});
 