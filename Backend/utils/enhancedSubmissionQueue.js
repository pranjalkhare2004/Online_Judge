/**
 * ENHANCED SUBMISSION QUEUE SYSTEM
 * 
 * Real-time submission processing with job queue management,
 * status tracking, and proper error handling.
 */

const Bull = require('bull');
const Redis = require('ioredis');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true
});

// Create submission processing queue
const submissionQueue = new Bull('submission processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
    attempts: 3,
    backoff: 'exponential'
  }
});

// Job processing configuration
const CONCURRENT_JOBS = process.env.NODE_ENV === 'production' ? 5 : 3;
const JOB_TIMEOUT = 60000; // 60 seconds

/**
 * Add submission to processing queue
 */
async function addSubmission(submissionData) {
  try {
    const job = await submissionQueue.add('process-submission', submissionData, {
      priority: submissionData.priority || 0,
      delay: 0,
      timeout: JOB_TIMEOUT
    });

    console.log(`📋 Submission ${submissionData.submissionId} added to queue (Job ID: ${job.id})`);
    return job.id;
  } catch (error) {
    console.error('Failed to add submission to queue:', error);
    throw error;
  }
}

/**
 * Process submission job
 */
submissionQueue.process('process-submission', CONCURRENT_JOBS, async (job) => {
  const { submissionId, problemId, code, language, userId } = job.data;
  
  console.log(`🔄 Processing submission ${submissionId} (Job ${job.id})`);
  
  try {
    // Update status to "Running"
    await updateSubmissionStatus(submissionId, 'Running', {
      startedAt: new Date(),
      progress: 10
    });

    // Get problem details and test cases
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    await updateSubmissionStatus(submissionId, 'Running', { progress: 20 });

    // Execute code against test cases
    const executionResult = await executeCodeWithTestCases(code, language, problem.testCases, job);

    await updateSubmissionStatus(submissionId, 'Running', { progress: 80 });

    // Determine final status
    const finalStatus = determineFinalStatus(executionResult);
    
    // Calculate performance metrics
    const metrics = calculateMetrics(executionResult);

    // Update submission with final results
    await updateSubmissionWithResults(submissionId, {
      status: finalStatus,
      executionTime: metrics.avgExecutionTime,
      memoryUsed: metrics.avgMemoryUsed,
      testResults: executionResult.testResults,
      score: metrics.score,
      passedTests: metrics.passedTests,
      totalTests: metrics.totalTests,
      completedAt: new Date(),
      progress: 100
    });

    // Update problem statistics
    await updateProblemStats(problemId, finalStatus);

    // Update user statistics
    await updateUserStats(userId, finalStatus);

    console.log(`✅ Submission ${submissionId} completed with status: ${finalStatus}`);
    
    return {
      submissionId,
      status: finalStatus,
      metrics,
      completedAt: new Date()
    };

  } catch (error) {
    console.error(`❌ Submission ${submissionId} failed:`, error);
    
    await updateSubmissionStatus(submissionId, 'System Error', {
      error: error.message,
      completedAt: new Date(),
      progress: 100
    });

    throw error;
  }
});

/**
 * Execute code with test cases
 */
async function executeCodeWithTestCases(code, language, testCases, job) {
  const results = {
    testResults: [],
    compilationError: null,
    runtimeError: null
  };

  try {
    // Update progress
    await updateJobProgress(job, 30);

    // Compile code (if needed)
    const compileResult = await compileCode(code, language);
    if (!compileResult.success) {
      results.compilationError = compileResult.error;
      return results;
    }

    await updateJobProgress(job, 40);

    // Execute against each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      try {
        const result = await executeTestCase(code, language, testCase);
        results.testResults.push({
          testCaseId: i + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: result.output,
          passed: result.output.trim() === testCase.expectedOutput.trim(),
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          error: result.error
        });

        // Update progress
        const progress = 40 + ((i + 1) / testCases.length) * 35;
        await updateJobProgress(job, progress);

      } catch (error) {
        results.testResults.push({
          testCaseId: i + 1,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          executionTime: 0,
          memoryUsed: 0,
          error: error.message
        });
      }
    }

    return results;

  } catch (error) {
    results.runtimeError = error.message;
    return results;
  }
}

/**
 * Compile code for languages that require compilation
 */
async function compileCode(code, language) {
  // Simulation of compilation process
  // In production, this would use actual compilers in sandboxed environments
  
  if (['cpp', 'c', 'java'].includes(language)) {
    // Simulate compilation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate compilation success/failure
    if (Math.random() > 0.95) {
      return {
        success: false,
        error: 'Compilation failed: syntax error'
      };
    }
  }

  return { success: true };
}

/**
 * Execute single test case
 */
async function executeTestCase(code, language, testCase) {
  // Simulation of code execution
  // In production, this would use Docker containers or sandboxed environments
  
  const executionTime = Math.floor(Math.random() * 200) + 50; // 50-250ms
  const memoryUsed = Math.floor(Math.random() * 10240) + 1024; // 1-11MB
  
  // Simulate execution delay
  await new Promise(resolve => setTimeout(resolve, executionTime));
  
  // Simulate different outcomes
  const random = Math.random();
  
  if (random > 0.95) {
    throw new Error('Runtime error: division by zero');
  }
  
  if (random > 0.9) {
    throw new Error('Time limit exceeded');
  }
  
  if (random > 0.85) {
    throw new Error('Memory limit exceeded');
  }
  
  // Simulate correct/incorrect output
  const isCorrect = Math.random() > 0.3; // 70% success rate
  
  return {
    output: isCorrect ? testCase.expectedOutput : 'Wrong output',
    executionTime,
    memoryUsed,
    error: null
  };
}

