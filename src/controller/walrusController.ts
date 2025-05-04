import { Request, Response, NextFunction } from "express";
import WalrusService from "../service/walrusService";
import { CustomExpress } from "../middlewares/app/customResponse";
import ListPackagesService, {
  ListPackagesService as ListPackagesServiceClass,
} from "../service/listPackagesService";
import PackageInfo from "../types/dataCli";
import Package from '../models/Package';
import PushHistory from '../models/PushHistory';
import DataModel from '../models/DataModel';
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

      // Kiểm tra xem có dữ liệu không
      if (!data) {
        return res.status(400).json({
          success: false,
          message: "Missing data in request body",
        });
      }

      await this.walrusService.checkBalance();

      // Upload dữ liệu lên Walrus với description
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
   * Đẩy danh sách packages đã cài đặt lên Walrus và lưu thông tin vào database
   * @param req Request từ client
   * @param res Response trả về client
   * @param next Middleware tiếp theo
   */
  async pushPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      // STEP 1: Kiểm tra wallet address từ header hoặc body
      const walletAddress = req.headers['wallet-address'] as string || req.body.walletAddress;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required. Please provide it in the request header 'wallet-address' or in the request body.",
        });
      }
      
      // STEP 2: Lấy danh sách packages đã cài đặt từ service
      const packages = await this.listPackagesService.getPackages();
      
      // STEP 3: Kiểm tra xem có packages nào không
      if (packages.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No packages found to push",
        });
      }
      
      // STEP 4: Tạo payload chứa thông tin packages và metadata
      const payload = {
        packages,
        metadata: {
          totalCount: packages.length,
          timestamp: new Date().toISOString(),
          source: "beacon-cli",
          walletAddress
        }
      };
      
      // STEP 5: Upload payload lên Walrus và nhận blobId
      const blobId = await this.walrusService.uploadBlob(
        payload, 
        `Complete package list for ${walletAddress}`
      );
      
      // STEP 6: Lưu thông tin vào DataModel
      await DataModel.create({
        walletAddress: walletAddress,
        blobId: blobId,
        createdAt: new Date()
      });
      
      // STEP 7: Lưu từng package vào database
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
      
      // STEP 8: Lưu lịch sử push vào PushHistory
      await PushHistory.create({
        walletAddress,
        blobId,
        packageCount: packages.length,
        source: "beacon-cli",
        createdAt: new Date()
      });
      
      // STEP 9: Trả về kết quả thành công cho client
      appExpress.response200({ 
        success: true,
        payload,
        blobId 
      });
    } catch (e) {
      // STEP 10: Xử lý lỗi nếu có
      next(e);
    }
  }
}

export default WalrusController;
