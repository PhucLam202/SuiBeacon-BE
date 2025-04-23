import type { Express } from "express";
import { createServer, type Server } from "http";
import walrusRouter from "./walrusRouter"
import listpackageRouter from "./listpackageRouter"

export async function Routes(app: Express): Promise<Server> {
  // Register API routes
  app.use("/v1/walrus",walrusRouter );  
  app.use('/v1/listPackages',listpackageRouter );
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}