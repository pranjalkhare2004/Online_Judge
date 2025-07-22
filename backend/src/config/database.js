/**
 * DATABASE CONNECTION MANAGER
 * 
 * Purpose: Handles MongoDB database connection using Mongoose ODM. This module
 * provides a reliable connection system with proper error handling and connection
 * state management.
 * 
 * Key Responsibilities:
 * - Establish connection to MongoDB database
 * - Handle connection errors and reconnection logic
 * - Monitor connection state and log events
 * - Prevent multiple connection attempts
 * - Graceful shutdown handling
 * 
 * Why this exists: Database connections need careful management to handle network
 * issues, provide connection pooling, and ensure the application can recover from
 * database disconnections. This module encapsulates all database connection logic.
 */

const mongoose = require('mongoose');
const config = require('./config');
const logger = require('../utils/logger');

let isConnected = false;

const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Database already connected');
    return;
  }

  try {
    await mongoose.connect(config.database.uri, config.database.options);
    isConnected = true;
    logger.info('✅ Database connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('Database connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Database reconnected');
      isConnected = true;
    });

  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  isConnected: () => isConnected
};
