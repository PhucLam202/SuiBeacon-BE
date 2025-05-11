import express from "express";
import WalrusController from "../controller/walrusController.js";
const listpackageRouter = express.Router();
const walrusController = new WalrusController();


//Protected endpoint: Push packages to Walrus
listpackageRouter.post("/push", (req, res, next) => {
  walrusController.pushPackages(req, res, next);
});

export default listpackageRouter;
