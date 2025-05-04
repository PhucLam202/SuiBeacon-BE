import DataModel, { IData } from '../models/DataModel';
import Package from '../models/Package';
import WalrusService from '../service/walrusService';

/** Create a new document */
export async function create(walletAddress: string, blobId: string) {
  return await DataModel.create({ walletAddress, blobId });
}

/** Query a document by blobId */
export async function get(blobId: string): Promise<IData | null> {
  return await DataModel.findOne({ blobId }).lean();
}

/** Query all blobIds by walletAddress */
export async function getAll(walletAddress: string): Promise<IData[]> {
  return await DataModel.find({ walletAddress })
    .sort({ createdAt: -1 })
    .select('blobId createdAt')
    .lean();
}

/** Query with pagination */
export async function getAllPaginated(walletAddress: string, page = 1, limit = 10): Promise<IData[]> {
  const skip = (page - 1) * limit;
  return await DataModel.find({ walletAddress })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

/** Update blob (if metadata needs to be added later) */
export async function update(blobId: string, data: Partial<IData>): Promise<IData | null> {
  return await DataModel.findOneAndUpdate({ blobId }, data, { new: true }).lean();
}

export async function getDataWithPackages(blobId: string): Promise<any> {
  // Get Data information
  const data = await DataModel.findOne({ blobId }).lean();
  
  if (!data) {
    return null;
  }
  
  // Get list of packages from Package collection
  const packages = await Package.find({ blobId }).lean();
  
  return {
    ...data,
    packages
  };
}

export async function getAllDataWithPackages(walletAddress: string, page = 1, limit = 10): Promise<any[]> {
  const skip = (page - 1) * limit;

  // Get Data list
  const dataList = await DataModel.find({ walletAddress })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (dataList.length === 0) {
    return [];
  }

  // Get all blobIds
  const blobIds = dataList.map(data => data.blobId);

  // Combine Data and packages (only keep name + version)
  return dataList.map(data => ({
    ...data,
    //packages: packagesByBlobId[data.blobId] || []
  }));
}

/**
 * Count total Data records for a wallet
 * @param walletAddress Wallet address
 * @returns Total number of records
 */
export async function countData(walletAddress: string): Promise<number> {
  return await DataModel.countDocuments({ walletAddress });
}
