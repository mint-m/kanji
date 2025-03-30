// src/controllers/learningProgressController.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import { NotFoundError, BadRequestError, InternalServerError, ForbiddenError } from "../utils/errors";
import mongoose from "mongoose";

// Learning item interface
interface LearningItem {
  wordId: string;
  timestamp: number;
  status: 'mastered' | 'learning' | 'difficult';
  level: string;
  step: number;
}

// Creating a new MongoDB schema for learning progress
const progressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  wordId: { type: String, required: true },
  status: { type: String, enum: ['mastered', 'learning', 'difficult'], required: true },
  timestamp: { type: Number, required: true },
  level: { type: String, required: true },
  step: { type: Number, required: true }
}, {
  timestamps: true
});

// Create model if it doesn't exist
const LearningProgress = mongoose.models.LearningProgress || 
  mongoose.model("LearningProgress", progressSchema, "learning_progress");

// Save learning progress
export const saveLearningProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { items } = req.body;
    
    if (!userId) {
      return next(new UnauthorizedError("Authentication required"));
    }
    
    if (!items || !Array.isArray(items)) {
      return next(new BadRequestError("Learning items array is required"));
    }
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError("User not found"));
    }
    
    // Process each learning item
    const progressData = items.map((item: LearningItem) => ({
      userId,
      wordId: item.wordId,
      status: item.status,
      timestamp: item.timestamp,
      level: item.level,
      step: item.step
    }));
    
    // Bulk insert progress data
    await LearningProgress.insertMany(progressData);
    
    // Return success
    res.status(201).json({ 
      success: true, 
      message: `Saved ${progressData.length} learning items` 
    });
    
    // Optionally: Update user learning stats asynchronously
    updateUserLearningStats(userId).catch(err => {
      console.error('Failed to update user learning stats:', err);
    });
    
  } catch (error) {
    next(new InternalServerError("Failed to save learning progress"));
  }
};

// Get learning progress for a user
export const getUserLearningProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { level, step, limit = 50 } = req.query;
    
    if (!userId) {
      return next(new UnauthorizedError("Authentication required"));
    }
    
    // Build query
    const query: any = { userId };
    
    if (level) {
      query.level = level;
    }
    
    if (step) {
      query.step = parseInt(step as string);
    }
    
    // Get latest progress records
    const progress = await LearningProgress.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string));
    
    res.json(progress);
    
  } catch (error) {
    next(new InternalServerError("Failed to retrieve learning progress"));
  }
};

// Get learning progress summary
export const getLearningProgressSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return next(new UnauthorizedError("Authentication required"));
    }
    
    // Get summary of learning progress
    const summary = await LearningProgress.aggregate([
      { $match: { userId } },
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 },
        words: { $addToSet: '$wordId' } 
      }},
      { $project: { 
        status: '$_id', 
        totalActions: '$count',
        uniqueWords: { $size: '$words' },
        _id: 0
      }}
    ]);
    
    // Get most recent learning activities
    const recentActivities = await LearningProgress.aggregate([
      { $match: { userId } },
      { $sort: { timestamp: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: 'word',
        localField: 'wordId',
        foreignField: 'origin_entry_id',
        as: 'word'
      }},
      { $project: {
        wordId: 1,
        status: 1,
        level: 1,
        timestamp: 1,
        word: { $arrayElemAt: ['$word', 0] }
      }}
    ]);
    
    // Get learning streaks (consecutive days)
    const activities = await LearningProgress.aggregate([
      { $match: { userId } },
      { $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: { $toDate: '$timestamp' } } }
      }},
      { $group: { _id: '$date' } },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    if (activities.length > 0) {
      // Check if learned today
      const learnedToday = activities.some(a => a._id === today);
      
      if (learnedToday) {
        currentStreak = 1;
        
        // Check previous days
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        for (let i = 1; i <= 365; i++) { // Max check 1 year back
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateString = checkDate.toISOString().split('T')[0];
          
          const found = activities.some(a => a._id === dateString);
          if (found) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    
    res.json({
      summary,
      recentActivities,
      streak: {
        current: currentStreak,
        // You could add more streak stats here
        longestEver: 0 // This would need additional calculation
      }
    });
    
  } catch (error) {
    next(new InternalServerError("Failed to get learning progress summary"));
  }
};

// Calculate user learning stats (words mastered, etc.)
const updateUserLearningStats = async (userId: string) => {
  try {
    // Get Word model for counts
    const Word = mongoose.model("Word");
    
    // Get total word counts per level from the database
    const levelWordCounts = await Word.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } }
    ]);
    
    // Create a map of level to word count
    const levelTotals: Record<string, number> = {};
    levelWordCounts.forEach(item => {
      levelTotals[item._id] = item.count;
    });
    
    // Get counts of mastered words by level
    const masteredByLevel = await LearningProgress.aggregate([
      { $match: { userId, status: 'mastered' } },
      // Group by wordId to count unique words (not repeated practices)
      { $group: { _id: '$wordId', level: { $first: '$level' } } },
      // Group by level to get count per level
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);
    
    // Calculate mastery percentages for each level
    const levelStats = masteredByLevel.map(item => {
      const total = levelTotals[item._id] || 0;
      return {
        level: item._id,
        mastered: item.count,
        total: total,
        percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
      };
    });
    
    // Add levels with 0 mastery but that exist in the database
    Object.keys(levelTotals).forEach(level => {
      const exists = levelStats.some(stat => stat.level === level);
      if (!exists && levelTotals[level] > 0) {
        levelStats.push({
          level,
          mastered: 0,
          total: levelTotals[level],
          percentage: 0
        });
      }
    });
    
    // Sort by level
    levelStats.sort((a, b) => {
      const levelA = parseInt(a.level.replace(/\D/g, ''));
      const levelB = parseInt(b.level.replace(/\D/g, ''));
      return levelA - levelB;
    });
    
    // Update user with stats
    await User.findByIdAndUpdate(userId, {
      $set: {
        'learningStats': levelStats
      }
    });
    
    return levelStats;
  } catch (error) {
    console.error('Failed to update user learning stats:', error);
    throw error;
  }
};

// Import for use in error types
import { UnauthorizedError } from "../utils/errors";