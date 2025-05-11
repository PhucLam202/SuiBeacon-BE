import express from "express";
import cors from "cors";
import { Routes } from "./router/index.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function startServer(port = process.env.PORT || 5000, host = '0.0.0.0') {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");
    
    // Initialize routes
    const httpServer = await Routes(app);
    
    // Start server
    httpServer.listen(Number(port), host, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
    
    return httpServer;
  } catch (error) {
    console.error("Failed to start server:", error);
    throw error;
  }
}

// If this file is run directly
if (process.argv[1] === import.meta.url || process.argv[1].endsWith('server.js')) {
  startServer();
}

export default startServer;
