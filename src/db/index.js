import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_CONNECTION_STRING = process.env.MONGO_URI;

const dbConnect = async () => {
  try {
    mongoose.set("strictQuery", false); // Optional if you're using Mongoose 6+
    const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);

    console.log(`Database connected to host: ${conn.connection.host}`);

    // Listen for Mongoose connection events
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected.");
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Reconnecting...");
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });

    
    console.log(`Database connected to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to database: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};





export default dbConnect;
