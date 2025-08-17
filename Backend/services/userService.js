/**
 * USER SERVICE - DATABASE OPERATIONS AND CACHING
 * 
 * DESCRIPTION:
 * Service layer for user statistics and contest data operations. Implements efficient
 * MongoDB aggregation pipelines, Redis caching, and streak calculation algorithms.
 * Provides modular, reusable functions for user data retrieval and analysis.
 * 
 * FUNCTIONALITY:
 * - User statistics aggregation with optimized queries
 * - Contest participation data retrieval
 * - Streak calculation algorithms (current and maximum)
 * - Global ranking calculations
 * - Redis caching operations with TTL management
 * - Performance monitoring and query optimization
 * 
 * PERFORMANCE FEATURES:
 * - Utilizes existing MongoDB compound indexes
 * - Aggregation pipelines for efficient data processing
 * - Redis caching to reduce database load
 * - Field projection to minimize data transfer
 * - Query result pagination for large datasets
 */

const User = require('../models/User');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const mongoose = require('mongoose');

// Redis client for caching (will be initialized if Redis is available)
let redisClient = null;

// Try to initialize Redis client
try {
  const redis = require('redis');
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retry_strategy: (options) => {
      // Disable retries to fail fast if Redis is unavailable
      return null;
    }
  });

  redisClient.on('error', (err) => {
    console.warn('⚠️ Redis connection error:', err.message);
    redisClient = null;
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected for user statistics caching');
  });

  // Connect to Redis
  if (redisClient) {
    redisClient.connect().catch(() => {
      console.warn('⚠️ Redis not available, caching disabled');
      redisClient = null;
    });
  }
} catch (error) {
  console.warn('⚠️ Redis not available, caching disabled');
  redisClient = null;
}

/**
 * GET USER COMPREHENSIVE STATISTICS
 * 
 * PURPOSE:
 * Calculates comprehensive user statistics using MongoDB aggregation pipelines
 * for optimal performance. Includes problems solved, contest participation,
 * streaks, rating, and global ranking calculations.
 * 
 * AGGREGATION PIPELINE LOGIC:
 * 1. $match: Filter submissions by userId for performance (uses index { userId: 1, submittedAt: -1 })
 * 2. $group: Group by status to count accepted submissions
 * 3. $lookup: Join with contests to get participation data
 * 4. $project: Select only required fields to reduce data transfer
 * 
 * STREAK CALCULATION:
 * - Current streak: Consecutive days from today backwards with accepted submissions
 * - Max streak: Longest streak in user's history using sliding window algorithm
 * - Uses submission dates grouped by day for accurate calculation
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses compound index { userId: 1, submittedAt: -1 } for efficient filtering
 * - Aggregation pipeline reduces data processing on application layer
 * - Field projection minimizes memory usage and data transfer
 * - Parallel queries for independent data (submissions, contests, ranking)
 * 
 * @param {String} userId - MongoDB ObjectId of the user
 * @returns {Object} User statistics object or null if user not found
 */
