import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Kiểm tra xem đã có connection chưa
    if (mongoose.connection.readyState === 1) {
      console.log("Using existing database connection");
      return mongoose.connection;
    }
    
    const connectString = process.env.DATABASE_URL;
    if (!connectString) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    
    await mongoose.connect(connectString, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log("Connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

export default connectDB;
