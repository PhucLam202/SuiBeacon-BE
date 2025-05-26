
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
import { AppError } from "../middlewares/e/AppError.js";
import { ErrorCode } from "../middlewares/e/ErrorCode.js";
import dotenv from "dotenv";
import AchievementModel from "../models/achievementsModel.js";
dotenv.config();


class AchievementsService {
  private suiClient: SuiClient;
  private walrusClient: WalrusClient;
  private keypair: Ed25519Keypair;

  constructor() {
    this.suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
    this.walrusClient = new WalrusClient({
      network: "mainnet",
      // Cast the SuiClient to any to bypass the type checking
      suiClient: this.suiClient as any,
    });
    // Add environment variables here
    const mnemonic = process.env.SUI_MNEMONIC;
    const MnemonicStr = mnemonic as string ;
    if (!mnemonic) {
      throw new Error("SUI_MNEMONIC environment variable is not defined");
    }
    this.keypair = Ed25519Keypair.deriveKeypair(MnemonicStr);
  }

  async uploadBlob(data: any): Promise<string> {
    try {
      // Extract data from payload
      const { image, mimeType, description, userAddress, title, fileName } = data;
      
      if (!image) {
        throw AppError.newError400(
          ErrorCode.INVALID_INPUT,
          "Image data is required"
        );
      }

      // Check wallet balance before uploading
      await this.checkBalance();
      
      // Set content type based on provided mimeType or default to image/jpeg
      const contentType = mimeType;
      
      // Prepare metadata for the blob
      const attributes: Record<string, string> = {
        contentType: contentType,
        contentLength: image.length.toString(),
        userAddress: userAddress,
      };

      // Add optional metadata
      if (description) attributes.description = description;
      if (title) attributes.title = title;
      if (fileName) attributes.fileName = fileName;

      // Upload to Walrus with 3 epochs duration (adjust as needed)
      const { blobId } = await this.walrusClient.writeBlob({
        blob: image,
        deletable: false,
        epochs: 3, 
        signer: this.keypair,
        attributes: attributes,
      });

      // Save achievement record to database
      await this.saveAchievementRecord(userAddress, blobId, title, description);
      
      return blobId;
    } catch (error: any) {
      console.error("Error uploading blob:", error);
      
      // Handle specific error types
      if (error.message?.includes("insufficient balance")) {
        throw AppError.newError400(
          ErrorCode.WALRUS_INSUFFICIENT_BALANCE,
          "Insufficient balance to upload blob"
        );
      }
      
      throw AppError.newError500(
        ErrorCode.WALRUS_UPLOAD_FAILED,
        `Failed to upload blob: ${error.message}`
      );
    }
  }

  // Helper method to save achievement record
  private async saveAchievementRecord(
    userAddress: string, 
    blobId: string, 
    title: string, 
    description: string
  ): Promise<void> {
    try {
      // Generate image URL from blobId
      const image = `https://drive.google.com/uc?export=view&id=${blobId}`;
      
      // Create a new achievement record in the database
      const achievementData = {
        userAddress,
        blobId,
        title,
        description,
        image: image, // Add the image URL here
        status: false, // Default status
        createdAt: new Date()
      };
      
      // Use your AchievementModel to save the record
      await AchievementModel.create(achievementData);
    } catch (error) {
      console.error("Error saving achievement record:", error);
      // We don't throw here to avoid failing the upload if DB save fails
      // The blob is already uploaded to Walrus
    }
  }

  // Check if wallet has sufficient balance
  async checkBalance(): Promise<void> {
    try {
      const address = this.keypair.toSuiAddress();
      const { totalBalance } = await this.suiClient.getBalance({
        owner: address,
      });
      
      // Ensure minimum balance (adjust threshold as needed)
      const minBalance = BigInt(1000000); // 0.001 SUI
      if (BigInt(totalBalance) < minBalance) {
        throw new Error("insufficient balance");
      }
    } catch (error) {
      throw AppError.newError500(
        ErrorCode.WALRUS_BALANCE_CHECK_FAILED,
        `Failed to check wallet balance: ${error}`
      );
    }
  }

