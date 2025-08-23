/**
 * ENHANCED COMPILER API ROUTES
 * 
 * Professional-grade code compilation and execution API with job queue support,
 * Docker isolation, rate limiting, and comprehensive error handling.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Problem = require('../models/Problem');
const { authenticateToken: auth } = require('../middleware/auth');
const { 
  submitExecutionJob, 
  getJobResult, 
  executeCodeDirectly,
  getQueueStats,
  isRedisAvailable
} = require('../services/executionQueue');

// Rate limiting configuration
const executeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Maximum 10 executions per minute per IP
  message: {
    success: false,
    message: 'Too many execution requests. Please try again later.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const resultRateLimit = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // Maximum 30 result checks per 10 seconds
  message: {
    success: false,
    message: 'Too many result requests. Please slow down.',
    retryAfter: '10 seconds'
  }
});

// Input validation middleware
const validateExecutionRequest = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Code must be between 1 and 50,000 characters'),
  
  body('language')
    .isIn(['cpp', 'java', 'python', 'javascript'])
    .withMessage('Invalid language. Supported: cpp, java, python, javascript'),
  
  body('testCases')
    .isArray({ min: 1, max: 20 })
    .withMessage('Test cases must be an array with 1-20 items'),
  
  body('testCases.*.input')
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Test case input must be a string (max 1000 characters)'),
  
  body('testCases.*.expectedOutput')
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Test case expected output must be a string (max 1000 characters)')
];

/**
 * POST /api/compiler/execute
 * Execute code with custom test cases (async with job queue)
 */
router.post('/execute', 
  executeRateLimit,
  auth,
  ...validateExecutionRequest,
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { code, language, testCases } = req.body;
      const userId = req.user.id;

      console.log(`📝 Code execution request from user ${userId}: ${language}, ${testCases.length} test cases`);

      // Submit job to queue or execute directly
      const result = await submitExecutionJob({
        code,
        language,
        testCases,
        userId,
        problemId: null
      });

      if (result.status === 'completed') {
        // Immediate execution (no queue)
        res.json({
          success: true,
          data: result.result,
          jobId: result.jobId,
          status: 'completed',
          message: 'Code executed successfully'
        });
      } else {
        // Queued execution
        res.json({
          success: true,
          jobId: result.jobId,
          status: result.status,
          message: 'Code execution queued. Use /result/{jobId} to check status.',
          pollInterval: 1000 // Suggest polling every 1 second
        });
      }

    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during code execution',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/compiler/execute-sync
 * Execute code synchronously (for immediate results)
 */
router.post('/execute-sync',
  executeRateLimit,
  auth,
  ...validateExecutionRequest,
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

      const { code, language, testCases } = req.body;
      const userId = req.user.id;

      console.log(`⚡ Synchronous execution request from user ${userId}: ${language}`);

      // Execute directly (no queue)
      const result = await executeCodeDirectly(code, language, testCases);

      res.json({
        success: true,
        data: result,
        message: 'Code executed successfully'
      });

    } catch (error) {
      console.error('Synchronous execution error:', error);
      res.status(500).json({
        success: false,
        message: 'Code execution failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/compiler/result/:jobId
 * Get execution result by job ID
 */
router.get('/result/:jobId',
  resultRateLimit,
  auth,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      
      if (!jobId || typeof jobId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid job ID'
        });
      }

      const result = await getJobResult(jobId);

      res.json(result);

    } catch (error) {
      console.error('Job result error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get job result',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * POST /api/compiler/run-problem
 * Execute code against a specific problem's test cases
 */
router.post('/run-problem',
  executeRateLimit,
  auth,
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('language').isIn(['cpp', 'java', 'python', 'javascript']).withMessage('Invalid language'),
    body('problemId').isMongoId().withMessage('Invalid problem ID')
  ],
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

      const { code, language, problemId } = req.body;
      const userId = req.user.id;

      // Get problem details
      const problem = await Problem.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found'
        });
      }

      // Convert problem test cases to execution format
      const testCases = problem.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      }));

      console.log(`🧪 Problem execution: ${problem.title} (${testCases.length} test cases)`);

      // Submit execution job
      const result = await submitExecutionJob({
        code,
        language,
        testCases,
        userId,
        problemId
      });

      if (result.status === 'completed') {
        res.json({
          success: true,
          data: {
            ...result.result,
            problemTitle: problem.title,
            totalPoints: problem.points || 100
          },
          jobId: result.jobId,
          status: 'completed'
        });
      } else {
        res.json({
          success: true,
          jobId: result.jobId,
          status: result.status,
          message: `Problem execution queued. Problem: ${problem.title}`,
          problemTitle: problem.title,
          pollInterval: 1000
        });
      }

    } catch (error) {
      console.error('Problem execution error:', error);
      res.status(500).json({
        success: false,
        message: 'Problem execution failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/compiler/languages
 * Get supported programming languages
 */
router.get('/languages', (req, res) => {
  try {
    const languages = [
      {
        value: 'cpp',
        label: 'C++',
        extension: 'cpp',
        version: 'GCC 9',
        features: ['STL', 'C++17']
      },
      {
        value: 'java',
        label: 'Java',
        extension: 'java',
        version: 'OpenJDK 11',
        features: ['Collections', 'Generics']
      },
      {
        value: 'python',
        label: 'Python',
        extension: 'py',
        version: 'Python 3.9',
        features: ['Standard Library', 'NumPy Ready']
      },
      {
        value: 'javascript',
        label: 'JavaScript',
        extension: 'js',
        version: 'Node.js 16',
        features: ['ES6+', 'Async/Await']
      }
    ];

    res.json({
      success: true,
      data: languages,
      count: languages.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get language list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/compiler/stats
 * Get execution queue statistics (admin only)
 */
router.get('/stats',
  auth,
  async (req, res) => {
    try {
      // Check if user is admin (you might have different admin check logic)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const stats = await getQueueStats();
      const systemInfo = {
        redisAvailable: isRedisAvailable(),
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };

      res.json({
        success: true,
        data: {
          queue: stats,
          system: systemInfo
        }
      });

    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * GET /api/compiler/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: isRedisAvailable(),
      queue: isRedisAvailable()
    },
    version: '2.0.0'
  };

  res.json({
    success: true,
    data: health
  });
});

module.exports = router;
