import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Routes } from "./router/index.js";
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Start server
(async () => {
  // Connect to MongoDB
  await connectDB();
  
  const server = await Routes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(err);
    res.status(status).json({ message });
  });

  // Server configuration
  const port = process.env.PORT || 5000 ;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
  }, () => {
    console.log(`Server running on port ${port}`);
  });
})();

export default app;
