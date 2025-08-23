/**
 * DATABASE CONNECTION CONFIGURATION
 * 
 * DESCRIPTION:
 * This file handles MongoDB database connection setup for the Online Judge application.
 * It provides secure connection to MongoDB Atlas with SSL/TLS support, authentication,
 * connection pooling, and error handling. Supports both authenticated and non-authenticated
 * connections based on environment variables.
 * 
 * FUNCTIONS USED:
 * - connectDB(): Main function to establish MongoDB connection
 * - mongoose.connect(): Creates connection to MongoDB
 * - mongoose.connection.on(): Event handlers for connection states
 * - mongoose.connection.once(): One-time event handlers
 * - console.log(): Logging connection status
 * - console.error(): Error logging
 * - process.exit(): Application termination on connection failure
 * 
 * EXPORTS:
 * - connectDB: Async function that establishes database connection
 * 
 * USED BY:
 * - server.js: Main server initialization
 * - tests/setup.js: Test environment database setup
 * - scripts/db-health-check.js: Database connectivity verification
 * - seedAdmin.js: Database seeding scripts
 * - seedDatabase.js: Database population scripts
 * 
 * ENVIRONMENT VARIABLES USED:
 * - MONGODB_URI: MongoDB connection string
 * - MONGODB_USER: Database username (optional)
 * - MONGODB_PASS: Database password (optional)
 * - MONGODB_AUTH_SOURCE: Authentication database (default: admin)
 * - NODE_ENV: Environment type (affects connection options)
 */

const mongoose = require('mongoose');

// Connection state tracking
let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 5000; // 5 seconds

/**
 * Connect to MongoDB database with authentication support
 * Supports both authenticated and non-authenticated connections
 * Implements singleton pattern to prevent multiple connections
 * @returns {Promise<boolean>} Connection success status
 */
const connectDB = async () => {
  // Return existing connection if already established
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('🔄 Using existing MongoDB connection');
    return true;
  }
  try {
    // Build connection options for MongoDB Atlas
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true, // Retry writes on failure
      w: 'majority', // Write concern
    };

    // Add authentication options if credentials are provided
    if (process.env.MONGODB_USER && process.env.MONGODB_PASS) {
      options.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
      console.log('📚 Connecting to MongoDB with authentication...');
    } else {
      console.log('📚 Connecting to MongoDB Atlas...');
    }

    // Connect to MongoDB
    console.log('🔒 Establishing MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`📊 Connection Details:
      - Database: ${mongoose.connection.name}
      - Host: ${mongoose.connection.host}
      - Port: ${mongoose.connection.port}
      - Ready State: ${mongoose.connection.readyState}
    `);
    
    isConnected = true;
    connectionAttempts = 0;
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('🔗 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    process.on('SIGTERM', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed through SIGTERM');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    return true;

  } catch (error) {
    connectionAttempts++;
    isConnected = false;
    
    console.error(`❌ MongoDB connection failed (Attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS}):`, error.message);
    
    // Log additional details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Connection details:', {
        uri: process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
        user: process.env.MONGODB_USER ? '***' : 'none',
        authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
        error: error.message,
      });
    }

    // Retry connection with exponential backoff
    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_DELAY * Math.pow(2, connectionAttempts - 1);
      console.log(`🔄 Retrying connection in ${delay / 1000} seconds...`);
      
      setTimeout(async () => {
        await connectDB();
      }, delay);
    } else {
      console.error('🚫 Maximum connection attempts reached. Please check your MongoDB configuration.');
      process.exit(1);
    }

    return false;
  }
};

/**
 * Tests database connectivity by performing a ping operation
 * Used for health checks and monitoring
 * 
 * @returns {Promise<Object>} Test result with success status and timing
 */
const testConnection = async () => {
  const startTime = Date.now();
  
  try {
    // Ensure we have an active connection
    if (!isConnected || mongoose.connection.readyState !== 1) {
      throw new Error('No active database connection');
    }

    // Perform database ping test
    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();
    
    const responseTime = Date.now() - startTime;
    
    const testResult = {
      success: true,
      message: 'Database connection test successful',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      connectionState: mongoose.connection.readyState,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };

    console.log('✅ Database connection test passed:', testResult);
    return testResult;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    const testResult = {
      success: false,
      message: 'Database connection test failed',
      error: error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      connectionState: mongoose.connection.readyState,
    };

    console.error('❌ Database connection test failed:', testResult);
    return testResult;
  }
};

/**
 * Gracefully closes the database connection
 * Used during application shutdown
 */
const closeConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      isConnected = false;
      console.log('🔐 MongoDB connection closed gracefully');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
};

/**
 * Gets current connection status information
 * 
 * @returns {Object} Connection status details
 */
const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    database: mongoose.connection.name || 'Not connected',
    host: mongoose.connection.host || 'Not connected',
    port: mongoose.connection.port || 'Not connected',
    connectionAttempts,
    states: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }
  };
};

module.exports = {
  connectDB,
  testConnection,
  closeConnection,
  getConnectionStatus,
};
