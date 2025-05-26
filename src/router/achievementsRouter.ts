
import express from 'express';
import AchievementsController, { uploadMiddleware } from '../controller/achievementsController.js';

const achievementsRouter = express.Router();
const achievementsController = new AchievementsController();

// Route to get all achievements of a wallet address
achievementsRouter.get('/', (req, res, next) => {
  achievementsController.getAllAchievements(req, res, next);
});

// Route to get image by blobId
achievementsRouter.get('/image/:blobId', (req, res, next) => {
  achievementsController.getImageFromBlobId(req, res, next);
});

// Route to get achievement details by blobId
achievementsRouter.get('/details/:blobId', (req, res, next) => {
  achievementsController.getAchievementDetails(req, res, next);
});

// Route to upload achievement with file handling
achievementsRouter.post('/upload', uploadMiddleware, (req, res, next) => {
  achievementsController.uploadDataNFTToWal(req, res, next);
});

export default achievementsRouter;

