import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IData extends Document {
  walletAddress: string;
  blobId: string;
  createdAt: Date;
}

const DataSchema = new Schema<IData>({
  walletAddress: { type: String, required: true, index: true },
  blobId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

const DataModel: Model<IData> = mongoose.model<IData>('Data', DataSchema);

export default DataModel;