/**
 * Determine final submission status
 */
function determineFinalStatus(executionResult) {
  if (executionResult.compilationError) {
    return 'Compilation Error';
  }
  
  if (executionResult.runtimeError) {
    return 'Runtime Error';
  }
  
  if (executionResult.testResults.length === 0) {
    return 'System Error';
  }
  
  const allPassed = executionResult.testResults.every(result => result.passed);
  if (allPassed) {
    return 'Accepted';
  }
  
  const hasTimeLimit = executionResult.testResults.some(result => 
    result.error && result.error.includes('Time limit exceeded')
  );
  if (hasTimeLimit) {
    return 'Time Limit Exceeded';
  }
  
  const hasMemoryLimit = executionResult.testResults.some(result =>
    result.error && result.error.includes('Memory limit exceeded')
  );
  if (hasMemoryLimit) {
    return 'Memory Limit Exceeded';
  }
  
  const hasRuntimeError = executionResult.testResults.some(result =>
    result.error && !result.error.includes('limit exceeded')
  );
  if (hasRuntimeError) {
    return 'Runtime Error';
  }
  
  return 'Wrong Answer';
}

/**
 * Calculate performance metrics
 */
function calculateMetrics(executionResult) {
  const testResults = executionResult.testResults;
  const passedTests = testResults.filter(result => result.passed).length;
  const totalTests = testResults.length;
  
  const avgExecutionTime = totalTests > 0 
    ? Math.floor(testResults.reduce((sum, result) => sum + result.executionTime, 0) / totalTests)
    : 0;
    
  const avgMemoryUsed = totalTests > 0
    ? Math.floor(testResults.reduce((sum, result) => sum + result.memoryUsed, 0) / totalTests)
    : 0;
    
  const score = totalTests > 0 ? Math.floor((passedTests / totalTests) * 100) : 0;
  
  return {
    passedTests,
    totalTests,
    avgExecutionTime,
    avgMemoryUsed,
    score
  };
}

/**
 * Update submission status
 */
async function updateSubmissionStatus(submissionId, status, additionalData = {}) {
  try {
    await Submission.findByIdAndUpdate(submissionId, {
      status,
      ...additionalData,
      updatedAt: new Date()
    });
    
    console.log(`📊 Updated submission ${submissionId} status to: ${status}`);
  } catch (error) {
    console.error(`Failed to update submission ${submissionId}:`, error);
  }
}

/**
 * Update submission with final results
 */
async function updateSubmissionWithResults(submissionId, results) {
  try {
    await Submission.findByIdAndUpdate(submissionId, {
      ...results,
      updatedAt: new Date()
    });
    
    console.log(`📋 Updated submission ${submissionId} with final results`);
  } catch (error) {
    console.error(`Failed to update submission results ${submissionId}:`, error);
  }
}

/**
 * Update problem statistics
 */
async function updateProblemStats(problemId, status) {
  try {
    const update = { $inc: { totalSubmissions: 1 } };
    if (status === 'Accepted') {
      update.$inc.acceptedSubmissions = 1;
    }
    
    await Problem.findByIdAndUpdate(problemId, update);
    
    // Recalculate acceptance rate
    const problem = await Problem.findById(problemId);
    if (problem && problem.totalSubmissions > 0) {
      const acceptanceRate = Math.floor((problem.acceptedSubmissions / problem.totalSubmissions) * 100);
      await Problem.findByIdAndUpdate(problemId, { acceptanceRate });
    }
    
  } catch (error) {
    console.error(`Failed to update problem stats ${problemId}:`, error);
  }
}

/**
 * Update user statistics
 */
async function updateUserStats(userId, status) {
  try {
    const update = { $inc: { totalSubmissions: 1 } };
    if (status === 'Accepted') {
      update.$inc.acceptedSubmissions = 1;
    }
    
    await User.findByIdAndUpdate(userId, update);
    
  } catch (error) {
    console.error(`Failed to update user stats ${userId}:`, error);
  }
}

/**
 * Update job progress
 */
async function updateJobProgress(job, progress) {
  try {
    await job.progress(progress);
  } catch (error) {
    console.error('Failed to update job progress:', error);
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const waiting = await submissionQueue.getWaiting();
    const active = await submissionQueue.getActive();
    const completed = await submissionQueue.getCompleted();
    const failed = await submissionQueue.getFailed();
    
    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return { waiting: 0, active: 0, completed: 0, failed: 0, total: 0 };
  }
}

/**
 * Clean old completed/failed jobs
 */
async function cleanQueue() {
  try {
    await submissionQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 hours
    await submissionQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 days
    console.log('✨ Queue cleaned successfully');
  } catch (error) {
    console.error('Failed to clean queue:', error);
  }
}

// Event handlers
submissionQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

submissionQueue.on('failed', (job, err) => {
  console.log(`❌ Job ${job.id} failed:`, err.message);
});

submissionQueue.on('stalled', (job) => {
  console.log(`⏸️ Job ${job.id} stalled`);
});

// Clean queue every hour
setInterval(cleanQueue, 60 * 60 * 1000);

module.exports = {
  addSubmission,
  getQueueStats,
  cleanQueue,
  submissionQueue
};
