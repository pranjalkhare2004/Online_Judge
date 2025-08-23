const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { cacheData, getCachedData, invalidateCache } = require('../utils/cache');
const { getQueueStats, cleanQueue } = require('../utils/submissionQueue');
const { checkDockerAvailability, pullDockerImages } = require('../utils/executeCode');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const Notification = require('../models/Notification');
const {
  getDashboardStats,
  createContest,
  createProblem,
  deleteProblem,
  getUserSubmissions,
  generateLeaderboard,
  getAnalytics
} = require('../controllers/adminController');

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin)
 */
router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);

/**
 * @route   GET /api/admin/problems
 * @desc    Get all problems with admin details
 * @access  Private (Admin)
 */
router.get('/problems', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, difficulty, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    if (difficulty) query.difficulty = difficulty;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const problems = await Problem.find(query)
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalProblems = await Problem.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        problems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalProblems / limit),
          totalItems: totalProblems,
          hasNext: page * limit < totalProblems,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problems',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/admin/problems
 * @desc    Create a new problem (admin only)
 * @access  Private (Admin)
 */
router.post('/problems', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, slug, difficulty, description, constraints, examples, tags, timeLimit, memoryLimit, isActive = true, isFeatured = false } = req.body;
    
    // Check if slug already exists
    const existingProblem = await Problem.findOne({ slug });
    if (existingProblem) {
      return res.status(400).json({
        success: false,
        message: 'Problem with this slug already exists'
      });
    }

    const problem = new Problem({
      title,
      slug,
      difficulty,
      description,
      constraints,
      examples,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      timeLimit: parseInt(timeLimit),
      memoryLimit: parseInt(memoryLimit),
      isActive,
      isFeatured,
      createdBy: req.user._id
    });

    await problem.save();

    // Invalidate problem caches
    await invalidateCache('problems:*');
    await invalidateCache('admin:dashboard:*');

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/problems/:id
 * @desc    Update a problem (admin only)
 * @access  Private (Admin)
 */
