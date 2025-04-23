import express from "express";
import WalrusController from "../controller/walrusController";

const walrusRouter = express.Router();
const walrusController = new WalrusController();

// Route để lấy dữ liệu
walrusRouter.post("/upload", (req, res, next) => {
  walrusController.uploadFile(req, res, next);
});

walrusRouter.get("/downloadtext/:blobId", (req, res, next) => {
  walrusController.downloadFileAsText(req, res, next);
});

walrusRouter.get("/download/:blobId", (req, res, next) => {
  walrusController.downloadFile(req, res, next);
});

export default walrusRouter;