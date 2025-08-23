/**
 * CODE EXECUTION JOB QUEUE
 * 
 * Manages code execution jobs using BullMQ for scalability and reliability.
 * Provides non-blocking API responses and horizontal scaling capabilities.
 */

const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const { executeCodeSecure, isDockerAvailable } = require('./dockerCompilerFixed');

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
};

// Create Redis connection
let redis;
let isRedisAvailable = false;

try {
  redis = new IORedis(redisConfig);
  redis.on('connect', () => {
    console.log('✅ Redis connected for job queue');
    isRedisAvailable = true;
  });
  redis.on('error', (error) => {
    console.warn('⚠️ Redis connection error:', error.message);
    isRedisAvailable = false;
  });
} catch (error) {
  console.warn('⚠️ Redis not available, using synchronous execution');
}

// Create job queue
let codeExecutionQueue;
let queueEvents;

if (redis && isRedisAvailable) {
  codeExecutionQueue = new Queue('codeExecution', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 100, // Keep only 100 completed jobs
      removeOnFail: 50, // Keep only 50 failed jobs
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    }
  });

  queueEvents = new QueueEvents('codeExecution', { connection: redis });
}

// Job results storage (in production, use Redis or database)
const jobResults = new Map();

/**
 * Submit code execution job to queue
 */
async function submitExecutionJob(jobData) {
  const { code, language, testCases, userId, problemId } = jobData;
  
  // Generate unique job ID
  const jobId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (codeExecutionQueue && isRedisAvailable) {
    // Add job to queue
    const job = await codeExecutionQueue.add(
      'executeCode',
      {
        jobId,
        code,
        language,
        testCases,
        userId,
        problemId,
        timestamp: new Date().toISOString()
      },
      {
        jobId,
        delay: 0, // Execute immediately
        priority: 1 // Normal priority
      }
    );

    return {
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Code execution job queued successfully'
    };
  } else {
    // Fallback: Execute synchronously
    try {
      const result = await executeCodeDirectly(code, language, testCases);
      jobResults.set(jobId, {
        status: 'completed',
        result,
        completedAt: new Date().toISOString()
      });

      return {
        success: true,
        jobId,
        status: 'completed',
        result,
        message: 'Code executed successfully'
      };
    } catch (error) {
      jobResults.set(jobId, {
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      });

      return {
        success: false,
        jobId,
        status: 'failed',
        error: error.message,
        message: 'Code execution failed'
      };
    }
  }
}

/**
 * Get job status and results
 */
async function getJobResult(jobId) {
  if (codeExecutionQueue && isRedisAvailable) {
    try {
      const job = await codeExecutionQueue.getJob(jobId);
      
      if (!job) {
        return {
          success: false,
          status: 'not_found',
          message: 'Job not found'
        };
      }

      const state = await job.getState();
      
      switch (state) {
        case 'completed':
          return {
            success: true,
            status: 'completed',
            result: job.returnvalue,
            message: 'Job completed successfully'
          };
        
        case 'failed':
          return {
            success: false,
            status: 'failed',
            error: job.failedReason,
            message: 'Job failed'
          };
        
        case 'active':
          return {
            success: true,
            status: 'running',
            progress: job.progress || 0,
            message: 'Job is currently running'
          };
        
        case 'waiting':
        case 'delayed':
          return {
            success: true,
            status: 'queued',
            message: 'Job is queued for execution'
          };
        
        default:
          return {
            success: true,
            status: state,
            message: `Job is in ${state} state`
          };
      }
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        message: 'Failed to get job status'
      };
    }
  } else {
    // Check local results storage
    const result = jobResults.get(jobId);
    if (result) {
      return {
        success: result.status === 'completed',
        status: result.status,
        result: result.result,
        error: result.error,
        message: result.status === 'completed' ? 'Job completed' : 'Job failed'
      };
    } else {
      return {
        success: false,
        status: 'not_found',
        message: 'Job not found'
      };
    }
  }
}

/**
 * Execute code directly using Docker compiler only
 * This ensures consistent execution environment across all operations
 */
async function executeCodeDirectly(code, language, testCases) {
  console.log('🐳 Using Docker execution (unified compiler)');
  return await executeCodeSecure(code, language, testCases);
}

/**
 * Create worker to process execution jobs
 */
function createExecutionWorker() {
  if (!codeExecutionQueue || !isRedisAvailable) {
    console.log('⚠️ Queue not available, worker not created');
    return null;
  }

  const worker = new Worker(
    'codeExecution',
    async (job) => {
      const { jobId, code, language, testCases, userId } = job.data;
      
      console.log(`🔄 Processing job ${jobId} for user ${userId}`);
      
      try {
        // Update job progress
        await job.updateProgress(10);
        
        // Execute code
        const result = await executeCodeDirectly(code, language, testCases);
        
        // Update job progress
        await job.updateProgress(90);
        
        console.log(`✅ Job ${jobId} completed successfully`);
        
        // Return result
        return result;
      } catch (error) {
        console.error(`❌ Job ${jobId} failed:`, error);
        throw error;
      }
    },
    {
      connection: redis,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 2, // Process 2 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs per minute per worker
        duration: 60 * 1000
      }
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  return worker;
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  if (!codeExecutionQueue) {
    return {
      available: false,
      message: 'Queue not available'
    };
  }

  try {
    const waiting = await codeExecutionQueue.getWaiting();
    const active = await codeExecutionQueue.getActive();
    const completed = await codeExecutionQueue.getCompleted();
    const failed = await codeExecutionQueue.getFailed();

    return {
      available: true,
      stats: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      }
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Initialize the job queue system
 */
async function initializeQueue() {
  if (redis) {
    try {
      await redis.ping();
      console.log('✅ Job queue system initialized');
      return createExecutionWorker();
    } catch (error) {
      console.warn('⚠️ Failed to initialize job queue:', error.message);
      return null;
    }
  }
  return null;
}

module.exports = {
  submitExecutionJob,
  getJobResult,
  executeCodeDirectly,
  createExecutionWorker,
  getQueueStats,
  initializeQueue,
  isRedisAvailable: () => isRedisAvailable
};