const getUserStatistics = async (userId) => {
  try {
    console.log(`📊 Calculating statistics for user: ${userId}`);
    
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId format:', userId);
      return null;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // PARALLEL EXECUTION: Run independent queries concurrently for performance
    const [submissionStats, contestStats, userInfo, globalRankData] = await Promise.all([
      
      // QUERY 1: Submission statistics using optimized aggregation
      // WHY: Uses index { userId: 1, submittedAt: -1 } for efficient filtering
      Submission.aggregate([
        {
          // Match user's submissions (uses compound index for performance)
          $match: { userId: userObjectId }
        },
        {
          // Group by status to count accepted vs other submissions
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            // Collect submission dates for streak calculation
            submissionDates: { $push: '$submittedAt' }
          }
        },
        {
          // Reshape data for easier processing
          $group: {
            _id: null,
            totalSubmissions: { $sum: '$count' },
            // Count only accepted submissions for problems solved
            problemsSolved: {
              $sum: {
                $cond: [{ $eq: ['$_id', 'Accepted'] }, '$count', 0]
              }
            },
            // Collect all submission dates for streak calculation
            allSubmissionDates: {
              $push: {
                status: '$_id',
                dates: '$submissionDates'
              }
            }
          }
        }
      ]),

      // QUERY 2: Contest participation statistics
      // WHY: Uses sparse index { contestId: 1, userId: 1, submittedAt: -1 }
      Submission.aggregate([
        {
          $match: { 
            userId: userObjectId,
            contestId: { $exists: true, $ne: null }
          }
        },
        {
          // Count unique contests participated in
          $group: {
            _id: '$contestId'
          }
        },
        {
          $count: 'contestsParticipated'
        }
      ]),

      // QUERY 3: User basic info (rating, creation date)
      // WHY: Direct query with field projection for minimal data transfer
      User.findById(userObjectId).select('rating createdAt').lean(),

      // QUERY 4: Global ranking calculation
      // WHY: Count users with higher rating for ranking determination
      User.countDocuments({ rating: { $gt: await User.findById(userObjectId).select('rating').lean().then(u => u?.rating || 0) } })
    ]);

    if (!userInfo) {
      console.error('❌ User not found:', userId);
      return null;
    }

    // PROCESSING: Extract results from aggregation pipelines
    const submissionData = submissionStats[0] || { problemsSolved: 0, totalSubmissions: 0, allSubmissionDates: [] };
    const contestData = contestStats[0] || { contestsParticipated: 0 };

    // STREAK CALCULATION: Calculate current and maximum streaks
    const streakData = await calculateStreaks(userId, submissionData.allSubmissionDates);

    // RANKING CALCULATION: Determine global rank
    const totalUsers = await User.countDocuments({ isActive: true });
    const globalRank = globalRankData + 1; // +1 because we count users with higher rating

    const statistics = {
      problemsSolved: submissionData.problemsSolved,
      contestsParticipated: contestData.contestsParticipated,
      currentStreak: streakData.currentStreak,
      maxStreak: streakData.maxStreak,
      rating: userInfo.rating || 1200,
      globalRank: globalRank,
      totalUsers: totalUsers,
      // Additional metadata for debugging
      totalSubmissions: submissionData.totalSubmissions,
      accountAge: Math.floor((Date.now() - userInfo.createdAt) / (1000 * 60 * 60 * 24)) // days
    };

    console.log(`✅ Statistics calculated for user ${userId}:`, {
      problemsSolved: statistics.problemsSolved,
      contests: statistics.contestsParticipated,
      streak: statistics.currentStreak,
      rank: statistics.globalRank
    });

    return statistics;

  } catch (error) {
    console.error('❌ Error calculating user statistics:', error);
    throw error;
  }
};

/**
 * CALCULATE USER STREAKS (CURRENT AND MAXIMUM)
 * 
 * PURPOSE:
 * Calculates current and maximum solving streaks by analyzing submission dates.
 * Current streak counts consecutive days with accepted submissions up to today.
 * Maximum streak finds the longest streak in user's entire history.
 * 
 * ALGORITHM:
 * 1. Extract accepted submission dates and group by day
 * 2. Sort dates chronologically for streak detection
 * 3. Current streak: Count backwards from today until gap found
 * 4. Max streak: Sliding window algorithm to find longest consecutive sequence
 * 
 * PERFORMANCE:
 * - Processes data in memory after aggregation query
 * - Uses Set for O(1) date lookups
 * - Optimized for typical user submission patterns
 * 
 * @param {String} userId - User ID for logging purposes
 * @param {Array} submissionDatesData - Array of submission date objects from aggregation
 * @returns {Object} { currentStreak: number, maxStreak: number }
 */
