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
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  app.use(cors(corsOptions));
  
  // Thêm middleware bảo mật cơ bản
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Thêm rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // giới hạn mỗi IP 100 request trong 15 phút
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Áp dụng cho tất cả các request
  app.use(limiter);
  
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
