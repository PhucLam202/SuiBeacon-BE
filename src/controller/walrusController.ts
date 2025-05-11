import { Request, Response, NextFunction } from "express";
import WalrusService from "../service/walrusService.js";
import { CustomExpress } from "../middlewares/app/customResponse.js";
import ListPackagesService, {
  ListPackagesService as ListPackagesServiceClass,
} from "../service/listPackagesService.js";
import PackageInfo from "../types/dataCli.js";
import Package from '../models/Package.js';
import PushHistory from '../models/PushHistory.js';
import DataModel from '../models/DataModel.js';
class WalrusController {
  private walrusService: WalrusService;
  private listPackagesService: ListPackagesServiceClass;
  constructor() {
    this.walrusService = new WalrusService();
    this.listPackagesService = ListPackagesService;
  }

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);

    try {
      const { data, description } = req.body;

      // Check if data exists
      if (!data) {
        return res.status(400).json({
          success: false,
          message: "Missing data in request body",
        });
      }

      await this.walrusService.checkBalance();

      // Upload data to Walrus with description
      const blobId = await this.walrusService.uploadBlob(data, description);
      appExpress.response200({ blobId });
    } catch (e) {
      next(e);
    }
  }

  async downloadFile(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const blobId = req.params.blobId || (req.query.blobId as string);
      if (!blobId) {
        return res.status(400).json({ error: "Missing blobId parameter" });
      }
      const blob = await this.walrusService.readBlobAsText(blobId);
      appExpress.response200({ blob });
    } catch (e) {
      next(e);
    }
  }
  // async downloadFileAsText(req: Request, res: Response, next: NextFunction) {
  //   const appExpress = new CustomExpress(req, res, next);
  //   try {
  //     const { blobId } = req.params;
  //     if (!blobId) {
  //       return res.status(400).json({ error: "Missing blobId parameter" });
  //     }
  //     const encoding = (req.query.encoding as BufferEncoding) || "utf-8";
  //     const textContent = await this.walrusService.readBlobAsText(
  //       blobId,
  //       encoding
  //     );
  //     res.setHeader("Content-Type", "text/plain");
  //     appExpress.response200({ textContent });
  //   } catch (e) {
  //     next(e);
  //   }
  // }
  async getListInstalledPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const packages = await this.listPackagesService.getPackages();
      appExpress.response200({ packages });
    } catch (e) {
      next(e);
    }
  }
  /**
   * Push installed package list to Walrus and save information to database
   * @param req Request from client
   * @param res Response to client
   * @param next Next middleware
   */
  async pushPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      // STEP 1: Check wallet address from header or body
      const walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required. Please provide it in the request header 'wallet-address' or in the request body.",
        });
      }
      
      // STEP 2: Get list of installed packages from service
      const packages = await this.listPackagesService.getPackages();
      
      // STEP 3: Check if any packages exist
      if (packages.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No packages found to push",
        });
      }
      
      // STEP 4: Create payload with package information and metadata
      const payload = {
        packages,
        metadata: {
          totalCount: packages.length,
          timestamp: new Date().toISOString(),
          source: "beacon-cli",
          walletAddress
        }
      };
      
      // STEP 5: Upload payload to Walrus and get blobId
      const blobId = await this.walrusService.uploadBlob(
        payload, 
        `Complete package list for ${walletAddress}`
      );
      
      // STEP 6: Save information to DataModel
      await DataModel.create({
        walletAddress: walletAddress,
        blobId: blobId,
        createdAt: new Date()
      });
      
      // STEP 7: Save each package to database
      for (const pkg of packages) {
        await Package.create({
          walletAddress,
          blobId,
          package: {
            name: pkg.name,
            version: pkg.version
          },
          metadata: {
            source: 'beacon-cli'
          }
        });
      }
      
      // STEP 8: Save push history to PushHistory
      await PushHistory.create({
        walletAddress,
        blobId,
        packageCount: packages.length,
        source: "beacon-cli",
        createdAt: new Date()
      });
      
      // STEP 9: Return success result to client
      appExpress.response200({ 
        success: true,
        payload,
        blobId 
      });
    } catch (e) {
      // STEP 10: Handle errors if any
      next(e);
    }
  }
}

export default WalrusController;
