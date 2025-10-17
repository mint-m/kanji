import mongoose from 'mongoose';
import {
  WordDocument,
  WordModel,
  LearningLevel,
  WordSearchFilters,
  WordLevelStats,
  StepRange,
} from '../interfaces/word';

// Define Word Schema with step field for sliding window system
const wordSchema = new mongoose.Schema<WordDocument>(
  {
    origin_entry_id: { type: String, required: true, unique: true },
    entry: { type: String, required: true }, // Hiragana reading
    pron: { type: String, default: '' }, // Kanji form (optional)
    level: {
      type: String,
      required: true,
      enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
      default: 'N5',
    },
    step: {
      type: Number,
      required: true,
    }, // Step within level (1-10) for sliding window
    means: {
      type: [String],
      required: true,
      default: [],
    }, // Korean meanings array
    parts: {
      type: [String],
      required: true,
      default: [],
    }, // Parts of speech array
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient sliding window queries
wordSchema.index({ level: 1, step: 1 });
wordSchema.index({ level: 1 });
wordSchema.index({ step: 1 });
wordSchema.index({ origin_entry_id: 1 }, { unique: true });
wordSchema.index({ entry: 'text', pron: 'text', means: 'text' }); // Text search index

// Instance methods
wordSchema.methods.hasKanji = function (this: WordDocument): boolean {
  return Boolean(this.pron && this.pron.trim().length > 0);
};

wordSchema.methods.getPrimaryMeaning = function (this: WordDocument): string {
  return this.means.length > 0 ? this.means[0] : '';
};

wordSchema.methods.getDisplayForm = function (this: WordDocument): string {
  return this.hasKanji() ? this.pron! : this.entry;
};

wordSchema.methods.isInStepRange = function (this: WordDocument, start: number, end: number): boolean {
  return this.step >= start && this.step <= end;
};

wordSchema.methods.getDifficultyScore = function (this: WordDocument): number {
  // Higher step = higher difficulty, scale 1-10
  return this.step;
};

wordSchema.methods.getSearchableText = function (this: WordDocument): string {
  const searchParts = [this.entry];
  if (this.pron) searchParts.push(this.pron);
  searchParts.push(...this.means);
  return searchParts.join(' ').toLowerCase();
};

// Static methods for sliding window functionality
wordSchema.statics.getWordsInStepRange = function (
  level: LearningLevel,
  startStep: number,
  endStep: number
): Promise<WordDocument[]> {
  return this.find({
    level: level,
    step: { $gte: startStep, $lte: endStep },
  });
};

wordSchema.statics.getWordsByLevel = function (level: LearningLevel): Promise<WordDocument[]> {
  return this.find({ level: level });
};

wordSchema.statics.getWordsByStep = function (level: LearningLevel, step: number): Promise<WordDocument[]> {
  return this.find({ level: level, step: step });
};

wordSchema.statics.getStepRange = function (level: LearningLevel): Promise<StepRange[]> {
  return this.aggregate([
    { $match: { level: level } },
    {
      $group: {
        _id: null,
        min: { $min: '$step' },
        max: { $max: '$step' },
      },
    },
    {
      $project: {
        _id: 0,
        min: 1,
        max: 1,
      },
    },
  ]);
};

wordSchema.statics.getLevelStats = function (level?: LearningLevel): Promise<WordLevelStats[]> {
  const matchStage = level ? { $match: { level: level } } : { $match: {} };

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
    { $sort: { level: -1 } }, // N5, N4, N3, N2, N1
  ]);
};

wordSchema.statics.getWordsPerStep = function (level: LearningLevel): Promise<{ step: number; count: number }[]> {
  return this.aggregate([
    { $match: { level: level } },
    {
      $group: {
        _id: '$step',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        step: '$_id',
        count: 1,
        _id: 0,
      },
    },
    { $sort: { step: 1 } },
  ]);
};

wordSchema.statics.searchWords = function (filters: WordSearchFilters, limit: number = 100): Promise<WordDocument[]> {
  const query: any = {};

  if (filters.level) {
    query.level = filters.level;
  }

  if (filters.step) {
    query.step = filters.step;
  }

  if (filters.stepRange) {
    query.step = { $gte: filters.stepRange.start, $lte: filters.stepRange.end };
  }

  if (filters.searchTerm) {
    query.$or = [
      { entry: { $regex: filters.searchTerm, $options: 'i' } },
      { pron: { $regex: filters.searchTerm, $options: 'i' } },
      { means: { $in: [new RegExp(filters.searchTerm, 'i')] } },
    ];
  }

  if (filters.partsOfSpeech && filters.partsOfSpeech.length > 0) {
    query.parts = { $in: filters.partsOfSpeech };
  }

  if (filters.hasKanji !== undefined) {
    if (filters.hasKanji) {
      query.pron = { $ne: '' };
    } else {
      query.pron = '';
    }
  }

  return this.find(query).limit(limit);
};

