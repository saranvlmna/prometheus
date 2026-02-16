import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Don't exit process in serverless environment
    throw error;
  }
};

export default connectDB;
