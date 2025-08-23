/**
 * USER CONTROLLER - USER STATISTICS AND CONTEST HISTORY
 * 
 * DESCRIPTION:
 * Handles user statistics and contest participation endpoints with proper authentication,
 * caching, and performance optimization. Provides comprehensive user analytics including
 * problem-solving statistics, rating progression, and contest participation history.
 * 
 * FUNCTIONALITY:
 * - User statistics aggregation with real-time calculation
 * - Contest participation history with pagination
 * - Redis caching for performance optimization
 * - Authentication and authorization middleware integration
 * - Streak calculation and ranking determination
 * 
 * ENDPOINTS:
 * - GET /api/users/:id/stats - User comprehensive statistics
 * - GET /api/users/:id/contests - User contest participation history
 * 
 * SECURITY:
 * - JWT authentication required for all endpoints
 * - User can only access their own data unless admin
 * - Input validation and sanitization
 * - Sensitive data exclusion from responses
 */

const userService = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET USER STATISTICS
 * Route: GET /api/users/:id/stats
 * 
 * PURPOSE:
 * Retrieves comprehensive user statistics including problems solved, contests participated,
 * current and max streaks, rating, and global ranking. Uses MongoDB aggregation pipelines
 * for efficient data processing and Redis caching for performance.
 * 
 * AUTHENTICATION:
 * - JWT token required in Authorization header
 * - Users can only access their own stats unless admin role
 * - Returns 401 for unauthenticated requests
 * - Returns 403 for unauthorized access attempts
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses existing compound indexes: { userId: 1, submittedAt: -1 }
 * - Aggregation pipelines with $match, $group, $sort for efficiency
 * - Redis caching with 60s TTL to reduce database load
 * - Projects only required fields to minimize data transfer
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   data: {
 *     problemsSolved: 127,
 *     contestsParticipated: 23,
 *     currentStreak: 7,
 *     maxStreak: 15,
 *     rating: 1456,
 *     globalRank: 1234,
 *     totalUsers: 50000
 *   }
 * }
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // SECURITY: Ensure user can only access their own data unless admin
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own statistics'
      });
    }

    // Check Redis cache first for performance optimization
    // Cache key format: "user:stats:{userId}" with 60s TTL
    const cacheKey = `user:stats:${userId}`;
    
    try {
      const cachedStats = await userService.getCachedStats(cacheKey);
      if (cachedStats) {
        console.log(`📈 Cache HIT for user stats: ${userId}`);
        return res.json({
          success: true,
          data: cachedStats,
          cached: true
        });
      }
    } catch (cacheError) {
      // Log cache error but continue with database query
      console.warn('⚠️ Cache read error for user stats:', cacheError.message);
    }

    console.log(`📊 Fetching fresh user statistics for: ${userId}`);
    
    // Fetch comprehensive user statistics using optimized queries
    const stats = await userService.getUserStatistics(userId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'User not found or has no statistics'
      });
    }

    // Cache the results for future requests (60s TTL)
    try {
      await userService.cacheStats(cacheKey, stats, 60);
      console.log(`💾 Cached user stats for: ${userId}`);
    } catch (cacheError) {
      // Log cache error but don't fail the request
      console.warn('⚠️ Cache write error for user stats:', cacheError.message);
    }

    res.json({
      success: true,
      data: stats,
      cached: false
    });

  } catch (error) {
    console.error('❌ Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET USER CONTEST HISTORY
 * Route: GET /api/users/:id/contests
 * 
 * PURPOSE:
 * Retrieves paginated user contest participation history including contest details,
 * rankings, scores, and participation dates. Supports pagination for large datasets
 * and implements Redis caching for frequently accessed data.
 * 
 * QUERY PARAMETERS:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10, max: 50)
 * - sort: Sort order ('date_desc', 'date_asc', 'rank_asc', 'score_desc')
 * 
 * AUTHENTICATION:
 * - JWT token required
 * - Users can only access their own contest history unless admin
 * - Validates user ID against authenticated user
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Uses compound indexes: { userId: 1, participatedAt: -1 }
 * - Implements skip/limit pagination for large datasets
 * - Redis caching per page with cache key: "user:contests:{id}:page:{page}"
 * - Projects only essential fields to reduce data transfer
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   data: {
 *     contests: [
 *       {
 *         contestId: "60a1b2c3d4e5f6789",
 *         contestName: "Weekly Contest 122",
 *         position: 456,
 *         score: 85,
 *         totalParticipants: 1234,
 *         participatedAt: "2025-08-01T10:00:00Z",
 *         problemsSolved: 3,
 *         totalProblems: 4
 *       }
 *     ],
 *     pagination: {
 *       currentPage: 1,
 *       totalPages: 5,
 *       totalContests: 23,
 *       hasNext: true,
 *       hasPrev: false
 *     }
 *   }
 * }
 */
const getUserContests = async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // SECURITY: Ensure user can only access their own contest history unless admin
    if (userId !== requestingUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own contest history'
      });
    }

    // Parse and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const sort = req.query.sort || 'date_desc';

    // Validate sort parameter
    const validSortOptions = ['date_desc', 'date_asc', 'rank_asc', 'score_desc'];
    if (!validSortOptions.includes(sort)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort parameter. Must be one of: ${validSortOptions.join(', ')}`
      });
    }

    // Check Redis cache first for performance optimization
    // Cache key format: "user:contests:{userId}:page:{page}:limit:{limit}:sort:{sort}"
    const cacheKey = `user:contests:${userId}:page:${page}:limit:${limit}:sort:${sort}`;
    
    try {
      const cachedContests = await userService.getCachedContests(cacheKey);
      if (cachedContests) {
        console.log(`🏆 Cache HIT for user contests: ${userId}, page: ${page}`);
        return res.json({
          success: true,
          data: cachedContests,
          cached: true
        });
      }
    } catch (cacheError) {
      // Log cache error but continue with database query
      console.warn('⚠️ Cache read error for user contests:', cacheError.message);
    }

    console.log(`🏁 Fetching contest history for user: ${userId}, page: ${page}, limit: ${limit}`);
    
    // Fetch paginated contest history using optimized queries
    const contestData = await userService.getUserContests(userId, { page, limit, sort });
    
    if (!contestData) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cache the results for future requests (60s TTL)
    try {
      await userService.cacheContests(cacheKey, contestData, 60);
      console.log(`💾 Cached user contests for: ${userId}, page: ${page}`);
    } catch (cacheError) {
      // Log cache error but don't fail the request
      console.warn('⚠️ Cache write error for user contests:', cacheError.message);
    }

    res.json({
      success: true,
      data: contestData,
      cached: false
    });

  } catch (error) {
    console.error('❌ Error fetching user contests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contest history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserStats,
  getUserContests
};
