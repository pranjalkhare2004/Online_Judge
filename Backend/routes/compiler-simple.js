/**
 * REAL COMPILER API ROUTES - WITH ACTUAL EXECUTION
 * 
 * Compiler routes that actually execute code and verify test cases
 */

const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { executeCode } = require('../services/realCompiler');

/**
 * GET /api/compiler/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: false, // Temporarily false for testing
      queue: false
    },
    version: '2.0.0'
  };

  res.json({
    success: true,
    data: health
  });
});

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
 * POST /api/compiler/execute
 * Real execution endpoint that runs code and verifies test cases
 */
router.post('/execute', auth, async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Code and language are required'
      });
    }

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one test case is required'
      });
    }

    console.log(`🚀 Executing ${language} code with ${testCases.length} test cases for user ${req.user.id}`);

    // Execute code with real compiler
    const result = await executeCode(code, language, testCases);

    res.json({
      success: true,
      data: result,
      message: result.overallResult === 'ACCEPTED' 
        ? `All test cases passed! (${result.passedTests}/${result.totalTests})`
        : result.compilationError 
          ? 'Compilation failed'
          : `${result.passedTests}/${result.totalTests} test cases passed`
    });

  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Code execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/compiler/run-problem
 * Execute code against a specific problem's test cases
 */
router.post('/run-problem', auth, async (req, res) => {
  try {
    const { code, language, problemId } = req.body;

    // Basic validation
    if (!code || !language || !problemId) {
      return res.status(400).json({
        success: false,
        message: 'Code, language, and problemId are required'
      });
    }

    console.log(`🎯 Running code against problem ${problemId} for user ${req.user.id}`);

    // Fetch actual problem test cases from database
    const Problem = require('../models/Problem');
    const TestCase = require('../models/TestCase'); // Need this for populate to work
    let testCases;

    try {
      console.log(`🔍 Searching for problem with slug: ${problemId}`);
      const problem = await Problem.findOne({ slug: problemId }).populate('testCases');
      if (!problem) {
        console.log(`❌ Problem not found with slug: ${problemId}`);
        return res.status(404).json({
          success: false,
          message: `Problem ${problemId} not found`
        });
      }

      console.log(`✅ Problem found: ${problem.title}`);
      console.log(`📋 Test cases count: ${problem.testCases?.length || 0}`);

      // Use actual test cases from the problem
      testCases = problem.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput
      }));

      console.log(`📋 Found ${testCases.length} test cases for problem: ${problem.title}`);
      console.log('📋 Test cases:', testCases);

    } catch (dbError) {
      console.error('Database error fetching problem:', dbError);
      // Fallback to sample test cases for Two Sum if database fails
      if (problemId === 'two-sum') {
        testCases = [
          { input: "3 2 7 11 9", expectedOutput: "0 1" },
          { input: "4 3 2 4 6 6", expectedOutput: "1 2" },
          { input: "2 3 3 6", expectedOutput: "0 1" }
        ];
        console.log(`📋 Using fallback test cases for Two Sum problem`);
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch problem test cases'
        });
      }
    }

    // Execute code with problem test cases
    const result = await executeCode(code, language, testCases);

    res.json({
      success: true,
      data: {
        ...result,
        problemId: problemId,
        submissionStatus: result.overallResult === 'ACCEPTED' ? 'Accepted' : 'Wrong Answer'
      },
      message: result.overallResult === 'ACCEPTED' 
        ? `Problem solved! All ${result.passedTests} test cases passed!`
        : result.compilationError 
          ? 'Compilation failed'
          : `Solution incorrect: ${result.passedTests}/${result.totalTests} test cases passed`
    });

  } catch (error) {
    console.error('Problem execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Problem execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
