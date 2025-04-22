import { Request, Response, NextFunction } from "express";
import WalrusService from "../service/walrusService";
import { CustomExpress } from "../middlewares/app/customResponse";
import ListPackagesService, {
  ListPackagesService as ListPackagesServiceClass,
} from "../service/listPackagesService";
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
  async getPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const packages = await this.listPackagesService.getPackages();
      appExpress.response200({ packages });
    } catch (e) {
      next(e);
    }
  }
  // async pushPackages(req: Request, res: Response, next: NextFunction) {
  //   const appExpress = new CustomExpress(req, res, next);
  //   try {
  //     const { walletAddress, signature, message } = req.body;

  //     // Validate request body
  //     if (!walletAddress || !signature || !message) {
  //       return res.status(400).json({
  //         success: false,
  //         message:
  //           "Missing walletAddress, signature, or message in request body",
  //       });
  //     }

  //     // Verify Sui wallet signature
  //     const publicKey = new Ed25519PublicKey(walletAddress);
  //     const messageBytes = fromB64(message);
  //     const isValid = await verifySignature(messageBytes, signature, publicKey);
  //     if (!isValid) {
  //       return res.status(401).json({
  //         success: false,
  //         message: "Invalid wallet signature",
  //       });
  //     }

  //     // Fetch packages
  //     const packages = await this.listPackagesService.getPackages();
  //     if (!packages.length) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "No packages available to push",
  //       });
  //     }

  //     // Check Walrus balance
  //     await this.walrusService.checkBalance();

  //     // Upload to Walrus
  //     const blobId = await this.walrusService.uploadBlob(
  //       { packages, walletAddress, timestamp: Date.now() },
  //       `Package list for ${walletAddress}`,
  //       walletAddress
  //     );

  //     appExpress.response200({ blobId });
  //   } catch (e) {
  //     next(e);
  //   }
  // }
}

export default WalrusController;
