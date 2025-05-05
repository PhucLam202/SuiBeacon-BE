import mongoose, { Schema, Document } from 'mongoose';

export interface IPushHistory extends Document {
  blobId: string;
  walletAddress: string;
  packageCount: number;
  createdAt: Date;
  source: string;
}

const PushHistorySchema = new Schema<IPushHistory>({
  blobId: { type: String, required: true },
  walletAddress: { type: String, required: true, index: true }, 
  packageCount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true } , 
  source: { type: String, required: false }
});

export default mongoose.model<IPushHistory>('PushHistory', PushHistorySchema);