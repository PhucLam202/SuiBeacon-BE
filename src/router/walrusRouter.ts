import express from "express";
import WalrusController from "../controller/walrusController.js";

const walrusRouter = express.Router();
const walrusController = new WalrusController();

walrusRouter.post("/upload", (req, res, next) => {
  walrusController.uploadFile(req, res, next);
});

walrusRouter.get("/download/:blobId", (req, res, next) => {
  walrusController.downloadFile(req, res, next);
});


export default walrusRouter;