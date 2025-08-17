const mongoose = require('mongoose');
const User = require('../models/User');
const Problem = require('../models/Problem');
const Contest = require('../models/Contest');
const Submission = require('../models/Submission');
const TestCase = require('../models/TestCase');
const CacheManager = require('../utils/cache');
require('dotenv').config();

/**
 * Comprehensive Database Health Check and Validation
 * Tests all database connections, models, and basic CRUD operations
 */

class DatabaseHealthChecker {
  constructor() {
    this.results = {
      mongodb: { status: 'pending', details: {} },
      redis: { status: 'pending', details: {} },
      models: { status: 'pending', details: {} },
      operations: { status: 'pending', details: {} }
    };
  }

  /**
   * Test MongoDB connection and basic operations
   */
  async testMongoDB() {
    try {
      console.log('🔍 Testing MongoDB connection...');
      
      // Test connection state
      const state = mongoose.connection.readyState;
      const stateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      
      this.results.mongodb.details.connectionState = stateMap[state] || 'unknown';
      
      if (state !== 1) {
        throw new Error(`MongoDB not connected. Current state: ${stateMap[state]}`);
      }

      // Test database info
      const db = mongoose.connection.db;
      const admin = db.admin();
      const dbStats = await db.stats();
      
      this.results.mongodb.details = {
        ...this.results.mongodb.details,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      };

      // Test basic query
      const collections = await db.listCollections().toArray();
      this.results.mongodb.details.availableCollections = collections.map(c => c.name);

      this.results.mongodb.status = 'healthy';
      console.log('✅ MongoDB connection test passed');
      
    } catch (error) {
      this.results.mongodb.status = 'failed';
      this.results.mongodb.error = error.message;
      console.error('❌ MongoDB connection test failed:', error.message);
    }
  }

  /**
   * Test Redis connection and basic operations
   */
  async testRedis() {
    try {
      console.log('🔍 Testing Redis connection...');
      
      await CacheManager.connect();
      
      // Test basic operations
      const testKey = 'health_check_test';
      const testData = { timestamp: new Date().toISOString() };
      
      const cacheResult = await CacheManager.cacheData(testKey, testData, 10);
      if (!cacheResult) {
        throw new Error('Failed to cache test data');
      }
      
      const retrievedData = await CacheManager.getCachedData(testKey);
      if (!retrievedData || retrievedData.timestamp !== testData.timestamp) {
        throw new Error('Failed to retrieve cached data or data mismatch');
      }
      
      // Clean up test data
      await CacheManager.invalidateCache(testKey);
      
      this.results.redis.status = 'healthy';
      this.results.redis.details = {
        connected: true,
        testPassed: true
      };
      console.log('✅ Redis connection test passed');
      
    } catch (error) {
      this.results.redis.status = 'failed';
      this.results.redis.error = error.message;
      this.results.redis.details = { connected: false };
      console.error('❌ Redis connection test failed:', error.message);
    }
  }

  /**
   * Test all Mongoose models
   */
  async testModels() {
    try {
      console.log('🔍 Testing Mongoose models...');
      
      const models = { User, Problem, Contest, Submission, TestCase };
      const modelResults = {};
      
      for (const [name, Model] of Object.entries(models)) {
        try {
          // Test model compilation and schema
          const schema = Model.schema;
          const paths = Object.keys(schema.paths);
          
          // Test basic model operations
          await Model.countDocuments({});
          
          modelResults[name] = {
            status: 'healthy',
            schemaFields: paths.length,
            collection: Model.collection.name
          };
          
        } catch (error) {
          modelResults[name] = {
            status: 'failed',
            error: error.message
          };
        }
      }
      
      this.results.models.status = Object.values(modelResults).every(r => r.status === 'healthy') ? 'healthy' : 'partial';
      this.results.models.details = modelResults;
      console.log('✅ Model tests completed');
      
    } catch (error) {
      this.results.models.status = 'failed';
      this.results.models.error = error.message;
      console.error('❌ Model tests failed:', error.message);
    }
  }

  /**
   * Test basic CRUD operations
   */
  async testOperations() {
    try {
      console.log('🔍 Testing database operations...');
      
      const operations = {};
      
      // Test User operations
      try {
        const testUser = {
          name: 'Test User',
          email: `test_${Date.now()}@example.com`,
          password: 'testpassword123'
        };
        
        const user = new User(testUser);
        await user.save();
        
        const foundUser = await User.findById(user._id);
        if (!foundUser) {
          throw new Error('User not found after creation');
        }
        
        await User.findByIdAndDelete(user._id);
        
        operations.User = { status: 'healthy', tested: ['create', 'read', 'delete'] };
        
      } catch (error) {
        operations.User = { status: 'failed', error: error.message };
      }
      
      // Test Problem operations
      try {
        const testProblem = {
          title: 'Test Problem',
          slug: `test-problem-${Date.now()}`,
          difficulty: 'Easy',
          description: 'Test problem description'
        };
        
        const problem = new Problem(testProblem);
        await problem.save();
        
        const foundProblem = await Problem.findById(problem._id);
        if (!foundProblem) {
          throw new Error('Problem not found after creation');
        }
        
        await Problem.findByIdAndDelete(problem._id);
        
        operations.Problem = { status: 'healthy', tested: ['create', 'read', 'delete'] };
        
      } catch (error) {
        operations.Problem = { status: 'failed', error: error.message };
      }
      
      this.results.operations.status = Object.values(operations).every(op => op.status === 'healthy') ? 'healthy' : 'partial';
      this.results.operations.details = operations;
      console.log('✅ Operation tests completed');
      
    } catch (error) {
      this.results.operations.status = 'failed';
      this.results.operations.error = error.message;
      console.error('❌ Operation tests failed:', error.message);
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks() {
    console.log('🏥 Starting comprehensive database health check...\n');
    
    await this.testMongoDB();
    await this.testRedis();
    await this.testModels();
    await this.testOperations();
    
    // Generate summary
    const overallStatus = Object.values(this.results).every(r => r.status === 'healthy') ? 'HEALTHY' :
                         Object.values(this.results).some(r => r.status === 'healthy') ? 'PARTIAL' : 'FAILED';
    
    console.log('\n📊 Health Check Summary:');
    console.log('========================');
    console.log(`Overall Status: ${overallStatus}`);
    console.log(`MongoDB: ${this.results.mongodb.status.toUpperCase()}`);
    console.log(`Redis: ${this.results.redis.status.toUpperCase()}`);
    console.log(`Models: ${this.results.models.status.toUpperCase()}`);
    console.log(`Operations: ${this.results.operations.status.toUpperCase()}`);
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      ...this.results
    };
  }
}

module.exports = DatabaseHealthChecker;

// CLI execution
if (require.main === module) {
  const connectDB = require('../config/db');
  
  async function run() {
    try {
      await connectDB();
      
      const checker = new DatabaseHealthChecker();
      const results = await checker.runAllChecks();
      
      console.log('\n📋 Detailed Results:');
      console.log(JSON.stringify(results, null, 2));
      
      process.exit(results.status === 'HEALTHY' ? 0 : 1);
    } catch (error) {
      console.error('❌ Health check script failed:', error);
      process.exit(1);
    }
  }
  
  run();
}
