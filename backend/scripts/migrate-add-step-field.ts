#!/usr/bin/env ts-node

/**
 * Migration Script: Add 'step' field to Word documents (Improved Hash-Based Assignment)
 *
 * This script adds a 'step' field to existing Word documents based on:
 * 1. Fixed 40 words per step for optimal learning volume
 * 2. Improved FNV-1a hash-based assignment for better distribution
 * 3. Dynamic step count based on total words in each level
 * 4. Sliding window compatibility (3 steps = 120 words per deck)
 * 5. Uniform distribution across steps for balanced learning
 * 6. Transaction-based error recovery
 * 7. Memory-optimized streaming processing
 *
 * Usage: yarn migrate:add-step-field
 */

import mongoose from 'mongoose';
import config from '../src/config';

const { MONGO_URI } = config;

// Valid levels enum
const VALID_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
type Level = (typeof VALID_LEVELS)[number];

// TypeScript interfaces for type safety
interface WordDocument {
  _id: mongoose.Types.ObjectId;
  origin_entry_id: string;
  entry: string;
  level: string;
  parts?: string;
  pron?: string;
  means?: string[];
  step?: number;
}

interface ProcessingStats {
  totalProcessed: number;
  startTime: number;
  levelStats: Record<string, { processed: number; total: number; steps: number }>;
}

// Improved Word schema with correct types
const wordSchema = new mongoose.Schema(
  {
    origin_entry_id: { type: String, required: true, unique: true },
    entry: { type: String, required: true },
    level: { type: String, default: 'N5' }, // Fixed: String type with String default
    parts: { type: String, default: '' }, // Fixed: consistent default types
    pron: { type: String, default: '' }, // Fixed: consistent default types
    means: { type: Array, default: [] }, // Fixed: consistent default types
    step: { type: Number }, // New field to be added
  },
  {
    timestamps: true,
  }
);

const Word = mongoose.model<WordDocument>('Word', wordSchema, 'word');

/**
 * 스텝당 고정 단어 수
 * 슬라이딩 윈도우 3스텝 = 120개 단어로 적절한 학습량 보장
 */
const WORDS_PER_STEP = 40;

/**
 * 배치 처리 크기 (메모리 최적화)
 */
const BATCH_SIZE = 100;

/**
 * 레벨별 단어 수에 따라 필요한 step 수 계산
 */
function calculateRequiredSteps(totalWordsInLevel: number): number {
  return Math.ceil(totalWordsInLevel / WORDS_PER_STEP);
}

/**
 * 개선된 FNV-1a 해시 기반 step 할당
 * 더 균등한 분배를 위한 고품질 해시 함수
 */
function calculateHashBasedStep(entry: string, totalSteps: number): number {
  let hash = 2166136261; // FNV-1a 32-bit offset basis

  for (let i = 0; i < entry.length; i++) {
    hash ^= entry.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV-1a 32-bit prime, ensure unsigned 32-bit
  }

  return (hash % totalSteps) + 1;
}

/**
 * 성능 모니터링을 위한 진행률 계산
 */
function calculateProgress(current: number, total: number, startTime: number) {
  const elapsed = Date.now() - startTime;
  const rate = (current / elapsed) * 1000; // items per second
  const remaining = total - current;
  const eta = remaining > 0 ? remaining / rate : 0;

  return {
    percentage: ((current / total) * 100).toFixed(1),
    rate: rate.toFixed(1),
    eta: Math.ceil(eta),
    elapsed: Math.ceil(elapsed / 1000),
  };
}

/**
 * 필요한 인덱스 생성
 */
async function createIndexes() {
  console.log('🔍 Creating necessary indexes...');

  try {
    await Word.collection.createIndex({ step: 1 });
    await Word.collection.createIndex({ level: 1, step: 1 });
    await Word.collection.createIndex({ level: 1 });
    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.log('ℹ️  Indexes may already exist:', error);
  }
}

/**
 * 레벨별 단어 수 조회 (메모리 최적화)
 */
