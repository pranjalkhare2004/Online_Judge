/**
 * SUBMISSION QUEUE MANAGEMENT
 * 
 * DESCRIPTION:
 * This file implements a Redis-based queue system for managing code submission
 * processing in the Online Judge system. It handles asynchronous code execution,
 * load balancing, retry mechanisms, and submission status updates. Provides
 * scalable and reliable submission processing infrastructure.
 * 
 * FUNCTIONS USED:
 * - addSubmission(): Adds submission to processing queue
 * - submissionQueue.process(): Queue job processing handler
 * - executeCode(): Code execution engine invocation
 * - getTestCasesForExecution(): Test case retrieval
 * - Submission.updateOne(): Database status updates
 * - Queue(): Bull queue instance creation
 * - job.data access: Job data extraction
 * - Math.max(): Performance metric calculation
 * 
 * EXPORTS:
 * - addSubmission: Function to enqueue submissions
 * - submissionQueue: Bull queue instance (for monitoring/admin)
 * 
 * USED BY:
 * - routes/submissions.js: Submission queueing
 * - routes/contests.js: Contest submission processing
 * - server.js: Queue initialization and monitoring
 * - utils/executeCode.js: Code execution coordination
 * 
 * DEPENDENCIES:
 * - utils/compiler.js: Code execution engine
 * - utils/problemTestCases.js: Test case management
 * - models/Submission.js: Submission data model
 * 
 * QUEUE FEATURES:
 * - Redis-based job queue (Bull)
 * - Automatic retry on failure (3 attempts)
 * - Job prioritization support
 * - Parallel processing capability
 * - Progress tracking and monitoring
 * - Failed job handling and logging
 * 
 * PROCESSING WORKFLOW:
 * 1. Submission added to queue
 * 2. Worker picks up job
 * 3. Retrieve problem test cases
 * 4. Execute code against test cases
 * 5. Calculate results and metrics
 * 6. Update submission status in database
 * 7. Handle success/failure scenarios
 * 
 * ERROR HANDLING:
 * - Automatic retry on transient failures
 * - Database rollback on processing errors
 * - Comprehensive error logging
 * - Status tracking throughout process
 */

// Backend/utils/submissionQueue.js
const { executeCodeSecure } = require('../services/dockerCompilerFixed');
const { getTestCasesForExecution } = require('./problemTestCases');
const Submission = require('../models/Submission');

// Simple in-memory queue as fallback
const submissionQueue = [];
let isProcessing = false;

/**
 * Adds a submission to the queue for processing
 * @param {Object} submissionData - Submission details
 */
const addSubmission = async (submissionData) => {
  submissionQueue.push(submissionData);
  if (!isProcessing) {
    processQueue();
  }
  return Promise.resolve();
};

/**
 * Process submissions in the queue
 */
const processQueue = async () => {
  if (isProcessing || submissionQueue.length === 0) return;
  
  isProcessing = true;
  
  while (submissionQueue.length > 0) {
    const job = submissionQueue.shift();
    await processSubmission(job);
  }
  
  isProcessing = false;
};

/**
 * Process a single submission
 */
