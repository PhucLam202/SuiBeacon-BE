import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { AppError } from '../middlewares/e/AppError';
import { ErrorCode } from '../middlewares/e/ErrorCode';

dotenv.config();

let client: MongoClient;
let db: any;

const connectDB = async () => {
  try {
    client = new MongoClient(process.env.DATABASE_URL || '');
    await client.connect();
    db = client.db();
    console.log(`MongoDB Connected: ${client.options.hosts?.[0]}`);
    
    // Tạo các indexes cần thiết
    await db.collection('users').createIndex({ walletAddress: 1 }, { unique: true });
    await db.collection('packages').createIndex({ name: 1 });
    
    return { client, db };
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    throw AppError.newError500(ErrorCode.DB_CONNECTION_ERROR, `Failed to connect to database: ${error.message}`);    
  }
};

// Hàm để lấy instance db đã kết nối
export const getDb = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return db;
};

// Hàm để lấy client
export const getClient = () => {
  if (!client) {
    throw new Error('Database client not connected. Call connectDB first.');
  }
  return client;
};

export default connectDB;
