// Định nghĩa kiểu dữ liệu cho response
export interface PushResponse {
  success: boolean;
  message?: string;
  blobId: string;
  payload: {
    packages: Array<{
      name: string;
      version: string;
      [key: string]: any;
    }>;
    metadata: {
      totalCount: number;
      timestamp: string;
      source: string;
    };
  };
}