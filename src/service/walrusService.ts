import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
import { AppError } from "../middlewares/e/AppError.js";
import { ErrorCode } from "../middlewares/e/ErrorCode.js";
import dotenv from "dotenv";

dotenv.config();
class WalrusService {
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

  async uploadBlob(data?: any, description?: string): Promise<string> {
    try {
      let fileData: Uint8Array;
      if (data) {
        if (typeof data === "string") {
          // If data is a string
          fileData = new TextEncoder().encode(data);
        } else if (data instanceof Uint8Array) {
          // If data is already a Uint8Array
          fileData = data;
        } else {
          // If data is a JSON object
          fileData = new TextEncoder().encode(JSON.stringify(data));
        }
      } else {
        fileData = new TextEncoder().encode("Hello from the walrus SDK!!!\n");
      }

      // Prepare attributes with contentType and contentLength
      const attributes: Record<string, string> = {
        contentType: "text/plain",
        contentLength: fileData.length.toString(),
      };

      // Add description to attributes if provided
      if (description) {
        attributes.description = description;
      }

      const { blobId } = await this.walrusClient.writeBlob({
        blob: fileData,
        deletable: false,
        epochs: 3,
        signer: this.keypair,
        attributes: attributes,
      });

      return blobId;
    } catch (error: any) {
      // Handle specific error types from StorageNodeAPIError
      if (error.status === 400) {
        // BadRequestError
        throw AppError.newError400(
          ErrorCode.WALRUS_INVALID_FORMAT,
          `Invalid request format: ${error.error?.message || error.message}`
        );
      } else if (error.status === 401) {
        // AuthenticationError
        throw AppError.newError403(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Authentication failed: ${error.error?.message || error.message}`
        );
      } else if (error.status === 403) {
        // PermissionDeniedError
        throw AppError.newError403(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Permission denied: ${error.error?.message || error.message}`
        );
      } else if (error.status === 404) {
        // NotFoundError
        throw AppError.newError404(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Resource not found: ${error.error?.message || error.message}`
        );
      } else if (error.status === 409) {
        // ConflictError
        throw AppError.newError400(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Resource conflict: ${error.error?.message || error.message}`
        );
      } else if (error.status === 422) {
        // UnprocessableEntityError
        throw AppError.newError400(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Unprocessable entity: ${error.error?.message || error.message}`
        );
      } else if (error.status === 429) {
        // RateLimitError
        throw AppError.newError429(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Rate limit exceeded: ${error.error?.message || error.message}`
        );
      } else if (error.status === 451) {
        // LegallyUnavailableError
        throw AppError.newError403(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Content legally unavailable: ${error.error?.message || error.message}`
        );
      } else if (error.constructor.name === 'ConnectionError') {
        throw AppError.newError500(
          ErrorCode.WALRUS_CONNECTION_ERROR,
          `Connection error: ${error.message}`
        );
      } else if (error.constructor.name === 'ConnectionTimeoutError') {
        throw AppError.newError500(
          ErrorCode.WALRUS_TIMEOUT,
          `Connection timeout: ${error.message}`
        );
      } else if (error.constructor.name === 'UserAbortError') {
        throw AppError.newError400(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          `Request aborted: ${error.message}`
        );
      } else {
        // InternalServerError or other errors
        throw AppError.newError500(
          ErrorCode.WALRUS_UPLOAD_FAILED,
          "WALRUS_UPLOAD_FAILED " + (error as Error).message
        );
      }
    }
  }

  async ReadBlod(blobId: string): Promise<Uint8Array> {
    try {
      const blob = await this.walrusClient.readBlob({ blobId });
      return blob;
    } catch (error: any) {
      throw AppError.newError500(
        ErrorCode.WALRUS_BLOB_NOT_FOUND,
        "WALRUS_BLOB_NOT_FOUND " + (error as Error).message
      );
    }
  }
  async readBlobAsText(
    blobId: string,
    encoding: BufferEncoding = "utf-8"
  ): Promise<string> {
    try {
      const blob = await this.ReadBlod(blobId);
      return Buffer.from(blob).toString(encoding);
    } catch (error: any) {
      throw AppError.newError500(
        ErrorCode.FILE_DOWNLOAD_ERROR,
        "FILE_DOWNLOAD_ERROR " + (error as Error).message
      );
    }
  }

  // Check balance
  async checkBalance(): Promise<{ suiBalance: string; walBalance: string }> {
    try {
      const address = this.keypair.toSuiAddress();
      console.log("Checking balances for address:", address);

      // Check SUI balance
      const suiCoins = await this.suiClient.getCoins({
        owner: address,
      });

      let suiTotal = BigInt(0);
      for (const coin of suiCoins.data) {
        suiTotal += BigInt(coin.balance);
      }

      // Check WAL tokens
      const walTokens = await this.suiClient.getCoins({
        owner: address,
        coinType:
          "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL",
      });

      let walTotal = BigInt(0);
      for (const coin of walTokens.data) {
        walTotal += BigInt(coin.balance);
      }

      console.log("SUI balance:", suiTotal.toString(), "MIST");
      console.log("WAL balance:", walTotal.toString());

      return {
        suiBalance: suiTotal.toString(),
        walBalance: walTotal.toString(),
      };
    } catch (error: any) {
      throw AppError.newError500(
        ErrorCode.WALRUS_BALANCE_CHECK_FAILED,
        "WALRUS_BALANCE_CHECK_FAILED " + (error as Error).message
      );
    }
  }
}

export default WalrusService;