const calculateStreaks = async (userId, submissionDatesData) => {
  try {
    // Extract accepted submission dates
    const acceptedDates = submissionDatesData
      .filter(item => item.status === 'Accepted')
      .flatMap(item => item.dates)
      .map(date => new Date(date).toDateString()) // Group by day, ignore time
      .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
      .sort((a, b) => new Date(a) - new Date(b)); // Sort chronologically

    if (acceptedDates.length === 0) {
      return { currentStreak: 0, maxStreak: 0 };
    }

    // CURRENT STREAK CALCULATION
    // Start from today and count backwards until gap found
    let currentStreak = 0;
    const today = new Date();
    const acceptedDateSet = new Set(acceptedDates);

    // Check consecutive days backwards from today
    for (let i = 0; i >= -365; i--) { // Check up to 1 year back
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const checkDateString = checkDate.toDateString();

      if (acceptedDateSet.has(checkDateString)) {
        currentStreak++;
      } else if (i < 0) {
        // If we hit a gap and it's not today, break
        break;
      }
      // If today has no submission, continue checking previous days
    }

    // MAXIMUM STREAK CALCULATION
    // Use sliding window to find longest consecutive sequence
    let maxStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < acceptedDates.length; i++) {
      const prevDate = new Date(acceptedDates[i - 1]);
      const currDate = new Date(acceptedDates[i]);
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        // Consecutive day found
        tempStreak++;
      } else {
        // Gap found, check if current streak is maximum
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }

    // Check final streak
    maxStreak = Math.max(maxStreak, tempStreak);

    console.log(`🔥 Streaks calculated for user ${userId}: current=${currentStreak}, max=${maxStreak}`);
    return { currentStreak, maxStreak };

  } catch (error) {
    console.error('❌ Error calculating streaks:', error);
    return { currentStreak: 0, maxStreak: 0 };
  }
};

/**
 * GET USER CONTEST PARTICIPATION HISTORY
 * 
 * PURPOSE:
 * Retrieves paginated contest participation history with performance optimizations.
 * Includes contest details, rankings, scores, and metadata for user analysis.
 * 
 * AGGREGATION PIPELINE:
 * 1. $match: Filter contest submissions by userId (uses index { userId: 1, contestId: 1 })
 * 2. $lookup: Join with contests collection for contest details
 * 3. $group: Group by contest to get user's best performance per contest
 * 4. $sort: Order results by participation date or other criteria
 * 5. $skip/$limit: Implement pagination for large datasets
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses compound index { contestId: 1, userId: 1, submittedAt: -1 }
 * - Aggregation pipeline reduces data processing overhead
 * - Pagination prevents memory issues with large datasets
 * - Field projection minimizes network transfer
 * 
 * @param {String} userId - MongoDB ObjectId of the user
 * @param {Object} options - Pagination and sorting options
 * @returns {Object} Contest data with pagination information
 */