  async readBlobAsText(
    blobId: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    try {
      // First read the blob as binary data
      const blob = await this.walrusClient.readBlob({ blobId });
      
      // Then convert the binary data to text using the specified encoding
      return Buffer.from(blob).toString(encoding);
    } catch (error: any) {
      // Handle different error cases
      if (error.status === 404) {
        throw AppError.newError404(
          ErrorCode.WALRUS_BLOB_NOT_FOUND,
          "WALRUS_BLOB_NOT_FOUND " + (error as Error).message
        );
      } else {
        throw AppError.newError500(
          ErrorCode.FILE_DOWNLOAD_ERROR,
          "FILE_DOWNLOAD_ERROR " + (error as Error).message
        );
      }
    }
  }
  
  // Thêm phương thức để đọc blob dưới dạng raw data
  async readBlobAsRaw(blobId: string): Promise<{ data: Buffer; contentType: string }> {
    try {
      // Đọc blob từ Walrus
      const blob = await this.walrusClient.readBlob({ blobId });
      
      // Tạo buffer từ blob
      const buffer = Buffer.from(blob);
      
      // Đoán contentType dựa trên nội dung của blob
      let contentType = 'application/octet-stream';
      
      // Kiểm tra các signature phổ biến của file hình ảnh
      if (buffer.length > 4) {
        // JPEG: Bắt đầu với FF D8
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          contentType = 'image/jpeg';
        }
        // PNG: Bắt đầu với 89 50 4E 47
        else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
          contentType = 'image/png';
        }
        // GIF: Bắt đầu với GIF8
        else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
          contentType = 'image/gif';
        }
        // WebP: Bắt đầu với RIFF....WEBP
        else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && 
                 buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
          contentType = 'image/webp';
        }
        else {
          try {
            const text = buffer.toString('utf-8');
            if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
              JSON.parse(text);
              contentType = 'application/json';
            } else if (text.trim().startsWith('<') && text.trim().endsWith('>')) {
              contentType = 'text/html';
            } else {
              contentType = 'text/plain';
            }
          } catch (e) {
            // Nếu không phải JSON, giữ nguyên contentType mặc định
          }
        }
      }
      
      return {
        data: buffer,
        contentType
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw AppError.newError404(
          ErrorCode.WALRUS_BLOB_NOT_FOUND,
          "WALRUS_BLOB_NOT_FOUND " + (error as Error).message
        );
      } else {
        throw AppError.newError500(
          ErrorCode.FILE_DOWNLOAD_ERROR,
          "FILE_DOWNLOAD_ERROR " + (error as Error).message
        );
      }
    }
  }
  
  /**
   * Lấy thông tin chi tiết của một achievement từ blobId
   * @param blobId ID của blob cần lấy thông tin
   * @returns Thông tin chi tiết của achievement
   */
  async getAchievementDetails(blobId: string): Promise<any> {
    try {
      // Find achievement in database
      const achievement = await AchievementModel.findOne({ blobId }).lean();
      
      if (!achievement) {
        throw AppError.newError404(
          ErrorCode.ACHIEVEMENT_NOT_FOUND,
          `Achievement with blobId ${blobId} not found`
        );
      }
      
      // Generate image URL
      const imageUrl = `/v1/achievements/image/${blobId}`;
      
      // Chỉ sử dụng thông tin từ database
      return {
        achievement: {
          ...achievement,
          image: imageUrl
        },
        metadata: {
          contentType: 'image/jpeg', // Mặc định
          fileName: achievement.title || 'unknown',
          description: achievement.description || '',
          title: achievement.title || 'Achievement',
          createdAt: achievement.createdAt
        }
      };
    } catch (error: any) {
      // Handle specific errors
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error.name === 'CastError' || error.name === 'ValidationError') {
        throw AppError.newError400(
          ErrorCode.INVALID_INPUT,
          `Invalid input: ${error.message}`
        );
      }
      
      throw AppError.newError500(
        ErrorCode.INTERNAL_SERVER_ERROR,
        `Failed to get achievement details: ${error.message}`
      );
    }
  }
  
  
}


export default AchievementsService;
 
