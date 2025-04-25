import express from "express";
import UserPackageController from "../controller/userPackageController";

const userPackageRouter = express.Router();

// Get user's packages
userPackageRouter.get("/:walletAddress", (req, res, next) =>
  UserPackageController.getUserPackages(req, res, next)
);

// Sync user's packages
userPackageRouter.post("/:walletAddress/sync", (req, res, next) =>
  UserPackageController.syncUserPackages(req, res, next)
);

// Push user's packages to hub
userPackageRouter.post("/:walletAddress/push", (req, res, next) =>
  UserPackageController.pushUserPackagesToHub(req, res, next)
);

export default userPackageRouter;