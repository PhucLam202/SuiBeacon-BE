import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
import { AppError } from "../middlewares/e/AppError";
import { ErrorCode } from "../middlewares/e/ErrorCode";

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
    //dán env vô đây
    const mnemonic = process.env.SUI_MNEMONIC;
    if (!mnemonic) {
      throw new Error("SUI_MNEMONIC environment variable is not defined");
    }
    this.keypair = Ed25519Keypair.deriveKeypair(mnemonic as string);
    console.log("Using address:", this.keypair.toSuiAddress());
  }

  async uploadBlob(data?: any, description?: string): Promise<string> {
    try {
      let fileData: Uint8Array;
      if (data) {
        if (typeof data === "string") {
          // Nếu data là string
          fileData = new TextEncoder().encode(data);
        } else if (data instanceof Uint8Array) {
          // Nếu data đã là Uint8Array
          fileData = data;
        } else {
          // Nếu data là JSON object
          fileData = new TextEncoder().encode(JSON.stringify(data));
        }
      } else {
        fileData = new TextEncoder().encode("Hello from the walrus SDK!!!\n");
      }

      // Chuẩn bị attributes với contentType và contentLength
      const attributes: Record<string, string> = {
        contentType: "text/plain",
        contentLength: fileData.length.toString(),
      };

      // Thêm description vào attributes nếu có
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
      throw AppError.newError500(
        ErrorCode.WALRUS_UPLOAD_FAILED,
        "WALRUS_UPLOAD_FAILED " + (error as Error).message
      );
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

  //check balance
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
