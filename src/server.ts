import { createServer } from 'http';
import express from "express";
import cors from "cors";
import { Routes } from "./router/index.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";
import rateLimit from 'express-rate-limit';

dotenv.config();

async function startServer(port = process.env.PORT || 5000, host = '0.0.0.0') {
  const app = express();
  
  // Middleware
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com', /\.yourdomain\.com$/] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'wallet-address'],
    credentials: true
  };
  
  app.use(cors(corsOptions));
  
  // Basic security middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Apply to all requests
  app.use(limiter);
  
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database");
    
    // Initialize routes
    const httpServer = createServer(app);
    await Routes(app);
    
    // Start server
    httpServer.listen(Number(port), host, () => {
      console.log(`Server running at http://${host}:${port}`);
      console.log(`Health check available at http://localhost:${port}/health`);
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

// ES Module equivalent of require.main === module
// This checks if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default startServer;