const getUserContests = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10, sort = 'date_desc' } = options;
    const skip = (page - 1) * limit;

    console.log(`🏆 Fetching contest history for user: ${userId}, page: ${page}`);
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId format:', userId);
      return null;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Define sort criteria based on sort parameter
    let sortCriteria = {};
    switch (sort) {
      case 'date_asc':
        sortCriteria = { participatedAt: 1 };
        break;
      case 'rank_asc':
        sortCriteria = { position: 1 };
        break;
      case 'score_desc':
        sortCriteria = { score: -1 };
        break;
      case 'date_desc':
      default:
        sortCriteria = { participatedAt: -1 };
        break;
    }

    // PARALLEL EXECUTION: Get contest data and total count simultaneously
    const [contestData, totalCount] = await Promise.all([
      
      // MAIN QUERY: Contest participation with aggregation pipeline
      Submission.aggregate([
        {
          // Match contest submissions by user (uses sparse index)
          $match: {
            userId: userObjectId,
            contestId: { $exists: true, $ne: null }
          }
        },
        {
          // Group by contest to get user's performance per contest
          $group: {
            _id: '$contestId',
            bestScore: { $max: '$score' },
            problemsSolved: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
            totalSubmissions: { $sum: 1 },
            lastSubmission: { $max: '$submittedAt' }
          }
        },
        {
          // Join with contests collection to get contest details
          $lookup: {
            from: 'contests',
            localField: '_id',
            foreignField: '_id',
            as: 'contestDetails'
          }
        },
        {
          // Unwind contest details (should be single document)
          $unwind: '$contestDetails'
        },
        {
          // Calculate user's rank in contest (simplified - would need actual ranking logic)
          $addFields: {
            position: { $ifNull: ['$contestDetails.userRankings.' + userId, 999] },
            participatedAt: '$lastSubmission'
          }
        },
        {
          // Project final output format
          $project: {
            contestId: '$_id',
            contestName: '$contestDetails.title',
            position: '$position',
            score: '$bestScore',
            totalParticipants: '$contestDetails.participants.count',
            participatedAt: '$participatedAt',
            problemsSolved: '$problemsSolved',
            totalProblems: '$contestDetails.problems.count',
            contestDuration: '$contestDetails.duration',
            isRated: '$contestDetails.isRated'
          }
        },
        {
          // Sort results according to specified criteria
          $sort: sortCriteria
        },
        {
          // Implement pagination
          $skip: skip
        },
        {
          $limit: limit
        }
      ]),

      // COUNT QUERY: Total contests participated for pagination
      Submission.aggregate([
        {
          $match: {
            userId: userObjectId,
            contestId: { $exists: true, $ne: null }
          }
        },
        {
          $group: { _id: '$contestId' }
        },
        {
          $count: 'total'
        }
      ])
    ]);

    const totalContests = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(totalContests / limit);

    const result = {
      contests: contestData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalContests: totalContests,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit: limit
      }
    };

    console.log(`✅ Contest history fetched for user ${userId}: ${contestData.length} contests, page ${page}/${totalPages}`);
    return result;

  } catch (error) {
    console.error('❌ Error fetching user contests:', error);
    throw error;
  }
};

/**
 * REDIS CACHING OPERATIONS
 * 
 * These functions handle Redis caching for user statistics and contest data.
 * Caching is optional and the application continues to work if Redis is unavailable.
 * All cache operations include error handling to prevent cache failures from affecting core functionality.
 */

const getCachedStats = async (cacheKey) => {
  if (!redisClient) return null;
  
  try {
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('⚠️ Cache read error:', error.message);
    return null;
  }
};

const cacheStats = async (cacheKey, data, ttlSeconds = 60) => {
  if (!redisClient) return;
  
  try {
    await redisClient.setex(cacheKey, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.warn('⚠️ Cache write error:', error.message);
  }
};

const getCachedContests = async (cacheKey) => {
  if (!redisClient) return null;
  
  try {
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('⚠️ Cache read error:', error.message);
    return null;
  }
};

const cacheContests = async (cacheKey, data, ttlSeconds = 60) => {
  if (!redisClient) return;
  
  try {
    await redisClient.setex(cacheKey, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.warn('⚠️ Cache write error:', error.message);
  }
};

/**
 * CACHE INVALIDATION
 * 
 * Invalidates user statistics and contest caches when data changes.
 * Should be called after new submissions, contest results, or rating updates.
 */
const invalidateUserCache = async (userId) => {
  if (!redisClient) return;
  
  try {
    // Get all cache keys for this user
    const statsPattern = `user:stats:${userId}`;
    const contestsPattern = `user:contests:${userId}:*`;
    
    // Delete stats cache
    await redisClient.del(statsPattern);
    
    // Delete contest cache pages (would need a more sophisticated approach in production)
    const contestKeys = await redisClient.keys(contestsPattern);
    if (contestKeys.length > 0) {
      await redisClient.del(contestKeys);
    }
    
    console.log(`🗑️ Cache invalidated for user: ${userId}`);
  } catch (error) {
    console.warn('⚠️ Cache invalidation error:', error.message);
  }
};

module.exports = {
  getUserStatistics,
  getUserContests,
  getCachedStats,
  cacheStats,
  getCachedContests,
  cacheContests,
  invalidateUserCache
};
