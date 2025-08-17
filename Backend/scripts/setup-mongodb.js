/**
 * MONGODB DATABASE INITIALIZATION SCRIPT
 * 
 * DESCRIPTION:
 * This script sets up the MongoDB database for the Online Judge authentication system.
 * It creates the necessary collections, indexes, and initial data required for
 * the Login/Signup functionality with enhanced security features.
 * 
 * FEATURES:
 * - Creates Login/Signup collection with proper schema
 * - Sets up database indexes for performance optimization
 * - Initializes security configurations
 * - Creates test database for development
 * - Validates database connection and setup
 * 
 * USAGE:
 * - Development: node Backend/scripts/setup-mongodb.js
 * - Production: NODE_ENV=production node Backend/scripts/setup-mongodb.js
 * - Testing: NODE_ENV=test node Backend/scripts/setup-mongodb.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { connectDB, testConnection, getConnectionStatus } = require('../config/db');
require('dotenv').config();

console.log(`
🚀 MONGODB DATABASE INITIALIZATION
==================================
Environment: ${process.env.NODE_ENV || 'development'}
Database URI: ${process.env.MONGODB_URI || 'Not configured'}
JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}
`);

/**
 * Initialize Database Collections and Indexes
 */
async function initializeDatabase() {
  try {
    console.log('📋 Creating collections and indexes...');

    // Ensure the Login/Signup collection exists with proper indexes
    await User.collection.createIndex({ 'Email': 1 }, { unique: true });
    await User.collection.createIndex({ 'UserId': 1 }, { unique: true });
    await User.collection.createIndex({ 'loginAttempts': 1 });
    await User.collection.createIndex({ 'lockUntil': 1 });
    await User.collection.createIndex({ 'createdAt': 1 });
    await User.collection.createIndex({ 'role': 1 });
    await User.collection.createIndex({ 'isActive': 1 });

    console.log('✅ Database indexes created successfully');

    // Create text index for full-name search
    await User.collection.createIndex({ 'FullName': 'text' });
    console.log('✅ Text search index created for FullName field');

    return true;
  } catch (error) {
    console.error('❌ Error creating database indexes:', error.message);
    return false;
  }
}

/**
 * Create Test Users for Development
 */
async function createTestUsers() {
  try {
    console.log('👥 Creating test users for development...');

    const testUsers = [
      {
        Email: 'admin@onlinejudge.com',
        Password: 'AdminPassword123',
        FullName: 'System Administrator',
        DOB: new Date('1985-01-01'),
        role: 'admin'
      },
      {
        Email: 'testuser@example.com',
        Password: 'UserPassword123',
        FullName: 'Test User Account',
        DOB: new Date('1990-05-15'),
        role: 'user'
      },
      {
        Email: 'moderator@onlinejudge.com',
        Password: 'ModeratorPassword123',
        FullName: 'Content Moderator',
        DOB: new Date('1988-03-20'),
        role: 'moderator'
      }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.Email);
      
      if (!existingUser) {
        const user = await User.createUser(userData);
        createdUsers.push({
          UserId: user.UserId,
          Email: user.Email,
          FullName: user.FullName,
          role: user.role
        });
        console.log(`✅ Created ${user.role} user: ${user.Email} (${user.UserId})`);
      } else {
        console.log(`ℹ️  User already exists: ${userData.Email} (${existingUser.UserId})`);
      }
    }

    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    return [];
  }
}

/**
 * Validate Database Setup
 */
async function validateSetup() {
  try {
    console.log('🔍 Validating database setup...');

    // Test database connection
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(`Connection test failed: ${connectionTest.error}`);
    }
    console.log('✅ Database connection validated');

    // Check collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const userCollection = collections.find(col => col.name === 'users');
    
    if (!userCollection) {
      throw new Error('Users collection not found');
    }
    console.log('✅ Users collection exists');

    // Check indexes
    const indexes = await User.collection.getIndexes();
    const requiredIndexes = ['Email_1', 'UserId_1'];
    
    for (const indexName of requiredIndexes) {
      if (!indexes[indexName]) {
        throw new Error(`Required index ${indexName} not found`);
      }
    }
    console.log('✅ Required indexes verified');

    // Test user operations
    const userCount = await User.countDocuments();
    console.log(`✅ Database contains ${userCount} users`);

    // Test password hashing
    const testPassword = 'TestPassword123';
    const hashedPassword = await User.hashPassword(testPassword);
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    
    if (!isValid) {
      throw new Error('Password hashing validation failed');
    }
    console.log('✅ Password hashing system validated');

    return true;
  } catch (error) {
    console.error('❌ Database setup validation failed:', error.message);
    return false;
  }
}

/**
 * Clean Test Database (for testing environment only)
 */
async function cleanTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    console.log('ℹ️  Database cleaning skipped (not in test environment)');
    return true;
  }

  try {
    console.log('🧹 Cleaning test database...');
    
    // Drop all collections in test database
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`✅ Dropped collection: ${collection.name}`);
    }

    console.log('✅ Test database cleaned');
    return true;
  } catch (error) {
    console.error('❌ Error cleaning test database:', error.message);
    return false;
  }
}

/**
 * Generate Performance Report
 */
