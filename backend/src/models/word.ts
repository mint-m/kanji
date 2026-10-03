import mongoose from 'mongoose';
import { WordDocument, WordModel } from '../interfaces/word';

const wordSchema = new mongoose.Schema<WordDocument>(
  {
    origin_entry_id: { type: String, required: true, unique: true },
    entry: { type: String, required: true },
    pron: { type: String, default: '' },
    level: {
      type: String,
      required: true,
      enum: ['N5', 'N4', 'N3', 'N2', 'N1', 'daily'],
      default: 'N5',
    },
    step: { type: Number, required: true },
    frequency: { type: Number, default: 9999 },
    means: { type: [String], required: true, default: [] },
    parts: { type: [String], required: true, default: [] },
  },
  { timestamps: true }
);

wordSchema.index({ level: 1, step: 1 });
wordSchema.index({ level: 1 });
wordSchema.index({ step: 1 });
wordSchema.index({ origin_entry_id: 1 }, { unique: true });

const Word = mongoose.model<WordDocument, WordModel>('Word', wordSchema, 'word');

export default Word;
