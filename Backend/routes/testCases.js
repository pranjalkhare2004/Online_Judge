// Backend/routes/testCases.js
const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateTestCase, validateTestCaseUpdate } = require('../middleware/validation');
const { 
  getPublicTestCases,
  updateTestCase,
  deleteTestCase,
  validateTestCaseData 
} = require('../utils/problemTestCases');
const TestCase = require('../models/TestCase');
const Problem = require('../models/Problem');

const router = express.Router();

/**
 * @route   POST /api/testcases
 * @desc    Create a test case for a problem (admin only)
 * @access  Private (Admin)
 */
router.post('/', authenticateToken, requireAdmin, validateTestCase, async (req, res) => {
  try {
    const { problemId, input, expectedOutput, isPublic } = req.body;
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const testCase = new TestCase({ problemId, input, expectedOutput, isPublic });
    await testCase.save();

    await Problem.updateOne({ _id: problemId }, { $push: { testCases: testCase._id } });

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
 * @route   GET /api/testcases/:problemId/public
 * @desc    Get public test cases for a problem
 * @access  Private
 */
router.get('/:problemId/public', authenticateToken, async (req, res) => {
  try {
    const testCases = await getPublicTestCases(req.params.problemId);
    res.status(200).json({
      success: true,
      data: testCases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/testcases/:problemId
 * @desc    Get all test cases for a problem (admin only)
 * @access  Private (Admin)
 */
router.get('/:problemId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const testCases = await TestCase.find({ problemId: req.params.problemId })
      .select('input expectedOutput isPublic description points');
    res.status(200).json({
      success: true,
      data: testCases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test cases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/testcases/:id
 * @desc    Update a test case (admin only)
 * @access  Private (Admin)
 */
router.put('/:id', authenticateToken, requireAdmin, validateTestCaseUpdate, async (req, res) => {
  try {
    const { input, expectedOutput, isPublic, description, points } = req.body;
    
    // Validate the data
    const validation = validateTestCaseData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }
    
    const testCase = await updateTestCase(req.params.id, {
      input, 
      expectedOutput, 
      isPublic, 
      description, 
      points
    });

    res.status(200).json({
      success: true,
      message: 'Test case updated successfully',
      data: testCase
    });
  } catch (error) {
    if (error.message === 'Test case not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update test case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   DELETE /api/testcases/:id
 * @desc    Delete a test case (admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await deleteTestCase(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Test case deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Test case not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete test case',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
