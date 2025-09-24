#!/usr/bin/env ts-node

/**
 * Migration Script: Convert user.learningCheckpoint to UserProgress collection
 *
 * This script migrates existing user learning checkpoint data from the User model
 * to the new UserProgress collection structure for the sliding window deck system.
 *
 * Migration logic:
 * 1. Extract learningCheckpoint data from User documents
 * 2. Convert old level/step format to new sliding window format
 * 3. Create UserProgress documents for both 'main' session types
 * 4. Generate initial sliding window decks based on checkpoint position
 * 5. Preserve user progress while upgrading to new system
 *
 * Usage: yarn migrate:learning-checkpoint
 */

import mongoose from 'mongoose';
import config from '../src/config';

const { MONGO_URI } = config;

// Legacy User schema (for reading existing data)
const legacyUserSchema = new mongoose.Schema({
  type: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: false },
  learningCheckpoint: { type: Object, required: false },
});

// New UserProgress schema
const userProgressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    progress_type: {
      type: String,
      required: true,
      enum: ['main', 'sub'],
    },
    current_level: {
      type: String,
      required: true,
      enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
    },
    steps: {
      start: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
      end: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
    },
    shuffled_order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Word',
      },
    ],
    current_index: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// Word schema for deck generation
const wordSchema = new mongoose.Schema({
  origin_entry_id: { type: String, required: true, unique: true },
  entry: { type: String, required: true },
  pron: { type: String, default: '' },
  level: {
    type: String,
    required: true,
    enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
    default: 'N5',
  },
  step: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  means: {
    type: [String],
    required: true,
    default: [],
  },
  parts: {
    type: [String],
    required: true,
    default: [],
  },
});

const LegacyUser = mongoose.model('LegacyUser', legacyUserSchema, 'user');
const UserProgress = mongoose.model('UserProgress', userProgressSchema, 'user_progress');
const Word = mongoose.model('Word', wordSchema, 'word');

// Types
interface LearningCheckpoint {
  level: number;
  step: number;
}

interface MigrationStats {
  totalUsers: number;
  usersWithCheckpoints: number;
  userProgressCreated: number;
  errors: number;
  startTime: number;
}

/**
 * Convert legacy level number to new level string
 */
function convertLevelToString(levelNumber: number): string {
  const levelMap: Record<number, string> = {
    5: 'N5',
    4: 'N4',
    3: 'N3',
    2: 'N2',
    1: 'N1',
  };
  return levelMap[levelNumber] || 'N5';
}

/**
 * Calculate sliding window range from checkpoint
 * Uses 3-step sliding window with checkpoint as middle step when possible
 */
function calculateSlidingWindow(checkpointStep: number, maxStep: number): { start: number; end: number } {
  // Ensure checkpoint is within valid range
  const normalizedStep = Math.max(1, Math.min(checkpointStep, maxStep));

  // Calculate 3-step sliding window centered on checkpoint
  let start = Math.max(1, normalizedStep - 1);
  let end = Math.min(maxStep, start + 2);

  // Adjust if we can't fit 3 steps
  if (end - start < 2 && maxStep >= 3) {
    if (start === 1) {
      end = Math.min(maxStep, 3);
    } else if (end === maxStep) {
      start = Math.max(1, maxStep - 2);
    }
  }

  return { start, end };
}

/**
 * Generate shuffled deck for sliding window steps
 */
async function generateDeckForSteps(level: string, startStep: number, endStep: number): Promise<mongoose.Types.ObjectId[]> {
  const words = await Word.find({
    level: level,
    step: { $gte: startStep, $lte: endStep },
  }).select('_id');

  // Shuffle words for randomized learning order
  const shuffledWords = words
    .map((word) => word._id)
    .sort(() => Math.random() - 0.5);

  return shuffledWords;
}

/**
 * Get maximum step for a level
 */
async function getMaxStepForLevel(level: string): Promise<number> {
  const result = await Word.aggregate([
    { $match: { level: level } },
    {
      $group: {
        _id: null,
        maxStep: { $max: '$step' },
      },
    },
  ]);

  return result.length > 0 ? result[0].maxStep : 10;
}

/**
 * Process a single user's migration
 */
async function migrateUser(user: any, stats: MigrationStats, session: mongoose.ClientSession): Promise<void> {
  try {
    const checkpoint: LearningCheckpoint | undefined = user.learningCheckpoint;

    if (!checkpoint || typeof checkpoint.level !== 'number' || typeof checkpoint.step !== 'number') {
      console.log(`   ⏭️  User ${user.email}: No valid checkpoint, skipping`);
      return;
    }

    const level = convertLevelToString(checkpoint.level);
    const maxStep = await getMaxStepForLevel(level);
    const slidingWindow = calculateSlidingWindow(checkpoint.step, maxStep);

    console.log(
      `   🔄 User ${user.email}: Level ${checkpoint.level}(${level}) Step ${checkpoint.step} → Window ${slidingWindow.start}-${slidingWindow.end}`
    );

    // Generate deck for the sliding window
    const shuffledOrder = await generateDeckForSteps(level, slidingWindow.start, slidingWindow.end);

    // Calculate current_index based on checkpoint position within window
    const stepOffset = checkpoint.step - slidingWindow.start;
    const wordsPerStep = Math.ceil(shuffledOrder.length / (slidingWindow.end - slidingWindow.start + 1));
    const currentIndex = Math.min(stepOffset * wordsPerStep, shuffledOrder.length - 1);

    // Create main session UserProgress
    const mainProgress = new UserProgress({
      user_id: user._id,
      progress_type: 'main',
      current_level: level,
      steps: slidingWindow,
      shuffled_order: shuffledOrder,
      current_index: Math.max(0, currentIndex),
    });

    await mainProgress.save({ session });
    stats.userProgressCreated++;

    console.log(
      `   ✅ Created main progress: ${shuffledOrder.length} words, index ${currentIndex}/${shuffledOrder.length}`
    );
  } catch (error) {
    console.error(`   ❌ Failed to migrate user ${user.email}:`, error);
    stats.errors++;
  }
}

