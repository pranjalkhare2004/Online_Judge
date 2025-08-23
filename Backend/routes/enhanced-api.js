/**
 * ENHANCED BACKEND COMMUNICATION SERVICE
 * 
 * Comprehensive backend service to handle all frontend-backend communication
 * with proper error handling, real-time updates, and type safety.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { addSubmission } = require('../utils/submissionQueue');
const { executeCodeSecure } = require('../services/dockerCompilerFixed');
const { getTestCasesForExecution } = require('../utils/problemTestCases');

// Rate limiting for different endpoints
const codeExecutionLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 executions per minute (increased for development)
  message: {
    success: false,
    message: 'Code execution rate limit exceeded. Please try again later.',
    retryAfter: 60
  }
});

const submissionLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 submissions per minute
  message: {
    success: false,
    message: 'Submission rate limit exceeded. Please try again later.',
    retryAfter: 60
  }
});

// Validation middleware
const validateCodeExecution = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Code length must be between 1 and 50,000 characters'),
  
  body('language')
    .isIn(['cpp', 'java', 'python', 'javascript', 'c'])
    .withMessage('Unsupported language'),
  
  body('problemId')
    .optional()
    .isMongoId()
    .withMessage('Invalid problem ID'),
  
  body('testCases')
    .optional()
    .isArray({ min: 1, max: 20 })
    .withMessage('Test cases must be an array (1-20 items)'),
  
  body('testCases.*.input')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Test case input too large'),
  
  body('testCases.*.expectedOutput')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Expected output too large')
];

const validateSubmission = [
  body('problemId')
    .isMongoId()
    .withMessage('Invalid problem ID'),
  
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Code length must be between 1 and 50,000 characters'),
  
  body('language')
    .isIn(['cpp', 'java', 'python', 'javascript', 'c'])
    .withMessage('Unsupported language')
];

/**
 * POST /api/enhanced/execute
 * Execute code with custom test cases
 */
