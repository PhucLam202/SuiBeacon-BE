import express from "express";
import WalrusController from "../controller/walrusController";

const listpackageRouter = express.Router();
const walrusController = new WalrusController();

// Public endpoint: List installed packages
listpackageRouter.get("/", (req, res, next) =>
  walrusController.getPackages(req, res, next)
);

// Protected endpoint: Push packages to Walrus
// listpackageRouter.post("/push", (req, res, next) =>
//   walrusController.pushPackages(req, res, next)
// );

export default listpackageRouter;