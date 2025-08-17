const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateSubmission } = require('../middleware/validation');
const { addSubmission } = require('../utils/submissionQueue');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for submissions
const submissionLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 submissions per minute
  message: 'Too many submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/submissions
// @desc    Submit code for a problem  
// @access  Private
router.post('/', authenticateToken, validateSubmission, async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.id;

    // Check if problem exists
    const problem = await Problem.findById(problemId);
    
    if (!problem || !problem.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Problem not found or inactive' 
      });
    }

    // Create submission record
    const submission = new Submission({
      userId: userId,
      problemId: problemId,
      code,
      language,
      status: 'Pending',
      submittedAt: new Date()
    });

    await submission.save();

    // Add submission to processing queue
    await addSubmission({
      submissionId: submission._id,
      problemId,
      code,
      language,
      userId
    });

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission._id,
        status: submission.status,
        message: 'Code submitted successfully'
      }
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during submission'
    });
  }
});

// @route   GET /api/submissions/:id
// @desc    Get submission details
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problemId', 'title slug')
      .populate('userId', 'username')
      .lean();

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check if user owns the submission or is admin
    if (submission.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching submission'
    });
  }
});

// @route   GET /api/submissions/user/:userId
// @desc    Get user's submissions with pagination
// @access  Private
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if user is requesting their own submissions or is admin
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const submissions = await Submission.find({ userId: userId })
      .populate('problemId', 'title slug difficulty')
      .select('status submittedAt executionTime memoryUsage language result')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalSubmissions = await Submission.countDocuments({ userId: userId });

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSubmissions / limit),
          totalSubmissions
        }
      }
    });
  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching submissions'
    });
  }
});

// @route   GET /api/submissions/problem/:problemId
// @desc    Get problem submissions (admin only)
// @access  Private (Admin)
router.get('/problem/:problemId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { problemId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const submissions = await Submission.find({ problemId: problemId })
      .populate('userId', 'username')
      .select('status submittedAt executionTime memoryUsage language result')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get problem submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching problem submissions'
    });
  }
});

module.exports = router;