router.put('/problems/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Process tags if provided
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(tag => tag.trim());
    }
    
    // Ensure numeric fields are converted
    if (updates.timeLimit) updates.timeLimit = parseInt(updates.timeLimit);
    if (updates.memoryLimit) updates.memoryLimit = parseInt(updates.memoryLimit);
    
    updates.updatedAt = Date.now();

    const problem = await Problem.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('createdBy', 'name username');

    if (!problem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found' 
      });
    }

    // Invalidate relevant caches
    await invalidateCache('problems:*');
    await invalidateCache(`problem:${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/problems/:id
 * @desc    Delete a problem and its test cases (admin only)
 * @access  Private (Admin)
 */
router.delete('/problems/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found' 
      });
    }

    // Delete all test cases for this problem
    await TestCase.deleteMany({ problemId: req.params.id });

    // Invalidate relevant caches
    await invalidateCache('problems:*');
    await invalidateCache(`problem:${req.params.id}`);
    await invalidateCache('admin:dashboard:*');

    res.status(200).json({
      success: true,
      message: 'Problem and associated test cases deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with admin details
 * @access  Private (Admin)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          totalItems: totalUsers,
          hasNext: page * limit < totalUsers,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user details (admin only)
 * @access  Private (Admin)
 */
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, isActive, isVerified } = req.body;
    const updates = {};

    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/submissions
 * @desc    Get all submissions with details
 * @access  Private (Admin)
 */
router.get('/submissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, language } = req.query;
    const query = {};

    if (status) query.status = status;
    if (language) query.language = language;

    const submissions = await Submission.find(query)
      .populate('userId', 'name username')
      .populate('problemId', 'title difficulty')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalSubmissions = await Submission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSubmissions / limit),
          totalItems: totalSubmissions,
          hasNext: page * limit < totalSubmissions,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/queue/stats
// @desc    Get submission queue statistics
// @access  Private (Admin only)
router.get('/queue/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getQueueStats();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve queue statistics'
      });
    }
    
    res.json({
      success: true,
      data: {
        queue: stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get queue stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/admin/queue/clean
// @desc    Clean old completed and failed jobs from queue
// @access  Private (Admin only)
router.post('/queue/clean', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await cleanQueue();
    
    res.json({
      success: true,
      message: 'Queue cleaned successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clean queue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/system/docker
// @desc    Check Docker availability and pull images
// @access  Private (Admin only)
router.get('/system/docker', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dockerAvailable = await checkDockerAvailability();
    
    res.json({
      success: true,
      data: {
        dockerAvailable,
        message: dockerAvailable ? 'Docker is available' : 'Docker is not available',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check Docker availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/admin/system/docker/pull
// @desc    Pull required Docker images
// @access  Private (Admin only)
router.post('/system/docker/pull', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // This is a long-running operation, so we'll start it in the background
    pullDockerImages().catch(error => {
      console.error('Docker image pull failed:', error);
    });
    
    res.json({
      success: true,
      message: 'Docker image pull started in background',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start Docker image pull',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ================================
// NEW ENHANCED ADMIN ROUTES
// ================================

/**
 * @route   POST /api/admin/contests
 * @desc    Create a new contest and notify all users
 * @access  Private (Admin)
 */
router.post('/contests', authenticateToken, requireAdmin, createContest);

/**
 * @route   GET /api/admin/contests
 * @desc    Get all contests with admin details
 * @access  Private (Admin)
 */
router.get('/contests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          query.startTime = { $gt: now };
          break;
        case 'active':
          query.startTime = { $lte: now };
          query.endTime = { $gte: now };
          break;
        case 'ended':
          query.endTime = { $lt: now };
          break;
      }
    }

    const contests = await Contest.find(query)
      .populate('creator', 'name username')
      .populate('problems', 'title difficulty')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalContests = await Contest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        contests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalContests / limit),
          totalItems: totalContests
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contests',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/contests/:id
 * @desc    Update contest details
 * @access  Private (Admin)
 */
router.put('/contests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate dates if provided
    if (updateData.start_time && updateData.end_time) {
      if (new Date(updateData.start_time) >= new Date(updateData.end_time)) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }

    const contest = await Contest.findByIdAndUpdate(
      id,
      {
        ...updateData,
        startTime: updateData.start_time ? new Date(updateData.start_time) : undefined,
        endTime: updateData.end_time ? new Date(updateData.end_time) : undefined
      },
      { new: true, runValidators: true }
    ).populate('problems', 'title');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    await invalidateCache('contests:*');
    await invalidateCache('admin:dashboard:stats');

    res.status(200).json({
      success: true,
      message: 'Contest updated successfully',
      data: contest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/contests/:id
 * @desc    Delete contest
 * @access  Private (Admin)
 */
router.delete('/contests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contest = await Contest.findByIdAndDelete(id);
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    await invalidateCache('contests:*');
    await invalidateCache('admin:dashboard:stats');

    res.status(200).json({
      success: true,
      message: 'Contest deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete contest',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/admin/problems
 * @desc    Create a new problem with test cases
 * @access  Private (Admin)
 */
router.post('/problems', authenticateToken, requireAdmin, createProblem);

/**
 * @route   DELETE /api/admin/problems/:id
 * @desc    Delete problem and associated data
 * @access  Private (Admin)
 */
router.delete('/problems/:id', authenticateToken, requireAdmin, deleteProblem);

/**
 * @route   GET /api/admin/problems/:id/testcases
 * @desc    Get all test cases for a specific problem
 * @access  Private (Admin)
 */
router.get('/problems/:id/testcases', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: problemId } = req.params;
    
    // Check if problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const testCases = await TestCase.find({ problemId })
      .sort({ createdAt: 1 })
      .select('input expectedOutput isPublic description points timeLimit memoryLimit createdAt updatedAt');

    res.status(200).json({
      success: true,
      message: 'Test cases retrieved successfully',
      data: testCases
    });
  } catch (error) {
    console.error('Failed to fetch test cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/admin/testcases
 * @desc    Create test case for a problem
 * @access  Private (Admin)
 */
router.post('/testcases', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      problemId,
      input,
      expectedOutput,
      timeLimit,
      memoryLimit,
      points = 10,
      isPublic = false
    } = req.body;

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const testCase = new TestCase({
      problemId,
      input,
      expectedOutput,
      timeLimit: timeLimit || problem.timeLimit,
      memoryLimit: memoryLimit || problem.memoryLimit,
      points,
      isPublic
    });

    await testCase.save();

    // Update problem to include test case reference
    await Problem.findByIdAndUpdate(
      problemId,
      { $push: { testCases: testCase._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Test case created successfully',
      data: testCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/admin/testcases/:id
 * @desc    Update test case
 * @access  Private (Admin)
 */
router.put('/testcases/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const testCase = await TestCase.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test case updated successfully',
      data: testCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update test case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/admin/testcases/:id
 * @desc    Delete test case
 * @access  Private (Admin)
 */
router.delete('/testcases/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const testCase = await TestCase.findByIdAndDelete(id);
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: 'Test case not found'
      });
    }

    // Remove reference from problem
    await Problem.findByIdAndUpdate(
      testCase.problemId,
      { $pull: { testCases: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Test case deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete test case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/admin/submissions
 * @desc    Get user submissions for admin review
 * @access  Private (Admin)
 */
router.get('/submissions', authenticateToken, requireAdmin, getUserSubmissions);

/**
 * @route   GET /api/admin/contests/:id/leaderboard
 * @desc    Generate contest leaderboard
 * @access  Private (Admin)
 */
router.get('/contests/:id/leaderboard', authenticateToken, requireAdmin, generateLeaderboard);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get platform analytics
 * @access  Private (Admin)
 */
router.get('/analytics', authenticateToken, requireAdmin, getAnalytics);

/**
 * @route   GET /api/admin/notifications
 * @desc    Get all notifications (admin view)
 * @access  Private (Admin)
 */
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, userId } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (userId) filter.userId = userId;

    const notifications = await Notification.find(filter)
      .populate('userId', 'name username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/admin/notifications/broadcast
 * @desc    Send notification to all users
 * @access  Private (Admin)
 */
router.post('/notifications/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, type = 'admin', category = 'announcement', priority = 'medium' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    const notificationData = {
      title,
      message,
      type,
      category,
      priority
    };

    const notifications = await Notification.createForAllUsers(notificationData);

    res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      data: {
        count: notifications.length,
        notification: notificationData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
