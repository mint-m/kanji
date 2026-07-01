import mongoose from 'mongoose';
import { LearningLevel } from '../types/common';
import { WordDocument, WordModel, WordLevelStats } from '../interfaces/word';

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

wordSchema.statics.getLevelStats = function (level?: LearningLevel): Promise<WordLevelStats[]> {
  const matchStage = level ? { $match: { level } } : { $match: {} };

  return this.aggregate([
    matchStage,
    {
      $group: {
        _id: '$level',
        totalWords: { $sum: 1 },
        minStep: { $min: '$step' },
        maxStep: { $max: '$step' },
        stepsCount: { $addToSet: '$step' },
      },
    },
    {
      $project: {
        level: '$_id',
        totalWords: 1,
        minStep: 1,
        maxStep: 1,
        stepsCount: { $size: '$stepsCount' },
        averageWordsPerStep: { $divide: ['$totalWords', { $size: '$stepsCount' }] },
      },
    },
    { $sort: { level: -1 } },
  ]);
};

const Word = mongoose.model<WordDocument, WordModel>('Word', wordSchema, 'word');

export default Word;
