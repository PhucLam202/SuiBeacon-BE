import { Request, Response, NextFunction } from "express";
import { CustomExpress } from "../middlewares/app/customResponse";
import UserPackageService, { UserPackageService as UserPackageServiceClass } from "../service/userPackageService";

class UserPackageController {
  private userPackageService: UserPackageServiceClass;
  
  constructor() {
    this.userPackageService = UserPackageService;
  }
  
  async getUserPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { walletAddress } = req.params;
      const packages = await this.userPackageService.getUserPackages(walletAddress);
      appExpress.response200({ packages });
    } catch (e) {
      next(e);
    }
  }
  
  async syncUserPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { walletAddress } = req.params;
      const packages = await this.userPackageService.syncUserPackages(walletAddress);
      appExpress.response200({ 
        message: "Packages synced successfully",
        packages 
      });
    } catch (e) {
      next(e);
    }
  }
  
  async pushUserPackagesToHub(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const { walletAddress } = req.params;
      const result = await this.userPackageService.pushUserPackagesToHub(walletAddress);
      appExpress.response200({ 
        message: "Packages pushed to hub successfully",
        blobId: result.blobId,
        packages: result.packages
      });
    } catch (e) {
      next(e);
    }
  }
}

export default new UserPackageController();