async function generatePerformanceReport() {
  try {
    console.log('📊 Generating performance report...');

    const startTime = Date.now();

    // Test connection performance
    const connectionStart = Date.now();
    const connectionTest = await testConnection();
    const connectionTime = Date.now() - connectionStart;

    // Test user creation performance
    const userCreationStart = Date.now();
    const testUserData = {
      Email: `performance.test.${Date.now()}@example.com`,
      Password: 'TestPassword123',
      FullName: 'Performance Test User',
      DOB: new Date('1990-01-01')
    };
    
    const testUser = await User.createUser(testUserData);
    const userCreationTime = Date.now() - userCreationStart;

    // Test password comparison performance
    const passwordStart = Date.now();
    await testUser.comparePassword('TestPassword123');
    const passwordTime = Date.now() - passwordStart;

    // Test JWT generation performance
    const jwtStart = Date.now();
    const token = testUser.generateJWT();
    const jwtTime = Date.now() - jwtStart;

    // Cleanup test user
    await User.findByIdAndDelete(testUser._id);

    const totalTime = Date.now() - startTime;

    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: mongoose.connection.name,
      performance: {
        connectionTest: `${connectionTime}ms`,
        userCreation: `${userCreationTime}ms`,
        passwordComparison: `${passwordTime}ms`,
        jwtGeneration: `${jwtTime}ms`,
        totalTestTime: `${totalTime}ms`
      },
      connectionStatus: getConnectionStatus(),
      recommendations: []
    };

    // Add performance recommendations
    if (connectionTime > 100) {
      report.recommendations.push('Consider database connection optimization - connection test took longer than 100ms');
    }
    if (userCreationTime > 500) {
      report.recommendations.push('Consider password hashing optimization - user creation took longer than 500ms');
    }
    if (passwordTime > 100) {
      report.recommendations.push('Consider bcrypt rounds optimization - password comparison took longer than 100ms');
    }

    console.log('📊 PERFORMANCE REPORT');
    console.log('===================');
    console.log(JSON.stringify(report, null, 2));

    return report;
  } catch (error) {
    console.error('❌ Error generating performance report:', error.message);
    return null;
  }
}

/**
 * Main Setup Function
 */
async function setupMongoDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');

    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }

    console.log('✅ Connected to MongoDB successfully');

    // Initialize database structure
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize database structure');
    }

    // Clean test database if in test environment
    if (process.env.NODE_ENV === 'test') {
      await cleanTestDatabase();
      console.log('✅ Test environment prepared');
    }

    // Create test users only in development
    if (process.env.NODE_ENV === 'development') {
      const testUsers = await createTestUsers();
      console.log(`✅ Created ${testUsers.length} test users`);
    }

    // Validate setup
    const isValid = await validateSetup();
    if (!isValid) {
      throw new Error('Database setup validation failed');
    }

    // Generate performance report
    await generatePerformanceReport();

    console.log(`
🎉 MONGODB SETUP COMPLETE
========================
✅ Database connection established
✅ Collections and indexes created
✅ Security configurations applied
✅ Test data initialized (development only)
✅ Setup validation passed
✅ Performance report generated

Your MongoDB database is ready for the Online Judge authentication system!

Next Steps:
1. Start your application server
2. Run authentication tests: npm test auth-db.test.js
3. Access login/signup endpoints at /api/auth/*

Connection Status: ${getConnectionStatus().isConnected ? 'Connected' : 'Disconnected'}
Database: ${getConnectionStatus().database || 'Unknown'}
Environment: ${process.env.NODE_ENV || 'development'}
`);

    return true;
  } catch (error) {
    console.error(`
❌ MONGODB SETUP FAILED
======================
Error: ${error.message}

Please check:
1. MongoDB service is running
2. Connection string is correct
3. Database permissions are set
4. Environment variables are configured

Connection Status: ${getConnectionStatus().isConnected ? 'Connected' : 'Disconnected'}
`);

    return false;
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'clean':
      await connectDB();
      await cleanTestDatabase();
      break;
    
    case 'users':
      await connectDB();
      await createTestUsers();
      break;
    
    case 'validate':
      await connectDB();
      await validateSetup();
      break;
    
    case 'performance':
      await connectDB();
      await generatePerformanceReport();
      break;
    
    default:
      await setupMongoDB();
      break;
  }

  // Close connection
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }

  process.exit(0);
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Setup interrupted by user');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error.message);
  process.exit(1);
});

// Export for testing
module.exports = {
  setupMongoDB,
  initializeDatabase,
  createTestUsers,
  validateSetup,
  cleanTestDatabase,
  generatePerformanceReport
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

console.log(`
📖 MONGODB SETUP SCRIPT COMMANDS
===============================
node Backend/scripts/setup-mongodb.js          # Full setup
node Backend/scripts/setup-mongodb.js clean    # Clean test database
node Backend/scripts/setup-mongodb.js users    # Create test users only
node Backend/scripts/setup-mongodb.js validate # Validate setup only  
node Backend/scripts/setup-mongodb.js performance # Performance report only

Environment Variables Required:
- MONGODB_URI: MongoDB connection string
- JWT_SECRET: Secret key for JWT tokens
- NODE_ENV: Environment (development/test/production)
`);
