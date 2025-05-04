import mongoose from "mongoose";
import dotenv from "dotenv";
import { AppError } from "../middlewares/e/AppError";
import { ErrorCode } from "../middlewares/e/ErrorCode";

dotenv.config();

let connection: mongoose.Connection;

const connectDB = async () => {
  try {
    const connectstring = process.env.DATABASE_URL;
    if (!connectstring) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    console.log(connectstring, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await mongoose.connect(connectstring);
    connection = mongoose.connection;

    console.log(`MongoDB Connected: ${connection.host}`);

    return connection;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    throw AppError.newError500(
      ErrorCode.DB_CONNECTION_ERROR,
      `Failed to connect to database: ${error.message}`
    );
  }
};

// Global handler for unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Optionally exit the process
  process.exit(1);
});

// Function to get the mongoose connection
export const getDb = () => {
  if (!connection) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return connection;
};

export default connectDB;
