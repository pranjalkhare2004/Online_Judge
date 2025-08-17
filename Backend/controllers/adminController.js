/**
 * ADMIN DASHBOARD CONTROLLER
 * 
 * DESCRIPTION:
 * This controller handles all administrative dashboard operations for the Online Judge system.
 * It provides comprehensive admin functionality including problem management, contest management,
 * test case operations, user administration, and notification system. Implements atomic operations
 * using MongoDB transactions where needed and ensures data consistency across all operations.
 * 
 * FUNCTIONS:
 * - getDashboardStats(): Dashboard overview statistics
 * - createProblem(): Create new problem with validation
 * - updateProblem(): Update existing problem
 * - deleteProblem(): Delete problem and associated data
 * - createContest(): Create contest and notify all users
 * - updateContest(): Update contest details
 * - deleteContest(): Delete contest and cleanup
 * - createTestCase(): Create test case for problem
 * - updateTestCase(): Update test case
 * - deleteTestCase(): Delete test case
 * - getUserSubmissions(): View user submissions
 * - generateLeaderboard(): Generate contest leaderboard
 * - getAnalytics(): Platform analytics
 * 
 * EXPORTS:
 * - Various admin controller functions
 * 
 * USED BY:
 * - routes/admin.js: Admin route handlers
 * 
 * DEPENDENCIES:
 * - models/Problem.js: Problem operations
 * - models/Contest.js: Contest operations
 * - models/TestCase.js: Test case operations
 * - models/User.js: User operations
 * - models/Submission.js: Submission operations
 * - models/Notification.js: Notification operations
 */

const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const Contest = require('../models/Contest');
const TestCase = require('../models/TestCase');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const { getCachedData, cacheData, invalidateCache } = require('../utils/cache');

/**
 * Get admin dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, data: cached });
    }

    // Get comprehensive statistics
    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalContests,
      activeContests,
      upcomingContests,
      recentSubmissions,
      recentUsers,
      problemsByDifficulty,
      submissionStats
    ] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Submission.countDocuments(),
      Contest.countDocuments(),
      Contest.countDocuments({
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
      }),
      Contest.countDocuments({
        startTime: { $gt: new Date() }
      }),
      Submission.find()
        .sort({ submittedAt: -1 })
        .limit(10)
        .populate('userId', 'name username')
        .populate('problemId', 'title')
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name username email role createdAt')
        .lean(),
      Problem.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
      ]),
      Submission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalProblems,
        totalSubmissions,
        totalContests,
        activeContests,
        upcomingContests
      },
      recentActivity: {
        recentSubmissions,
        recentUsers
      },
      analytics: {
        problemsByDifficulty: problemsByDifficulty.reduce((acc, item) => {
          acc[item._id.toLowerCase()] = item.count;
          return acc;
        }, {}),
        submissionStats: submissionStats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    };

    // Cache for 5 minutes
    await cacheData(cacheKey, stats, 300);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create a new contest and notify all users
 */