wordSchema.statics.searchByText = function (
  searchTerm: string,
  level?: LearningLevel,
  limit: number = 50
): Promise<WordDocument[]> {
  const query: any = {
    $text: { $search: searchTerm },
  };

  if (level) {
    query.level = level;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

wordSchema.statics.getRandomWords = function (
  level?: LearningLevel,
  count: number = 10,
  stepRange?: { start: number; end: number }
): Promise<WordDocument[]> {
  const matchStage: any = {};

  if (level) matchStage.level = level;
  if (stepRange) matchStage.step = { $gte: stepRange.start, $lte: stepRange.end };

  return this.aggregate([{ $match: matchStage }, { $sample: { size: count } }]);
};

wordSchema.statics.validateStepRange = async function (
  level: LearningLevel,
  start: number,
  end: number
): Promise<boolean> {
  const stats = await (this as WordModel).getLevelStats(level);
  if (stats.length === 0) return false;

  const levelStats = stats[0];
  return start >= levelStats.minStep && end <= levelStats.maxStep && start <= end;
};

wordSchema.statics.getNextAvailableStep = async function (level: LearningLevel): Promise<number> {
  const stats = await (this as WordModel).getLevelStats(level);
  if (stats.length === 0) return 1;

  return Math.min(10, stats[0].maxStep + 1);
};

wordSchema.statics.rebalanceSteps = async function (level: LearningLevel): Promise<{ moved: number; errors: any[] }> {
  const words = await this.find({ level }).sort({ step: 1, entry: 1 });
  const errors: any[] = [];
  let moved = 0;

  const wordsPerStep = 40; // Target 40 words per step
  const totalSteps = Math.ceil(words.length / wordsPerStep);

  for (let i = 0; i < words.length; i++) {
    const targetStep = Math.floor(i / wordsPerStep) + 1;
    if (words[i].step !== targetStep) {
      try {
        await this.updateOne({ _id: words[i]._id }, { step: Math.min(targetStep, 10) });
        moved++;
      } catch (error) {
        errors.push({ wordId: words[i]._id, error });
      }
    }
  }

  return { moved, errors };
};

wordSchema.statics.bulkUpdateSteps = async function (
  updates: { wordId: mongoose.Types.ObjectId; newStep: number }[]
): Promise<{ modified: number; errors: any[] }> {
  const errors: any[] = [];
  let modified = 0;

  for (const update of updates) {
    try {
      const result = await this.updateOne({ _id: update.wordId }, { step: Math.max(1, Math.min(10, update.newStep)) });
      modified += result.modifiedCount;
    } catch (error) {
      errors.push({ wordId: update.wordId, error });
    }
  }

  return { modified, errors };
};

wordSchema.statics.importWords = async function (
  words: Partial<WordDocument>[]
): Promise<{ created: number; errors: any[] }> {
  const errors: any[] = [];
  let created = 0;

  for (const wordData of words) {
    try {
      if (!wordData.origin_entry_id || !wordData.entry || !wordData.level) {
        errors.push({ data: wordData, error: 'Missing required fields' });
        continue;
      }

      const existingWord = await this.findOne({ origin_entry_id: wordData.origin_entry_id });
      if (existingWord) {
        errors.push({ data: wordData, error: 'Word already exists' });
        continue;
      }

      await this.create(wordData);
      created++;
    } catch (error) {
      errors.push({ data: wordData, error });
    }
  }

  return { created, errors };
};

wordSchema.statics.exportWords = async function (
  level?: LearningLevel,
  format: 'json' | 'csv' = 'json'
): Promise<WordDocument[] | string> {
  const query = level ? { level } : {};
  const words = await this.find(query).lean();

  if (format === 'json') {
    return words as WordDocument[];
  }

  // CSV format
  const headers = ['origin_entry_id', 'entry', 'pron', 'level', 'step', 'means', 'parts'];
  const csvRows = [headers.join(',')];

  for (const word of words) {
    const row = [
      word.origin_entry_id,
      word.entry,
      word.pron || '',
      word.level,
      word.step,
      `"${word.means.join(';')}"`,
      `"${word.parts.join(';')}"`,
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
};

wordSchema.statics.findDuplicateEntries = function (): Promise<
  { entry: string; count: number; ids: mongoose.Types.ObjectId[] }[]
> {
  return this.aggregate([
    {
      $group: {
        _id: '$entry',
        count: { $sum: 1 },
        ids: { $push: '$_id' },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $project: {
        entry: '$_id',
        count: 1,
        ids: 1,
        _id: 0,
      },
    },
  ]);
};

wordSchema.statics.cleanupInvalidWords = async function (): Promise<{ removed: number; errors: any[] }> {
  const errors: any[] = [];
  let removed = 0;

  try {
    // Remove words with invalid steps
    const invalidSteps = await this.deleteMany({
      $or: [{ step: { $lt: 1 } }, { step: { $gt: 10 } }],
    });
    removed += invalidSteps.deletedCount || 0;

    // Remove words with empty required fields
    const emptyFields = await this.deleteMany({
      $or: [{ entry: '' }, { origin_entry_id: '' }, { level: { $nin: ['N5', 'N4', 'N3', 'N2', 'N1'] } }],
    });
    removed += emptyFields.deletedCount || 0;
  } catch (error) {
    errors.push(error);
  }

  return { removed, errors };
};

wordSchema.statics.updateLevelStepDistribution = async function (level: LearningLevel): Promise<void> {
  // Redistribute words evenly across steps 1-10
  const words = await this.find({ level }).sort({ entry: 1 });
  const wordsPerStep = Math.ceil(words.length / 10);

  for (let i = 0; i < words.length; i++) {
    const targetStep = Math.min(Math.floor(i / wordsPerStep) + 1, 10);
    if (words[i].step !== targetStep) {
      await this.updateOne({ _id: words[i]._id }, { step: targetStep });
    }
  }
};

// Create Model & Export
const Word = mongoose.model<WordDocument, WordModel>('Word', wordSchema, 'word');

export default Word;