async function getWordCountsByLevel(): Promise<Record<string, number>> {
  const counts = await Word.aggregate([
    { $match: { step: { $exists: false } } },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
      },
    },
  ]);

  return counts.reduce((acc, { _id, count }) => {
    const level = _id || 'N5'; // Handle null/undefined levels
    acc[level] = count;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * 레벨별 스트림 처리
 */
async function processLevel(
  level: string,
  totalWords: number,
  stats: ProcessingStats,
  session: mongoose.ClientSession
): Promise<void> {
  const totalSteps = calculateRequiredSteps(totalWords);

  console.log(`\n🔄 Processing Level ${level}`);
  console.log(`   📊 ${totalWords} words → ${totalSteps} steps (${WORDS_PER_STEP} words/step)`);
  console.log(`   🔀 Using FNV-1a hash-based distribution`);

  // Initialize level stats
  stats.levelStats[level] = { processed: 0, total: totalWords, steps: totalSteps };

  // Stream processing with cursor
  const cursor = Word.find(
    {
      level: level === 'N5' ? { $in: [level, null, undefined] } : level,
      step: { $exists: false },
    },
    { entry: 1, level: 1, _id: 1 } // Projection optimization
  ).cursor();

  let batch: WordDocument[] = [];
  let processed = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    batch.push(doc);

    // Process batch when full
    if (batch.length >= BATCH_SIZE) {
      await processBatch(batch, totalSteps, session);

      processed += batch.length;
      stats.levelStats[level].processed = processed;
      stats.totalProcessed += batch.length;

      // Progress reporting
      const progress = calculateProgress(processed, totalWords, stats.startTime);
      console.log(
        `   ⏳ ${progress.percentage}% (${processed}/${totalWords}) | ${progress.rate}/s | ETA: ${progress.eta}s`
      );

      batch = [];
    }
  }

  // Process remaining words in batch
  if (batch.length > 0) {
    await processBatch(batch, totalSteps, session);
    processed += batch.length;
    stats.levelStats[level].processed = processed;
    stats.totalProcessed += batch.length;
  }

  console.log(`   ✅ Level ${level} completed: ${processed} words processed`);
}

/**
 * 배치 처리 함수
 */
async function processBatch(batch: WordDocument[], totalSteps: number, session: mongoose.ClientSession): Promise<void> {
  const bulkOps = batch.map((word) => {
    const step = calculateHashBasedStep(word.entry, totalSteps);

    return {
      updateOne: {
        filter: { _id: word._id },
        update: { $set: { step } },
      },
    };
  });

  await Word.bulkWrite(bulkOps, { session });
}

/**
 * 마이그레이션 검증
 */
async function validateMigration(): Promise<void> {
  console.log('\n🔍 Validating migration results...');

  const totalWords = await Word.countDocuments();
  const wordsWithStep = await Word.countDocuments({ step: { $exists: true } });
  const wordsWithoutStep = await Word.countDocuments({ step: { $exists: false } });

  console.log('\n📋 Migration Summary:');
  console.log(`   📊 Total words: ${totalWords}`);
  console.log(`   ✅ Words with step: ${wordsWithStep}`);
  console.log(`   ❌ Words without step: ${wordsWithoutStep}`);

  if (wordsWithoutStep === 0) {
    console.log('✅ Migration completed successfully - All words have step field!');
  } else {
    throw new Error(`⚠️ ${wordsWithoutStep} words are still missing step field`);
  }
}

/**
 * 해시 분포 품질 분석
 */
async function analyzeHashDistribution(): Promise<void> {
  console.log('\n📊 Analyzing hash distribution quality...');

  const distribution = await Word.aggregate([
    { $match: { step: { $exists: true } } },
    {
      $group: {
        _id: { level: '$level', step: '$step' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.level': 1, '_id.step': 1 } },
  ]);

  // Group by level for analysis
  const levelDistributions: Record<string, number[]> = {};
  let currentLevel = '';

  distribution.forEach((item) => {
    const level = item._id.level || 'N5';
    if (!levelDistributions[level]) {
      levelDistributions[level] = [];
    }
    levelDistributions[level].push(item.count);

    if (level !== currentLevel) {
      currentLevel = level;
      console.log(`\n   📈 Level ${level}:`);
    }
    console.log(`     Step ${item._id.step}: ${item.count} words`);
  });

  // Calculate distribution quality metrics
  console.log('\n   📊 Distribution Quality Analysis:');
  Object.entries(levelDistributions).forEach(([level, counts]) => {
    const mean = counts.reduce((sum, n) => sum + n, 0) / counts.length;
    const variance = counts.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / counts.length;
    const stdDev = Math.sqrt(variance);
    const maxDiff = Math.max(...counts) - Math.min(...counts);
    const coefficientOfVariation = (stdDev / mean) * 100;

    const qualityRating =
      coefficientOfVariation < 10 ? '🟢 Excellent' : coefficientOfVariation < 20 ? '🟡 Good' : '🔴 Poor';

    console.log(
      `     ${level}: avg=${mean.toFixed(1)}, std=${stdDev.toFixed(1)}, cv=${coefficientOfVariation.toFixed(
        1
      )}%, range=${maxDiff} ${qualityRating}`
    );

    // Check sliding window compatibility
    if (counts.length < 3) {
      console.log(`     ⚠️ ${level}: Only ${counts.length} steps - sliding window limited`);
    } else {
      console.log(
        `     ✅ ${level}: ${counts.length} steps - sliding window compatible (${counts.length * WORDS_PER_STEP} words)`
      );
    }
  });

  console.log(`\n   📏 Fixed Configuration:`);
  console.log(`     🔢 ${WORDS_PER_STEP} words per step`);
  console.log(`     📦 ${WORDS_PER_STEP * 3} words per sliding window (3 steps)`);
  console.log(`     🔀 FNV-1a hash-based pseudo-random distribution`);
}

/**
 * 메인 마이그레이션 함수
 */
async function addStepField() {
  const stats: ProcessingStats = {
    totalProcessed: 0,
    startTime: Date.now(),
    levelStats: {},
  };

  try {
    console.log('🚀 Starting improved migration: Add step field with FNV-1a hash distribution');

    // Connect to MongoDB
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is required');
    }

    await mongoose.connect(MONGO_URI, { dbName: 'kanji-db' });
    console.log('✅ Connected to MongoDB');

    // Create necessary indexes
    await createIndexes();

    // Get word counts by level
    const wordCountsByLevel = await getWordCountsByLevel();

    if (Object.keys(wordCountsByLevel).length === 0) {
      console.log('✅ All words already have step field. Migration complete!');
      return;
    }

    console.log('\n📊 Words to process by level:');
    let totalWordsToProcess = 0;
    Object.entries(wordCountsByLevel).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} words`);
      totalWordsToProcess += count;
    });
    console.log(`   📊 Total: ${totalWordsToProcess} words`);

    // Start transaction for error recovery
    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      console.log('\n🔄 Starting transaction-based processing...');

      // Process each level
      for (const [level, count] of Object.entries(wordCountsByLevel)) {
        await processLevel(level, count, stats, session);
      }

      console.log('\n✅ All levels processed successfully');
    });

    await session.endSession();

    const totalTime = Math.ceil((Date.now() - stats.startTime) / 1000);
    console.log(`\n⏱️ Migration completed in ${totalTime} seconds`);
    console.log(`📈 Average processing rate: ${(stats.totalProcessed / totalTime).toFixed(1)} words/second`);

    // Validate migration
    await validateMigration();

    // Analyze hash distribution
    await analyzeHashDistribution();
  } catch (error) {
    console.error('❌ Migration failed:', error);

    // Detailed error information
    if (error instanceof mongoose.Error) {
      console.error('📋 MongoDB Error Details:', {
        name: error.name,
        message: error.message,
      });
    }

    // Show progress at failure
    console.log('\n📊 Progress at failure:');
    Object.entries(stats.levelStats).forEach(([level, stat]) => {
      const percentage = stat.total > 0 ? ((stat.processed / stat.total) * 100).toFixed(1) : '0.0';
      console.log(`   ${level}: ${stat.processed}/${stat.total} (${percentage}%)`);
    });

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  addStepField()
    .then(() => {
      console.log('\n🎉 Migration process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration process failed:', error);
      process.exit(1);
    });
}

export default addStepField;
