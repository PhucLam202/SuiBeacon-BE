import type { Express } from "express";
import { createServer, type Server } from "http";
import walrusRouter from "./walrusRouter.js";
import listpackageRouter from "./listpackageRouter.js";
import displayRouter from "./displayRouter.js";

export async function Routes(app: Express): Promise<Server> {
  // Register API routes
  app.use("/v1/walrus", walrusRouter);  
  app.use('/v1/listPackages', listpackageRouter);
  app.use("/v1/display", displayRouter);
  
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
