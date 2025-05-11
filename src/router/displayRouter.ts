import express from "express";
import DisplayController from "../controller/displayController.js";
const displayRouter = express.Router();
const displayController = new DisplayController();


displayRouter.get("/:walletAddress", (req, res, next) => {
    displayController.getAllDataWithPackages(req, res, next);
});
displayRouter.get("/summary/:walletAddress", (req, res, next) => {
    displayController.getSumProjectAndPackage(req, res, next);
});

export default displayRouter;
