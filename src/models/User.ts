import { getDb } from '../config/database';
import { ObjectId } from 'mongodb';

class User {
  static collection() {
    return getDb().collection('users');
  }

  static async findByWalletAddress(walletAddress: string) {
    return await this.collection().findOne({ walletAddress });
  }

  static async create(userData: any) {
    const result = await this.collection().insertOne({
      ...userData,
      createdAt: new Date()
    });
    return result.insertedId;
  }

  static async updatePackages(walletAddress: string, packages: any[]) {
    return await this.collection().updateOne(
      { walletAddress },
      { $set: { packages } }
    );
  }

  static async addToCollection(walletAddress: string, collection: any) {
    return await this.collection().updateOne(
      { walletAddress },
      { $push: { collections: collection } }
    );
  }
}

export default User;
