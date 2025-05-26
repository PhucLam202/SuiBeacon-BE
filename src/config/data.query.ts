import DataModel, { IData } from "../models/DataModel.js";
import AchievementModel from "../models/achievementsModel.js";
import Package from "../models/Package.js";
import WalrusService from "../service/walrusService.js";

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
    .select("blobId createdAt")
    .lean();
}

/** Query with pagination */
export async function getAllPaginated(
  walletAddress: string,
  page = 1,
  limit = 10
): Promise<IData[]> {
  const skip = (page - 1) * limit;
  return await DataModel.find({ walletAddress })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}

/** Update blob (if metadata needs to be added later) */
export async function update(
  blobId: string,
  data: Partial<IData>
): Promise<IData | null> {
  return await DataModel.findOneAndUpdate({ blobId }, data, {
    new: true,
  }).lean();
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
    packages,
  };
}

export async function getAllDataWithPackages(
  walletAddress: string,
  page = 1,
  limit = 10
): Promise<any[]> {
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

  // Combine Data and packages (only keep name + version)
  return dataList.map((data) => ({
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
/**
 * Count unique projects for a wallet address
 * @param walletAddress Wallet address
 * @returns Number of unique projects
 */
export async function countUniqueProjects(
  walletAddress: string
): Promise<number> {
  const uniqueProjects = await DataModel.distinct("projectName", {
    walletAddress,
  });
  return uniqueProjects.length;
}

/**
 * Count total packages for a wallet address
 * @param walletAddress Wallet address
 * @returns Total number of packages
 */
export async function countTotalPackages(
  walletAddress: string
): Promise<number> {
  return await Package.countDocuments({ walletAddress });
}

/**
 * Get data with package counts for each blobId
 * @param walletAddress Wallet address
 * @returns Array of data objects with package counts
 */
export async function getDataWithPackageCounts(
  walletAddress: string
): Promise<any[]> {
  // Get all data records for the wallet
  const dataList = await DataModel.find({ walletAddress })
    .sort({ createdAt: -1 })
    .lean();

  // For each data record, count the packages with the same blobId
  const result = [];
  for (const data of dataList) {
    const packageCount = await Package.countDocuments({ blobId: data.blobId });

    result.push({
      ...data,
      packageCount,
    });
  }

  return result;
}

/**
 * Get all achievements for a wallet address with pagination
 * @param userAddress Wallet address
 * @param page Page number
 * @param limit Items per page
 * @returns Array of achievement objects
 */
export async function getAllAchievements(userAddress: string, page = 1, limit = 10): Promise<any[]> {
  const skip = (page - 1) * limit;

  // Chuẩn hóa địa chỉ ví (loại bỏ dấu ngoặc kép và khoảng trắng)
  const normalizedAddress = userAddress.replace(/"/g, '').trim();
  
  console.log(`Searching for achievements with address: ${normalizedAddress}`);
  
  // Get achievements list
  const achievements = await AchievementModel.find({ 
    userAddress: normalizedAddress 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  console.log(`Found ${achievements.length} achievements`);
  return achievements;
}

/**
 * Count total achievements for a wallet address
 * @param userAddress Wallet address
 * @returns Total number of achievements
 */
export async function countAchievements(userAddress: string): Promise<number> {
  // Chuẩn hóa địa chỉ ví
  const normalizedAddress = userAddress.replace(/"/g, '').trim();
  
  // Count total records
  const total = await AchievementModel.countDocuments({ 
    userAddress: normalizedAddress 
  });
  
  return total;
}
