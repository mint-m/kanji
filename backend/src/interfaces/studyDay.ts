import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';

export interface StudyDayDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  date: string; // 한국 시간 'YYYY-MM-DD'
  count: number; // 그날 답한 카드 수 (진도·집중 학습, 복습)
}

export interface StudyDayModel extends Model<StudyDayDocument> {
  record(userId: mongoose.Types.ObjectId, now?: Date): Promise<void>;
  findRecent(userId: mongoose.Types.ObjectId, days: number, now?: Date): Promise<{ date: string; count: number }[]>;
}

export default StudyDayModel;
