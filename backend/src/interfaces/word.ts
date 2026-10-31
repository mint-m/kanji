import { Document, Model } from 'mongoose';
import { LearningLevel } from '../types/common';

export interface WordDocument extends Document {
  origin_entry_id: string;
  entry: string;
  pron?: string;
  level: LearningLevel;
  step: number;
  frequency: number;
  means: string[];
  parts: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type WordModel = Model<WordDocument>;

export default WordModel;
