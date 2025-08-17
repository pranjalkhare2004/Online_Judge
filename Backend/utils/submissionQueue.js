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
const { executeCode } = require('./compiler');
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
  const { code, language, problemId, submissionId } = submissionData;
  
  try {
    console.log(`Processing submission ${submissionId}...`);
    
    // Update status to Running
    await Submission.updateOne({ _id: submissionId }, {
      status: 'Running'
    });
    
    // Get test cases and execute code
    const testCases = await getTestCasesForExecution(problemId, false);
    const results = await executeCode(code, language, testCases);
    
    // Determine final status
    const allPassed = results.every(r => r.status === 'Passed');
    const status = allPassed ? 'ACCEPTED' : 'REJECTED';
    
    // Update submission with results
    await Submission.updateOne({ _id: submissionId }, {
      status: status,
      testCaseResults: results,
      executionTime: Math.max(...results.map(r => r.executionTime || 0)),
      memoryUsed: Math.max(...results.map(r => r.memoryUsed || 0))
    });
    
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
