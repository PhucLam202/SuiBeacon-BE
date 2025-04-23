import { Request, Response, NextFunction } from "express";
import WalrusService from "../service/walrusService";
import { CustomExpress } from "../middlewares/app/customResponse";
import ListPackagesService, {
  ListPackagesService as ListPackagesServiceClass,
} from "../service/listPackagesService";
import PackageInfo from "../types/dataCli";
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
  async downloadFileAsText(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { blobId } = req.params;
      if (!blobId) {
        return res.status(400).json({ error: "Missing blobId parameter" });
      }
      const encoding = (req.query.encoding as BufferEncoding) || "utf-8";
      const textContent = await this.walrusService.readBlobAsText(
        blobId,
        encoding
      );
      res.setHeader("Content-Type", "text/plain");
      appExpress.response200({ textContent });
    } catch (e) {
      next(e);
    }
  }
  async getListInstalledPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const packages = await this.listPackagesService.getPackages();
      appExpress.response200({ packages });
    } catch (e) {
      next(e);
    }
  }
  async pushPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      // Lấy danh sách packages đã cài đặt
      const packages = await this.listPackagesService.getPackages();
      
      if (packages.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No packages found to push",
        });
      }
      
      // Tạo payload chứa toàn bộ danh sách packages
      const payload = {
        packages,
        metadata: {
          totalCount: packages.length,
          timestamp: new Date().toISOString(),
          source: "beacon-cli"
        }
      };
      
      // Upload toàn bộ danh sách packages lên Walrus
      const blobId = await this.walrusService.uploadBlob(
        payload, 
        "Complete package list"
      );
      
      appExpress.response200({ payload ,blobId });
    } catch (e) {
      next(e);
    }
  }
}

export default WalrusController;