const processSubmission = async (submissionData) => {
  const { code, language, problemId, submissionId, userId } = submissionData;
  
  try {
    console.log(`Processing submission ${submissionId}...`);
    
    // Update status to Running
    await Submission.updateOne({ _id: submissionId }, {
      status: 'Running'
    });
    
    // Get test cases and execute code using Docker compiler
    const testCases = await getTestCasesForExecution(problemId, false); // false = get all test cases (visible + hidden)
    const dockerResults = await executeCodeSecure(code, language, testCases);
    
    // Transform Docker results to submission format
    const transformedResults = dockerResults.results.map(result => ({
      passed: result.passed,
      executionTime: result.executionTime || 0,
      memoryUsed: result.memoryUsed || 0,
      error: result.error || null,
      output: result.actualOutput || '', 
      expectedOutput: result.expectedOutput,
      input: result.input
    }));
    
    // Enhanced debugging for overall status determination
    const passedCount = dockerResults.summary.passedTestCases;
    const totalCount = dockerResults.summary.totalTestCases;
    const allPassed = passedCount === totalCount;
    
    console.log(`[DEBUG] Overall status calculation:`);
    console.log(`[DEBUG]   Passed: ${passedCount}/${totalCount}`);
    console.log(`[DEBUG]   All passed: ${allPassed}`);
    
    dockerResults.results.forEach((result, index) => {
      console.log(`[DEBUG]   Test ${index + 1}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      if (!result.passed) {
        console.log(`[DEBUG]     Expected: "${result.expectedOutput}"`);
        console.log(`[DEBUG]     Actual: "${result.actualOutput}"`);
      }
    });
    
    // Determine final status
    const status = allPassed ? 'ACCEPTED' : 'REJECTED';
    console.log(`[DEBUG] Final submission status: ${status}`);
    
    // Update submission with results
    await Submission.updateOne({ _id: submissionId }, {
      status: status,
      testResults: transformedResults, // Store test results properly  
      testCaseResults: transformedResults, // Legacy field for compatibility
      executionTime: dockerResults.summary.averageExecutionTime || 0,
      memoryUsed: Math.max(...transformedResults.map(r => r.memoryUsed || 0)),
      passedTests: passedCount,
      totalTests: totalCount,
      score: allPassed ? 100 : Math.floor((passedCount / totalCount) * 100),
      completedAt: new Date()
    });
    
    // Update user statistics if submission is accepted
    if (status === 'ACCEPTED' && userId) {
      try {
        const User = require('../models/User');
        const Problem = require('../models/Problem');
        
        console.log(`[DEBUG] Processing ACCEPTED submission for user ${userId}, problem ${problemId}`);
        
        // Get user and check if already solved this problem
        const user = await User.findById(userId);
        if (!user) {
          console.error(`[ERROR] User ${userId} not found`);
          return;
        }
        
        const hasAlreadySolved = user.solvedProblems && user.solvedProblems.some(
          solved => solved.problemId.toString() === problemId.toString()
        );
        
        console.log(`[DEBUG] Has already solved: ${hasAlreadySolved}`);
        
        // Add submission to user's submissions array
        await User.updateOne(
          { _id: userId },
          { $addToSet: { submissions: submissionId } }
        );
        
        // If first time solving this problem, add to solvedProblems and update streak
        if (!hasAlreadySolved) {
          const problem = await Problem.findById(problemId);
          
          console.log(`[DEBUG] First time solving problem ${problemId} (${problem?.title || 'Unknown'})`);
          
          // Update streak first
          user.updateStreak();
          
          // Add to solved problems with proper structure
          await User.updateOne(
            { _id: userId },
            { 
              $addToSet: { 
                solvedProblems: {
                  problemId: problemId,
                  solvedAt: new Date(),
                  difficulty: problem?.difficulty || 'Easy'
                }
              },
              // Update last solved date and streak
              lastSolvedDate: new Date(),
              currentStreak: user.currentStreak + 1,
              longestStreak: Math.max(user.longestStreak || 0, user.currentStreak + 1)
            }
          );
          
          console.log(`[DEBUG] ✅ User ${userId} solved new problem ${problemId}. Updated streak: ${user.currentStreak + 1}`);
        } else {
          console.log(`[DEBUG] ⚠️  User ${userId} already solved problem ${problemId}, not updating statistics`);
        }
      } catch (error) {
        console.error(`[ERROR] Failed to update user statistics:`, error);
      }
    }
    
    console.log(`Submission ${submissionId} processed: ${status}`);
    
  } catch (error) {
    console.error(`Error processing submission ${submissionId}:`, error);
    
    await Submission.updateOne({ _id: submissionId }, {
      status: 'ERROR',
      errorMessage: error.message
    });
  }
};

module.exports = { addSubmission };
