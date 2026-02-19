import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }
    const DB_URL =
      "mongodb+srv://tomgeorgethoughtminds_db_user:SjKZuZDPEYpmTkHM@cluster0.tg13fml.mongodb.net/prometheus_dev?appName=Cluster0";
    const conn = await mongoose.connect(DB_URL);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("Database connected successfully");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

export default connectDB;
