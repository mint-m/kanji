import { Document, Model } from 'mongoose';
import mongoose from 'mongoose';

export interface WordReviewDocument extends Document {
  user_id: mongoose.Types.ObjectId;
  word_id: mongoose.Types.ObjectId;
  stage: number; // 0 = 다시 익히는 중, 1~6 = 복습 간격 단계
  next_review_at: Date;
  review_count: number;
  lapse_count: number;
  last_reviewed_at?: Date;
  learned_at: Date;

  isDue(now?: Date): boolean;
  applyAnswer(isCorrect: boolean, now?: Date): boolean;
}

export interface WordReviewModel extends Model<WordReviewDocument> {
  enroll(userId: mongoose.Types.ObjectId, wordId: mongoose.Types.ObjectId, now?: Date): Promise<void>;
  countDue(userId: mongoose.Types.ObjectId, now?: Date): Promise<number>;
}

export default WordReviewModel;
