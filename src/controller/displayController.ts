
import { Request, Response, NextFunction } from "express";
import { CustomExpress } from "../middlewares/app/customResponse";
import WalrusService from "../service/walrusService";
import * as DataQuery from '../config/data.query';

class DisplayController {
  private walrusService: WalrusService;

  constructor() {
    this.walrusService = new WalrusService();
  }

  async getDataWithPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const blobId = req.params.blobId || (req.query.blobId as string);
      
      if (!blobId) {
        return res.status(400).json({
          success: false,
          message: "Missing blobId parameter"
        });
      }
      
      const data = await DataQuery.getDataWithPackages(blobId);
      
      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Data not found"
        });
      }
      
      appExpress.response200({ data });
    } catch (e) {
      next(e);
    }
  }


  async getAllDataWithPackages(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const walletAddress = req.params.walletAddress || (req.query.walletAddress as string) || req.headers['wallet-address'] as string;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: "Wallet address is required. Please provide it in the request header 'wallet-address', in the URL path, or as a query parameter."
        });
      }
      
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      
      // Lấy danh sách Data và packages
      const dataList = await DataQuery.getAllDataWithPackages(walletAddress, page, limit);
      
      // Đếm tổng số bản ghi để phân trang
      const total = await DataQuery.countData(walletAddress);
      
      appExpress.response200({
        data: dataList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (e) {
      next(e);
    }
  }

  async getBlobAsText(req: Request, res: Response, next: NextFunction) {
    const appExpress = new CustomExpress(req, res, next);
    try {
      const blobId = req.params.blobId || (req.query.blobId as string);
      
      if (!blobId) {
        return res.status(400).json({
          success: false,
          message: "Missing blobId parameter"
        });
      }
      
      const encoding = (req.query.encoding as BufferEncoding) || "utf-8";
      
      // Lấy nội dung blob dưới dạng text
      const textContent = await this.walrusService.readBlobAsText(blobId, encoding);
      
      appExpress.response200({ 
        blobId,
        content: textContent 
      });
    } catch (e) {
      next(e);
    }
  }
}

export default DisplayController;

