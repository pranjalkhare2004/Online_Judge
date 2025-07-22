const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private
exports.createSubmission = async (req, res, next) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.id;

    // Check if problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Create submission
    const submission = new Submission({
      userId,
      problemId,
      code,
      language,
      status: 'Pending'
    });

    await submission.save();

    // Populate submission data for response
    await submission.populate([
      { path: 'userId', select: 'firstname lastname email' },
      { path: 'problemId', select: 'title difficulty category' }
    ]);

    logger.info(`New submission created: ${submission._id} by user: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission
    });

  } catch (error) {
    logger.error('Create submission error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Failed to create submission', 500));
  }
};

// @desc    Get all submissions (admin only)
// @route   GET /api/submissions
// @access  Private (admin)
exports.getAllSubmissions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.language) {
      filter.language = req.query.language;
    }
    
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    if (req.query.problemId) {
      filter.problemId = req.query.problemId;
    }

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('userId', 'firstname lastname email')
        .populate('problemId', 'title difficulty category')
        .sort({ submittedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Submission.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubmissions: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get all submissions error:', error);
    next(new AppError('Failed to fetch submissions', 500));
  }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
// @access  Private
exports.getSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id)
      .populate('userId', 'firstname lastname email')
      .populate('problemId', 'title difficulty category');

    if (!submission) {
      return next(new AppError('Submission not found', 404));
    }

    // Check if user can access this submission (own submission or admin)
    if (submission.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Access denied', 403));
    }

    res.status(200).json({
      success: true,
      data: submission
    });

  } catch (error) {
    logger.error('Get submission by ID error:', error);
    next(new AppError('Failed to fetch submission', 500));
  }
};

// @desc    Get current user's submissions
// @route   GET /api/submissions/user/me
// @access  Private
exports.getUserSubmissions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { userId: req.user.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.language) {
      filter.language = req.query.language;
    }
    
    if (req.query.problemId) {
      filter.problemId = req.query.problemId;
    }

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('problemId', 'title difficulty category')
        .sort({ submittedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Submission.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubmissions: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get user submissions error:', error);
    next(new AppError('Failed to fetch user submissions', 500));
  }
};

// @desc    Rejudge submission (admin only)
// @route   POST /api/submissions/:id/rejudge
// @access  Private (admin)
exports.rejudgeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) {
      return next(new AppError('Submission not found', 404));
    }

    // Reset submission status
    submission.status = 'Pending';
    submission.verdict = null;
    submission.executionTime = null;
    submission.memoryUsed = null;
    submission.testCasesPassed = 0;
    submission.totalTestCases = 0;
    submission.errorMessage = null;
    submission.judgedAt = null;

    await submission.save();

    logger.info(`Submission rejudged: ${id} by admin: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Submission queued for rejudging',
      data: submission
    });

  } catch (error) {
    logger.error('Rejudge submission error:', error);
    next(new AppError('Failed to rejudge submission', 500));
  }
};

// @desc    Get submission statistics
// @route   GET /api/submissions/stats/overview
// @access  Private
exports.getSubmissionStats = async (req, res, next) => {
  try {
    const stats = await Submission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const languageStats = await Submission.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalSubmissions = await Submission.countDocuments();
    const acceptedSubmissions = await Submission.countDocuments({ status: 'Accepted' });
    const acceptanceRate = totalSubmissions > 0 ? (acceptedSubmissions / totalSubmissions) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate: acceptanceRate.toFixed(2),
        statusDistribution: stats,
        languageDistribution: languageStats
      }
    });

  } catch (error) {
    logger.error('Get submission stats error:', error);
    next(new AppError('Failed to fetch submission statistics', 500));
  }
};