const createContest = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      title,
      name,
      description,
      start_time,
      end_time,
      problems,
      isPublic = true,
      maxParticipants,
      registrationEndTime
    } = req.body;

    // Use title if provided, fallback to name for backward compatibility
    const contestTitle = title || name;

    // Validate contest data
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    if (new Date(start_time) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be in the future'
      });
    }

    // Validate problems exist
    if (problems && problems.length > 0) {
      const existingProblems = await Problem.find({
        _id: { $in: problems }
      }).session(session);
      
      if (existingProblems.length !== problems.length) {
        throw new Error('Some problems do not exist');
      }
    }

    // Create contest
    const contest = new Contest({
      title: contestTitle,
      description,
      startTime: new Date(start_time),
      endTime: new Date(end_time),
      duration: Math.floor((new Date(end_time) - new Date(start_time)) / (1000 * 60)), // duration in minutes
      problems: problems || [],
      isPublic,
      maxParticipants,
      registrationEndTime: registrationEndTime ? new Date(registrationEndTime) : new Date(start_time),
      createdBy: req.user.id
    });

    await contest.save({ session });

    // Create notifications for all users
    const notificationData = {
      title: `New Contest: ${contest.title}`,
      message: `A new contest "${contest.title}" has been created! Registration is now open.`,
      type: 'contest',
      category: 'announcement',
      priority: 'high',
      data: {
        contestId: contest._id,
        contestName: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime
      }
    };

    await Notification.createForAllUsers(notificationData);

    await session.commitTransaction();

    // Clear relevant caches
    await invalidateCache('admin:dashboard:stats');
    await invalidateCache('contests:*');

    res.status(201).json({
      success: true,
      message: 'Contest created successfully and all users notified',
      data: contest
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Contest creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * Create a new problem with test cases
 */
const createProblem = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const {
      title,
      description,
      difficulty,
      timeLimit = 1000,
      memoryLimit = 128,
      tags = [],
      examples = [],
      constraints = '',
      testCases = []
    } = req.body;

    // Create problem
    const problem = new Problem({
      title,
      description,
      difficulty,
      timeLimit,
      memoryLimit,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
      examples,
      constraints,
      createdBy: req.user.id
    });

    await problem.save({ session });

    // Create test cases if provided
    if (testCases && testCases.length > 0) {
      const testCaseDocuments = testCases.map(tc => ({
        problemId: problem._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        timeLimit: tc.timeLimit || problem.timeLimit,
        memoryLimit: tc.memoryLimit || problem.memoryLimit,
        points: tc.points || 10,
        isPublic: tc.isPublic || false
      }));

      const createdTestCases = await TestCase.insertMany(testCaseDocuments, { session });
      
      // Update problem with test case references
      problem.testCases = createdTestCases.map(tc => tc._id);
      await problem.save({ session });
    }

    await session.commitTransaction();

    // Clear caches
    await invalidateCache('admin:dashboard:stats');
    await invalidateCache('problems:*');

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Problem creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * Delete a problem and all associated data
 */
const deleteProblem = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id } = req.params;
    
    // Find problem
    const problem = await Problem.findById(id).session(session);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Delete associated test cases
    await TestCase.deleteMany({ problemId: id }).session(session);
    
    // Update contests that reference this problem
    await Contest.updateMany(
      { problems: id },
      { $pull: { problems: id } }
    ).session(session);
    
    // Delete submissions (optional - you might want to keep them for audit)
    // await Submission.deleteMany({ problemId: id }).session(session);
    
    // Delete the problem
    await Problem.findByIdAndDelete(id).session(session);

    await session.commitTransaction();

    // Clear caches
    await invalidateCache('admin:dashboard:stats');
    await invalidateCache('problems:*');

    res.status(200).json({
      success: true,
      message: 'Problem and associated data deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Problem deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get user submissions for admin review
 */
const getUserSubmissions = async (req, res) => {
  try {
    const {
      userId,
      problemId,
      status,
      page = 1,
      limit = 20,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    if (userId) filter.userId = userId;
    if (problemId) filter.problemId = problemId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('userId', 'name username email')
        .populate('problemId', 'title difficulty')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Submission.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate contest leaderboard
 */
const generateLeaderboard = async (req, res) => {
  try {
    const { contestId } = req.params;
    
    const contest = await Contest.findById(contestId).populate('problems');
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Get all submissions for this contest during contest time
    const submissions = await Submission.find({
      problemId: { $in: contest.problems.map(p => p._id) },
      submittedAt: {
        $gte: contest.startTime,
        $lte: contest.endTime
      }
    }).populate('userId', 'name username')
      .populate('problemId', 'title')
      .sort({ submittedAt: 1 })
      .lean();

    // Calculate leaderboard
    const userScores = {};
    
    submissions.forEach(submission => {
      const userId = submission.userId._id.toString();
      const problemId = submission.problemId._id.toString();
      
      if (!userScores[userId]) {
        userScores[userId] = {
          user: submission.userId,
          totalScore: 0,
          problemsSolved: 0,
          submissions: 0,
          penalty: 0,
          problems: {}
        };
      }
      
      userScores[userId].submissions++;
      
      // Only count if not already solved
      if (!userScores[userId].problems[problemId]) {
        if (submission.status === 'Accepted') {
          userScores[userId].problems[problemId] = {
            solved: true,
            attempts: 1,
            solvedAt: submission.submittedAt,
            score: submission.score || 100
          };
          userScores[userId].totalScore += submission.score || 100;
          userScores[userId].problemsSolved++;
        } else {
          userScores[userId].problems[problemId] = {
            solved: false,
            attempts: 1,
            score: 0
          };
          userScores[userId].penalty += 20; // 20 minute penalty
        }
      } else if (!userScores[userId].problems[problemId].solved) {
        userScores[userId].problems[problemId].attempts++;
        if (submission.status === 'Accepted') {
          userScores[userId].problems[problemId].solved = true;
          userScores[userId].problems[problemId].solvedAt = submission.submittedAt;
          userScores[userId].problems[problemId].score = submission.score || 100;
          userScores[userId].totalScore += submission.score || 100;
          userScores[userId].problemsSolved++;
        } else {
          userScores[userId].penalty += 20;
        }
      }
    });

    // Convert to array and sort
    const leaderboard = Object.values(userScores)
      .sort((a, b) => {
        // Sort by problems solved (desc), then by total score (desc), then by penalty (asc)
        if (a.problemsSolved !== b.problemsSolved) {
          return b.problemsSolved - a.problemsSolved;
        }
        if (a.totalScore !== b.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.penalty - b.penalty;
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    res.status(200).json({
      success: true,
      data: {
        contest: {
          id: contest._id,
          name: contest.name,
          startTime: contest.startTime,
          endTime: contest.endTime
        },
        leaderboard,
        totalParticipants: leaderboard.length
      }
    });

  } catch (error) {
    console.error('Generate leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate leaderboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get platform analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    let dateFilter = new Date();
    switch (timeframe) {
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90);
        break;
      default:
        dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const [
      totalProblemsSolved,
      userActivity,
      problemPopularity,
      submissionTrends
    ] = await Promise.all([
      Submission.aggregate([
        { $match: { status: 'Accepted' } },
        { $group: { _id: '$problemId', count: { $sum: 1 } } },
        { $count: 'total' }
      ]),
      User.aggregate([
        {
          $match: {
            lastActive: { $gte: dateFilter }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$lastActive' } }
            },
            activeUsers: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]),
      Problem.aggregate([
        {
          $lookup: {
            from: 'submissions',
            localField: '_id',
            foreignField: 'problemId',
            as: 'submissions'
          }
        },
        {
          $project: {
            title: 1,
            difficulty: 1,
            submissionCount: { $size: '$submissions' }
          }
        },
        { $sort: { submissionCount: -1 } },
        { $limit: 10 }
      ]),
      Submission.aggregate([
        {
          $match: {
            submittedAt: { $gte: dateFilter }
          }
        },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProblemsSolved: totalProblemsSolved[0]?.total || 0
        },
        userActivity,
        problemPopularity,
        submissionTrends,
        timeframe
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardStats,
  createContest,
  createProblem,
  deleteProblem,
  getUserSubmissions,
  generateLeaderboard,
  getAnalytics
};
