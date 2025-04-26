import { getDb } from '../config/database';
import { ObjectId } from 'mongodb';

class Package {
  static collection() {
    return getDb().collection('packages');
  }

  static async findByName(name: string) {
    return await this.collection().findOne({ name });
  }

  static async create(packageData: any) {
    const result = await this.collection().insertOne({
      ...packageData,
      installCount: 0,
      createdAt: new Date()
    });
    return result.insertedId;
  }

  static async incrementInstallCount(name: string) {
    return await this.collection().updateOne(
      { name },
      { $inc: { installCount: 1 } }
    );
  }

  static async addWalrusBlob(name: string, blobData: any) {
    return await this.collection().updateOne(
      { name },
      { $push: { walrusBlobs: blobData } }
    );
  }
}

export default Package;
