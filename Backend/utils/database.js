const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');

/**
 * Database utilities for common operations and optimizations
 */
class DatabaseUtils {
  /**
   * Get database statistics and health information
   */
  static async getDatabaseStats() {
    try {
      const stats = await mongoose.connection.db.stats();
      
      const collections = {
        users: await User.countDocuments(),
        problems: await Problem.countDocuments(),
        testcases: await TestCase.countDocuments(),
        submissions: await Submission.countDocuments(),
        contests: await Contest.countDocuments()
      };
      
      const indexes = {
        users: await User.collection.getIndexes(),
        problems: await Problem.collection.getIndexes(),
        testcases: await TestCase.collection.getIndexes(),
        submissions: await Submission.collection.getIndexes(),
        contests: await Contest.collection.getIndexes()
      };
      
      return {
        database: {
          name: stats.db,
          collections: stats.collections,
          documents: stats.objects,
          avgObjSize: stats.avgObjSize,
          dataSize: stats.dataSize,
          storageSize: stats.storageSize,
          indexSize: stats.indexSize
        },
        collections,
        indexCount: {
          users: Object.keys(indexes.users).length,
          problems: Object.keys(indexes.problems).length,
          testcases: Object.keys(indexes.testcases).length,
          submissions: Object.keys(indexes.submissions).length,
          contests: Object.keys(indexes.contests).length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error.message}`);
    }
  }
  
  /**
   * Check database connection health
   */
  static async checkHealth() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      if (state === 1) {
        // Test with a simple query
        await User.findOne().limit(1).lean();
        return {
          status: 'healthy',
          state: states[state],
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name
        };
      }
      
      return {
        status: 'unhealthy',
        state: states[state],
        message: 'Database not connected'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        state: 'error',
        message: error.message
      };
    }
  }
  
  /**
   * Optimize query performance by adding hints for common patterns
   */
  static getOptimizedQuery(model, filter, options = {}) {
    let query = model.find(filter);
    
    // Add hints for common query patterns
    if (model.modelName === 'User') {
      if (filter.email && filter.username) {
        query = query.hint({ email: 1, username: 1 });
      } else if (filter.rating) {
        query = query.hint({ rating: -1 });
      }
    } else if (model.modelName === 'Problem') {
      if (filter.tags && filter.difficulty) {
        query = query.hint({ tags: 1, difficulty: 1, isActive: 1 });
      } else if (filter.slug) {
        query = query.hint({ slug: 1 });
      }
    } else if (model.modelName === 'Submission') {
      if (filter.userId && filter.problemId) {
        query = query.hint({ userId: 1, problemId: 1, submittedAt: -1 });
      } else if (filter.problemId && filter.status) {
        query = query.hint({ problemId: 1, status: 1, submittedAt: -1 });
      }
    }
    
    // Apply common options
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    if (options.sort) query = query.sort(options.sort);
    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);
    if (options.lean) query = query.lean();
    
    return query;
  }
  
  /**
   * Bulk operations helper
   */
  static async bulkWrite(model, operations, options = {}) {
    try {
      const result = await model.bulkWrite(operations, {
        ordered: false,
        ...options
      });
      
      return {
        success: true,
        insertedCount: result.insertedCount || 0,
        modifiedCount: result.modifiedCount || 0,
        deletedCount: result.deletedCount || 0,
        upsertedCount: result.upsertedCount || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clean up old records based on retention policy
   */
  static async cleanupOldRecords() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      
      // Clean up old pending submissions (older than 30 days)
      const oldPendingSubmissions = await Submission.deleteMany({
        status: 'Pending',
        submittedAt: { $lt: thirtyDaysAgo }
      });
      
      // Clean up very old failed submissions (older than 6 months)
      const oldFailedSubmissions = await Submission.deleteMany({
        status: { $in: ['Runtime Error', 'Compilation Error'] },
        submittedAt: { $lt: sixMonthsAgo }
      });
      
      // Clean up inactive users who never verified (older than 6 months)
      const inactiveUnverifiedUsers = await User.deleteMany({
        isVerified: false,
        isActive: false,
        createdAt: { $lt: sixMonthsAgo },
        'solvedProblems.0': { $exists: false } // No solved problems
      });
      
      return {
        oldPendingSubmissions: oldPendingSubmissions.deletedCount || 0,
        oldFailedSubmissions: oldFailedSubmissions.deletedCount || 0,
        inactiveUnverifiedUsers: inactiveUnverifiedUsers.deletedCount || 0
      };
    } catch (error) {
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }
}

module.exports = DatabaseUtils;