/**
 * Main migration function
 */
async function migrateLearningCheckpoint() {
  const stats: MigrationStats = {
    totalUsers: 0,
    usersWithCheckpoints: 0,
    userProgressCreated: 0,
    errors: 0,
    startTime: Date.now(),
  };

  try {
    console.log('🚀 Starting migration: Convert user.learningCheckpoint to UserProgress collection');

    // Connect to MongoDB
    if (!MONGO_URI) {
      throw new Error('MONGO_URI is required');
    }

    await mongoose.connect(MONGO_URI, { dbName: 'kanji-db' });
    console.log('✅ Connected to MongoDB');

    // Check if Word collection has step field
    const wordWithStep = await Word.findOne({ step: { $exists: true } });
    if (!wordWithStep) {
      throw new Error('❌ Word collection missing step field. Run migrate:add-step-field first.');
    }

    // Find users with learning checkpoints
    const usersWithCheckpoints = await LegacyUser.find({
      learningCheckpoint: { $exists: true },
    }).lean();

    stats.totalUsers = await LegacyUser.countDocuments();
    stats.usersWithCheckpoints = usersWithCheckpoints.length;

    console.log(`📊 Found ${stats.totalUsers} total users`);
    console.log(`📊 Found ${stats.usersWithCheckpoints} users with learning checkpoints`);

    if (stats.usersWithCheckpoints === 0) {
      console.log('✅ No users with learning checkpoints found. Migration complete!');
      return;
    }

    // Check for existing UserProgress documents
    const existingProgress = await UserProgress.countDocuments();
    if (existingProgress > 0) {
      console.log(`⚠️  Found ${existingProgress} existing UserProgress documents`);
      console.log('   This migration will create additional documents');
    }

    // Start transaction for atomicity
    const session = await mongoose.startSession();

    await session.withTransaction(async () => {
      console.log('\n🔄 Starting migration transaction...');

      // Process users in batches
      const batchSize = 10;
      for (let i = 0; i < usersWithCheckpoints.length; i += batchSize) {
        const batch = usersWithCheckpoints.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersWithCheckpoints.length / batchSize)}`);

        for (const user of batch) {
          await migrateUser(user, stats, session);
        }

        // Progress update
        const progress = ((i + batch.length) / usersWithCheckpoints.length * 100).toFixed(1);
        console.log(`   ⏳ Progress: ${i + batch.length}/${usersWithCheckpoints.length} (${progress}%)`);
      }

      console.log('\n✅ Migration transaction completed');
    });

    await session.endSession();

    // Final validation
    const finalUserProgressCount = await UserProgress.countDocuments();
    const totalTime = Math.ceil((Date.now() - stats.startTime) / 1000);

    console.log('\n📋 Migration Summary:');
    console.log(`   👥 Total users: ${stats.totalUsers}`);
    console.log(`   📍 Users with checkpoints: ${stats.usersWithCheckpoints}`);
    console.log(`   ✅ UserProgress created: ${stats.userProgressCreated}`);
    console.log(`   ❌ Errors: ${stats.errors}`);
    console.log(`   📊 Final UserProgress count: ${finalUserProgressCount}`);
    console.log(`   ⏱️  Migration time: ${totalTime} seconds`);

    if (stats.errors === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${stats.errors} errors. Check logs above.`);
    }

    // Show sliding window distribution
    console.log('\n📊 UserProgress Distribution by Level:');
    const levelDistribution = await UserProgress.aggregate([
      {
        $group: {
          _id: { level: '$current_level', type: '$progress_type' },
          count: { $sum: 1 },
          avgWords: { $avg: { $size: '$shuffled_order' } },
        },
      },
      { $sort: { '_id.level': 1, '_id.type': 1 } },
    ]);

    levelDistribution.forEach((item) => {
      console.log(`   ${item._id.level} (${item._id.type}): ${item.count} users, avg ${item.avgWords.toFixed(0)} words/deck`);
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);

    // Show progress at failure
    if (stats.userProgressCreated > 0) {
      console.log(`\n📊 Progress at failure: ${stats.userProgressCreated} UserProgress documents created`);
    }

    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateLearningCheckpoint()
    .then(() => {
      console.log('\n🎉 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration process failed:', error);
      process.exit(1);
    });
}

export default migrateLearningCheckpoint;