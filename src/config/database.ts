import mongoose from "mongoose";
import dotenv from "dotenv";
import { AppError } from "../middlewares/e/AppError.js";
import { ErrorCode } from "../middlewares/e/ErrorCode.js";

dotenv.config();

let connection: mongoose.Connection;

const connectDB = async () => {
  try {
    const connectstring = process.env.DATABASE_URL;
    if (!connectstring) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    
    // Set mongoose options with increased timeouts
    mongoose.set('bufferCommands', true);
    mongoose.set('bufferTimeoutMS', 100000); 
    
    // Connect with improved options
    await mongoose.connect(connectstring, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000, 
    });
    
    connection = mongoose.connection;
    
    // Set up connection event handlers
    connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });
    
    connection.on('disconnected', () => {
    });
    
    connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });


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

// Function to check if database is connected
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
