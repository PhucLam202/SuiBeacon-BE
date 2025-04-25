import { AppError } from "../middlewares/e/AppError";
import { ErrorCode } from "../middlewares/e/ErrorCode";
import User from "../models/User";
import Package from "../models/Package";
import listPackages from "../command/list";
import WalrusService from "./walrusService";

export class UserPackageService {
  private walrusService: WalrusService;
  
  constructor() {
    this.walrusService = new WalrusService();
  }

  async getUserPackages(walletAddress: string) {
    try {
      const user = await User.findByWalletAddress(walletAddress);
      if (!user) {
        return [];
      }
      return user.packages || [];
    } catch (err: any) {
      throw AppError.newError500(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to fetch user packages: ${err.message}`);
    }
  }

  async syncUserPackages(walletAddress: string) {
    try {
      // Get locally installed packages
      const installedPackages = await listPackages();
      
      // Find or create user
      let user = await User.findByWalletAddress(walletAddress);
      if (!user) {
        // Create new user
        const userData = {
          walletAddress,
          packages: [],
          collections: []
        };
        await User.create(userData);
        user = await User.findByWalletAddress(walletAddress);
      }
      
      // Prepare packages array
      const packages = installedPackages.map(pkg => ({
        name: pkg.name,
        version: pkg.version,
        installDate: new Date(),
        lastUpdated: new Date()
      }));
      
      // Update user packages
      await User.updatePackages(walletAddress, packages);
      
      // Update global package stats
      for (const pkg of installedPackages) {
        const existingPackage = await Package.findByName(pkg.name);
        if (!existingPackage) {
          await Package.create({
            name: pkg.name,
            pname: pkg.pname,
            description: pkg.description,
            license: pkg.license,
            type: pkg.type,
            users: [user._id]
          });
        } else {
          // Update existing package
          await Package.collection().updateOne(
            { name: pkg.name },
            { 
              $addToSet: { users: user._id }
            }
          );
        }
      }
      
      return packages;
    } catch (err: any) {
      throw AppError.newError500(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to sync user packages: ${err.message}`);
    }
  }

  async pushUserPackagesToHub(walletAddress: string) {
    try {
      const user = await User.findByWalletAddress(walletAddress);
      if (!user || !user.packages || user.packages.length === 0) {
        throw AppError.newError404(ErrorCode.NOT_FOUND, "No packages found for this user");
      }
      
      const payload = {
        packages: user.packages,
        metadata: {
          walletAddress,
          totalCount: user.packages.length,
          timestamp: new Date().toISOString(),
          source: "beacon-cli"
        }
      };
      
      const blobId = await this.walrusService.uploadBlob(
        payload,
        `User package list for ${walletAddress}`
      );
      
      // Update package records with blob reference
      for (const pkg of user.packages) {
        const blobData = {
          blobId,
          timestamp: new Date(),
          metadata: payload.metadata
        };
        await Package.addWalrusBlob(pkg.name, blobData);
      }
      
      return { blobId, packages: user.packages };
    } catch (err: any) {
      throw AppError.newError500(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to push packages to hub: ${err.message}`);
    }
  }
}

export default new UserPackageService();
