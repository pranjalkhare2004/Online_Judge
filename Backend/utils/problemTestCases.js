// Backend/utils/problemTestCases.js
const TestCase = require('../models/TestCase');
const Problem = require('../models/Problem');

/**
 * Create multiple test cases for a problem
 * @param {string} problemId - Problem ID
 * @param {Array} testCasesData - Array of test case objects
 * @returns {Promise<Array>} Created test cases
 */
const createTestCasesForProblem = async (problemId, testCasesData) => {
  try {
    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    const createdTestCases = [];
    const testCaseIds = [];

    for (const testCaseData of testCasesData) {
      const testCase = new TestCase({
        problemId,
        ...testCaseData
      });
      await testCase.save();
      createdTestCases.push(testCase);
      testCaseIds.push(testCase._id);
    }

    // Update problem with test case references
    await Problem.updateOne(
      { _id: problemId },
      { $push: { testCases: { $each: testCaseIds } } }
    );

    return createdTestCases;
  } catch (error) {
    throw new Error(`Failed to create test cases: ${error.message}`);
  }
};

/**
 * Get test cases for problem execution (includes all test cases for admin, only public for users)
 * @param {string} problemId - Problem ID
 * @param {boolean} isAdmin - Whether the user is admin
 * @returns {Promise<Array>} Test cases
 */
const getTestCasesForExecution = async (problemId, isAdmin = false) => {
  try {
    const filter = { problemId };
    if (!isAdmin) {
      // For regular users and code execution, we need all test cases (not just public)
      // Public test cases are only for showing examples to users
    }

    const testCases = await TestCase.find(filter)
      .select('input expectedOutput timeLimit memoryLimit points')
      .lean();

    if (testCases.length === 0) {
      throw new Error('No test cases found for this problem');
    }

    return testCases;
  } catch (error) {
    throw new Error(`Failed to get test cases: ${error.message}`);
  }
};

/**
 * Get public test cases for problem preview
 * @param {string} problemId - Problem ID
 * @returns {Promise<Array>} Public test cases
 */
const getPublicTestCases = async (problemId) => {
  try {
    const testCases = await TestCase.find({ 
      problemId, 
      isPublic: true 
    })
    .select('input expectedOutput description')
    .lean();

    return testCases;
  } catch (error) {
    throw new Error(`Failed to get public test cases: ${error.message}`);
  }
};

/**
 * Update test case and sync with problem
 * @param {string} testCaseId - Test case ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated test case
 */
const updateTestCase = async (testCaseId, updateData) => {
  try {
    const testCase = await TestCase.findByIdAndUpdate(
      testCaseId,
      { 
        ...updateData, 
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );

    if (!testCase) {
      throw new Error('Test case not found');
    }

    return testCase;
  } catch (error) {
    throw new Error(`Failed to update test case: ${error.message}`);
  }
};

/**
 * Delete test case and remove from problem
 * @param {string} testCaseId - Test case ID
 * @returns {Promise<void>}
 */
const deleteTestCase = async (testCaseId) => {
  try {
    const testCase = await TestCase.findById(testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    // Remove test case reference from problem
    await Problem.updateOne(
      { _id: testCase.problemId },
      { $pull: { testCases: testCase._id } }
    );

    // Delete the test case
    await TestCase.findByIdAndDelete(testCaseId);
  } catch (error) {
    throw new Error(`Failed to delete test case: ${error.message}`);
  }
};

/**
 * Validate test case data
 * @param {Object} testCaseData - Test case data to validate
 * @returns {Object} Validation result
 */
const validateTestCaseData = (testCaseData) => {
  const errors = [];

  if (!testCaseData.input && testCaseData.input !== '') {
    errors.push('Input is required');
  }

  if (!testCaseData.expectedOutput) {
    errors.push('Expected output is required');
  }

  if (testCaseData.input && testCaseData.input.length > 10000) {
    errors.push('Input cannot exceed 10,000 characters');
  }

  if (testCaseData.expectedOutput && testCaseData.expectedOutput.length > 10000) {
    errors.push('Expected output cannot exceed 10,000 characters');
  }

  if (testCaseData.points && (testCaseData.points < 0 || testCaseData.points > 100)) {
    errors.push('Points must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  createTestCasesForProblem,
  getTestCasesForExecution,
  getPublicTestCases,
  updateTestCase,
  deleteTestCase,
  validateTestCaseData
};
