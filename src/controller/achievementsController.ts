
import { Request, Response, NextFunction } from "express";
import { CustomExpress } from "../middlewares/app/customResponse.js";
import AchievementsService from "../service/achievementsService.js";
import * as DataQuery from "../config/data.query.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ArchiveimentContruct } from "../types/achievementType.js";
import { AppError } from "../middlewares/e/AppError.js";

function safeUnlink(filePath: string) {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!") as any, false);
    }
  },
}).single("image");

// Export middleware for use in router
export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

class AchievementsController {
  private achievementsService: AchievementsService;

  constructor() {
    this.achievementsService = new AchievementsService();
  }

  async uploadDataNFTToWal(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    
    try {
      const description = req.body.description || "";
      const userAddress = req.headers["wallet-address"] as string;
      const title = req.body.title || "Achievement";

      if (!userAddress) {
        if (req.file) safeUnlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Wallet address is required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image file is required",
        });
      }

      // Prepare payload for Walrus
      const imageBuffer = fs.readFileSync(req.file.path);
      const payload = {
        userAddress: userAddress,
        description,
        title,
        image: imageBuffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      };

      // Upload to Walrus
      const blobId = await this.achievementsService.uploadBlob(payload);
      
      // Delete temp file after upload
      safeUnlink(req.file.path);

      // Generate image URL
      const imageUrl = `/v1/achievements/image/${blobId}`;

      // Return success response
      appExpress.response200({
        success: true,
        blobId,
        imageUrl,
        message: "Achievement uploaded successfully",
      });
    } catch (e) {
      console.error("Error in uploadDataNFTToWal:", e);
      
      // Delete temp file if error occurs
      if (req.file && req.file.path) {
        safeUnlink(req.file.path);
      }
      
      // Handle specific errors
      if (e instanceof AppError) {
        return appExpress.responseAppError(e);
      }
      
      // Return a generic error response
      return res.status(500).json({
        success: false,
        message: "Failed to upload achievement",
        error: e instanceof Error ? e.message : "Unknown error"
      });
    }
  }

  async getAllAchievements(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const userAddress = req.headers["wallet-address"] as string;

      if (!userAddress) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required",
        });
      }

      const page = parseInt((req.query.page as string) || "1");
      const limit = parseInt((req.query.limit as string) || "10");

      // Get list of achievements
      const achievements = await DataQuery.getAllAchievements(
        userAddress,
        page,
        limit
      );

      // Add image URLs to achievements
      const achievementsWithImages = achievements.map((achievement) => ({
        ...achievement,
        imageUrl: `/v1/achievements/image/${achievement.blobId}`
      }));

      // Count total records for pagination
      const total = await DataQuery.countAchievements(userAddress);

      appExpress.response200({
        data: achievementsWithImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (e) {
      console.error("Error in getAllAchievements:", e);
      
      if (e instanceof AppError) {
        return appExpress.responseAppError(e);
      }
      
      next(e);
    }
  }

  async getImageFromBlobId(req: Request, res: Response, next: NextFunction) {
    try {
      const blobId = req.params.blobId;

      if (!blobId) {
        return res.status(400).json({
          success: false,
          message: "BlobId is required",
        });
      }

      // Get blob data from Walrus
      const blobData = await this.achievementsService.readBlobAsRaw(blobId);

      // Set cache headers for better performance
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day

      // Check if data is an image
      if (blobData.contentType.startsWith("image/")) {
        // Return image
        res.setHeader("Content-Type", blobData.contentType);
        res.send(blobData.data);
      } else {
        // If not an image, try to read as JSON
        try {
          const jsonData = JSON.parse(blobData.data.toString());

          // If image exists, redirect to that URL
          if (jsonData.image) {
            return res.redirect(jsonData.image);
          }

          // If no image, return JSON data
          res.json(jsonData);
        } catch (e) {
          // If not JSON, return data as text
          res.setHeader("Content-Type", "text/plain");
          res.send(blobData.data.toString());
        }
      }
    } catch (e) {
      next(e);
    }
  }

  async getAchievementDetails(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    
    try {
      const blobId = req.params.blobId;
      
      if (!blobId) {
        return res.status(400).json({
          success: false,
          message: "BlobId is required"
        });
      }
      
      // Gọi service để lấy thông tin chi tiết
      const achievementDetails = await this.achievementsService.getAchievementDetails(blobId);
      
      // Trả về kết quả
      appExpress.response200({
        success: true,
        ...achievementDetails
      });
    } catch (e) {
      console.error("Error in getAchievementDetails:", e);
      
      // Nếu là AppError, sử dụng responseAppError
      if (e instanceof AppError) {
        return appExpress.responseAppError(e);
      }
      
      next(e);
    }
  }
}

export default AchievementsController;
