/**
 * ONLINE JUDGE BACKEND - MAIN SERVER FILE
 * 
 * DESCRIPTION:
 * This is the main entry point for the Online Judge Backend application.
 * It initializes and configures the Express.js server with all necessary middleware,
 * database connections, authentication, routes, and error handling.
 * 
 * FUNCTIONS USED:
 * - express(): Creates Express application instance
 * - connectDB(): Establishes MongoDB connection
 * - setupMiddleware(): Configures middleware stack
 * - winston.createLogger(): Sets up application logging
 * - fs.existsSync(): Checks for logs directory existence
 * - fs.mkdirSync(): Creates logs directory if not exists
 * - app.listen(): Starts the HTTP server
 * 
 * EXPORTS:
 * - app: Express application instance (used by tests and deployment scripts)
 * 
 * USED BY:
 * - package.json (npm start script)
 * - Dockerfile (container deployment)
 * - tests/setup.js (test environment initialization)
 * - PM2 or similar process managers (production deployment)
 * 
 * DEPENDENCIES:
 * - config/db.js: Database connection configuration
 * - config/middleware.js: Middleware setup
 * - config/passport.js: Authentication strategies
 * - routes/index.js: API routes configuration
 */

const express = require('express');
const passport = require('passport');
const winston = require('winston');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import configurations
require('./config/passport');
const setupMiddleware = require('./config/middleware');
const { connectDB } = require('./config/db');
const routes = require('./routes');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'online-judge-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Initialize Express app
const app = express();

// Setup middleware
setupMiddleware(app);

// Initialize Passport
app.use(passport.initialize());

// Setup routes (moved outside async function for testing)
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Get basic system info
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'OK',
      message: 'Online Judge Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      system: {
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry detected'
    });
  }

  // Default error response
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      auth: '/api/auth',
      user: '/api/user',
      problems: '/api/problems',
      contests: '/api/contests',
      leaderboard: '/api/leaderboard',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

async function startServer() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check available at: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT. Graceful shutdown...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM. Graceful shutdown...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed.');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export app for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
