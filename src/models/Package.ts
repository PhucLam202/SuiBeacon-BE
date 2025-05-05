import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  walletAddress: string;
  blobId: string;
  package: PackageDetail;
  metadata?: Record<string, any>;
}

export interface PackageDetail {
  name: string;
  version: string;
}

const PackageSchema = new Schema<IPackage>({
  walletAddress: { type: String, required: true, index: true },
  blobId: { type: String, required: true },
  package: {
    name: { type: String, required: true },
    version: { type: String, required: true }
  },
  metadata: { type: Schema.Types.Mixed }
});

export default mongoose.model<IPackage>('Package', PackageSchema);
