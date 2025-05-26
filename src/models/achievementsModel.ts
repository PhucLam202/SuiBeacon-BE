import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAchievement extends Document {
  userAddress: string;
  description: string;
  blobId: string;
  image: string;
  title?: string;
  status: boolean;
  createdAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  userAddress: { type: String, required: true, index: true },
  description: { type: String, required: false, index: true },
  title: { type: String, required: false },
  blobId: { type: String, required: true, unique: true },
  image: { type: String, required: true, index: true },
  status: { type: Boolean, required: true, default: false },
  createdAt: { type: Date, default: Date.now, index: true }
});  

const AchievementModel: Model<IAchievement> = mongoose.model<IAchievement>('achievement', AchievementSchema);

export default AchievementModel;