router.post('/execute', 
  codeExecutionLimit,
  authenticateToken,
  ...validateCodeExecution,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { code, language, testCases, problemId } = req.body;
      const userId = req.user._id;

      let finalTestCases = testCases;

      // If no test cases provided but problemId is given, fetch visible test cases from database
      if (!testCases && problemId) {
        console.log(`� Fetching visible test cases for problem: ${problemId}`);
        try {
          finalTestCases = await getTestCasesForExecution(problemId, true); // true = visible only
          console.log(`✅ Retrieved ${finalTestCases.length} visible test cases from database`);
        } catch (error) {
          console.error('❌ Error fetching test cases:', error.message);
          return res.status(400).json({
            success: false,
            message: 'Failed to fetch test cases for this problem',
            error: error.message
          });
        }
      }

      // Validate that we have test cases either way
      if (!finalTestCases || finalTestCases.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No test cases provided. Either include testCases in request body or provide a valid problemId.'
        });
      }

      console.log(`�🚀 Code execution request: ${language}, ${finalTestCases.length} test cases`);

      // Execute code using the Docker compiler service (unified)
      const results = await executeCodeSecure(code, language, finalTestCases);

      if (!results.success) {
        return res.status(400).json({
          success: false,
          message: results.error || 'Code execution failed',
          data: {
            compilationError: results.details,
            results: [],
            totalTests: finalTestCases.length,
            passedTests: 0,
            executionTime: 0,
            memoryUsed: 0,
            overallResult: 'COMPILATION_ERROR'
          }
        });
      }

      res.json({
        success: true,
        data: {
          results: results.results,
          totalTests: finalTestCases.length,
          passedTests: results.summary.passedTestCases,
          executionTime: results.summary.averageExecutionTime || 0,
          memoryUsed: results.summary.averageMemoryUsed || 0,
          overallResult: results.summary.passedTestCases === finalTestCases.length ? 'ACCEPTED' : 'WRONG_ANSWER',
          compilationError: null
        },
        message: 'Code executed successfully'
      });

    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({
        success: false,
        message: 'Code execution failed',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/enhanced/submit
 * Submit code for a problem
 */
router.post('/submit',
  submissionLimit,
  authenticateToken,
  ...validateSubmission,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { problemId, code, language } = req.body;
      const userId = req.user._id;
      console.log('🔍 User ID for submission:', userId);
      console.log('🔍 User object type:', typeof userId);
      console.log('🔍 User object:', req.user._id);

      // Verify problem exists and is active
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
      console.log('✅ Submission saved:', submission._id);

      // Update user's submissions array for statistics
      console.log('🔍 About to update user:', userId, 'with submission:', submission._id);
      const updateResult = await User.findByIdAndUpdate(
        userId,
        { $push: { submissions: submission._id } },
        { new: true }
      );
      
      if (updateResult) {
        console.log('✅ User submissions array updated for user:', userId);
        console.log('📊 New submissions count:', updateResult.submissions.length);
      } else {
        console.error('❌ User update failed - user not found:', userId);
      }

      // Add to processing queue
      await addSubmission({
        submissionId: submission._id,
        problemId,
        code,
        language,
        userId
      });

      // Populate submission data for response
      await submission.populate('problemId', 'title slug difficulty');

      res.status(201).json({
        success: true,
        data: {
          submissionId: submission._id,
          status: submission.status,
          problemTitle: submission.problemId.title,
          language: submission.language,
          submittedAt: submission.submittedAt
        },
        message: 'Code submitted successfully'
      });

    } catch (error) {
      console.error('Submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Submission failed',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/enhanced/submission/:id
 * Get submission details with real-time status
 */
router.get('/submission/:id',
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid submission ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid submission ID',
          errors: errors.array()
        });
      }

      const submissionId = req.params.id;
      const userId = req.user._id;

      const submission = await Submission.findById(submissionId)
        .populate('problemId', 'title slug difficulty')
        .populate('userId', 'username name')
        .lean();

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      // Check access permissions
      if (submission.userId._id.toString() !== userId.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: submission,
        message: 'Submission retrieved successfully'
      });

    } catch (error) {
      console.error('Get submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve submission',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/enhanced/debug/user-submissions
 * Debug endpoint to verify user submission isolation
 */
router.get('/debug/user-submissions',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const problemId = req.query.problemId;
      
      console.log(`[DEBUG] Current authenticated user: ${userId} (${req.user.username})`);
      console.log(`[DEBUG] Problem ID filter: ${problemId}`);
      
      // Get ALL submissions in database for comparison
      const allSubmissions = await Submission.find({})
        .populate('userId', 'username')
        .populate('problemId', 'title')
        .sort({ submittedAt: -1 })
        .limit(10)
        .lean();
      
      // Get submissions for this user only
      const query = { userId: userId };
      if (problemId) {
        query.problemId = problemId;
      }
      
      const userSubmissions = await Submission.find(query)
        .populate('problemId', 'title')
        .sort({ submittedAt: -1 })
        .limit(10)
        .lean();
      
      res.json({
        success: true,
        debug: {
          authenticatedUser: {
            id: userId.toString(),
            username: req.user.username,
            email: req.user.email
          },
          problemFilter: problemId || 'none',
          totalSubmissionsInDB: allSubmissions.length,
          userSubmissionsFound: userSubmissions.length,
          allSubmissionsPreview: allSubmissions.map(s => ({
            id: s._id,
            userId: s.userId._id.toString(),
            username: s.userId.username,
            problem: s.problemId?.title || 'Unknown',
            belongsToCurrentUser: s.userId._id.toString() === userId.toString()
          })),
          userSubmissions: userSubmissions.map(s => ({
            id: s._id,
            userId: s.userId.toString(),
            problem: s.problemId?.title || 'Unknown',
            status: s.status,
            submittedAt: s.submittedAt
          }))
        }
      });
      
    } catch (error) {
      console.error('Debug user submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Debug failed',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/enhanced/submissions/user
 * Get user submissions with pagination
 */
router.get('/submissions/user',
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('problemId').optional().isMongoId().withMessage('Invalid problem ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const userId = req.user._id || req.user.id;

      console.log(`[SECURITY CHECK] getUserSubmissions - AUTHENTICATED USER ID: ${userId}`);
      console.log(`[SECURITY CHECK] getUserSubmissions - User object:`, req.user);
      console.log(`[SECURITY CHECK] getUserSubmissions - page: ${page}, limit: ${limit}`);

      // Build query - CRITICAL: Must filter by userId
      const query = { userId: userId };  // EXPLICIT userId filtering
      if (req.query.problemId) {
        query.problemId = req.query.problemId;
        console.log(`[SECURITY CHECK] getUserSubmissions - filtering by problemId: ${req.query.problemId}`);
      }

      console.log(`[SECURITY CHECK] getUserSubmissions - FINAL QUERY:`, JSON.stringify(query));

      // Get submissions with pagination - SECURITY: Double-filter by userId
      const [submissions, total] = await Promise.all([
        Submission.find(query)
          .populate('problemId', 'title slug difficulty')
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .then(subs => {
            // EXTRA SECURITY: Filter again to ensure only user's submissions
            return subs.filter(s => s.userId.toString() === userId.toString());
          }),
        Submission.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      console.log(`[SECURITY CHECK] getUserSubmissions - found ${submissions.length} submissions for user ${userId}`);
      console.log(`[SECURITY CHECK] getUserSubmissions - submission userIds:`, submissions.map(s => `${s.userId} (user: ${userId})`));
      
      // DOUBLE CHECK: Verify all submissions belong to the authenticated user
      const invalidSubmissions = submissions.filter(s => s.userId.toString() !== userId.toString());
      if (invalidSubmissions.length > 0) {
        console.error(`[SECURITY VIOLATION] Found ${invalidSubmissions.length} submissions that don't belong to user ${userId}!`);
        console.error(`[SECURITY VIOLATION] Invalid submissions:`, invalidSubmissions.map(s => ({ id: s._id, belongsTo: s.userId })));
      }

      res.json({
        success: true,
        data: {
          items: submissions,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount: total,
            hasNext: page < totalPages,
            hasPrevious: page > 1
          }
        },
        message: 'Submissions retrieved successfully'
      });

    } catch (error) {
      console.error('Get user submissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve submissions',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/enhanced/problems
 * Enhanced problem listing with filtering and pagination
 */
router.get('/problems',
  optionalAuth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('tags').optional().isString(),
  query('search').optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query = { isActive: true };
      
      if (req.query.difficulty) {
        query.difficulty = req.query.difficulty;
      }
      
      if (req.query.tags) {
        const tags = req.query.tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tags };
      }
      
      if (req.query.search) {
        query.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      // Get problems with pagination
      const [problems, total] = await Promise.all([
        Problem.find(query)
          .select('title slug difficulty tags totalSubmissions acceptedSubmissions acceptanceRate isFeatured createdAt')
          .sort({ difficulty: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Problem.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          items: problems,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount: total,
            hasNext: page < totalPages,
            hasPrevious: page > 1
          }
        },
        message: 'Problems retrieved successfully'
      });

    } catch (error) {
      console.error('Get problems error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve problems',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/enhanced/problem/:identifier
 * Get detailed problem information by slug or ID
 */
router.get('/problem/:identifier',
  optionalAuth,
  param('identifier').isString().withMessage('Invalid problem identifier'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid problem identifier',
          errors: errors.array()
        });
      }

      const { identifier } = req.params;
      let problem;

      // Check if identifier is a valid ObjectId (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
        // Search by ID
        problem = await Problem.findOne({ 
          _id: identifier, 
          isActive: true 
        }).lean();
      } else {
        // Search by slug
        problem = await Problem.findOne({ 
          slug: identifier, 
          isActive: true 
        }).lean();
      }

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      // If user is authenticated, get their submission status
      let userStats = null;
      if (req.user) {
        const userSubmissions = await Submission.find({
          userId: req.user._id,
          problemId: problem._id
        }).select('status submittedAt').sort({ submittedAt: -1 }).limit(10).lean();

        userStats = {
          hasSubmitted: userSubmissions.length > 0,
          isAccepted: userSubmissions.some(s => s.status === 'Accepted'),
          submissionCount: userSubmissions.length,
          lastSubmission: userSubmissions[0]?.submittedAt
        };
      }

      res.json({
        success: true,
        data: {
          ...problem,
          userStats
        },
        message: 'Problem retrieved successfully'
      });

    } catch (error) {
      console.error('Get problem error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve problem',
        error: error.message
      });
    }
  }
);

module.exports = router;
