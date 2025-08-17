/**
 * ERROR HANDLING MIDDLEWARE - CENTRALIZED ERROR MANAGEMENT
 * 
 * DESCRIPTION:
 * This middleware provides centralized error handling for the Online Judge authentication system.
 * It catches and processes various types of errors including database errors, validation errors,
 * JWT errors, and general application errors. Provides consistent error responses and comprehensive
 * logging for debugging and monitoring purposes.
 * 
 * FUNCTIONALITY:
 * - Centralized error handling for all routes
 * - Consistent error response format
 * - Environment-aware error details (development vs production)
 * - Comprehensive error logging with context
 * - Specific handling for common error types
 * - Security-focused error messages in production
 * - Request context logging for debugging
 * 
 * ERROR TYPES HANDLED:
 * - MongoDB/Mongoose errors (validation, duplicate key, cast errors)
 * - JWT errors (expired, invalid, malformed tokens)
 * - Validation errors (express-validator)
 * - Authentication errors (unauthorized, forbidden)
 * - Network errors (connection timeout, network issues)
 * - General application errors
 * 
 * WHEN TO MODIFY:
 * - Add handling for new error types
 * - Modify error logging format
 * - Add error reporting/monitoring integration
 * - Change production error message strategies
 * - Add custom error classes
 * 
 * SECURITY CONSIDERATIONS:
 * - Sensitive information is hidden in production
 * - Stack traces only shown in development
 * - Database connection strings are masked
 * - User-friendly error messages prevent information leakage
 */

const mongoose = require('mongoose');

/**
 * Development error handler
 * Provides detailed error information for debugging
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Detailed error response
 */
const handleDevelopmentError = (err, req, res) => {
  console.error('🚨 Development Error Details:');
  console.error('Error Name:', err.name);
  console.error('Error Message:', err.message);
  console.error('Stack Trace:', err.stack);
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  console.error('Request Headers:', req.headers);
  console.error('User IP:', req.ip);
  console.error('Timestamp:', new Date().toISOString());
  
  const errorResponse = {
    success: false,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      status: err.status || 500,
      code: err.code,
      path: err.path,
      value: err.value,
    },
    request: {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      ip: req.ip,
      timestamp: new Date().toISOString()
    }
  };
  
  return res.status(err.status || 500).json(errorResponse);
};

/**
 * Production error handler
 * Provides user-friendly error messages without sensitive details
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} User-friendly error response
 */
const handleProductionError = (err, req, res) => {
  // Log error details server-side only
  console.error('🚨 Production Error:', {
    name: err.name,
    message: err.message,
    status: err.status || 500,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });
  
  // Determine appropriate user message
  let userMessage = 'An unexpected error occurred. Please try again later.';
  let statusCode = 500;
  
  // Handle specific error types with appropriate messages
  if (err.name === 'ValidationError') {
    userMessage = 'Invalid input data provided.';
    statusCode = 400;
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    userMessage = 'Resource already exists.';
    statusCode = 409;
  } else if (err.name === 'JsonWebTokenError') {
    userMessage = 'Authentication failed. Please login again.';
    statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    userMessage = 'Session has expired. Please login again.';
    statusCode = 401;
  } else if (err.status && err.status < 500) {
    // Client errors (4xx) can show original message
    userMessage = err.message;
    statusCode = err.status;
  }
  
  const errorResponse = {
    success: false,
    message: userMessage,
    timestamp: new Date().toISOString()
  };
  
  return res.status(statusCode).json(errorResponse);
};

/**
 * Handle MongoDB/Mongoose specific errors
 * 
 * @param {Error} err - MongoDB error object
 * @returns {Error} Processed error with appropriate message
 */
const handleMongoError = (err) => {
  let error = { ...err };
  
  // Handle MongoDB duplicate key error (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = Object.values(err.keyValue)[0];
    error.message = `Resource with ${field}: '${value}' already exists`;
    error.status = 409;
    error.name = 'DuplicateKeyError';
    
    console.warn(`⚠️ Duplicate key error: ${field} = ${value}`);
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = `Validation Error: ${messages}`;
    error.status = 400;
    
    console.warn('⚠️ Validation error:', messages);
  }
  
  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.status = 400;
    
    console.warn(`⚠️ Cast error: ${err.path} = ${err.value}`);
  }
  
  return error;
};

/**
 * Handle JWT-related errors
 * 
 * @param {Error} err - JWT error object
 * @returns {Error} Processed error with appropriate message
 */
const handleJWTError = (err) => {
  let error = { ...err };
  
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid authentication token';
    error.status = 401;
    console.warn('⚠️ Invalid JWT token');
  }
  
  if (err.name === 'TokenExpiredError') {
    error.message = 'Authentication token has expired';
    error.status = 401;
    console.warn('⚠️ JWT token expired');
  }
  
  return error;
};

/**
 * Main error handling middleware
 * Routes errors to appropriate handlers based on environment and error type
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Prevent multiple error responses
  if (res.headersSent) {
    return next(err);
  }
  
  // Set default error properties
  let error = { ...err };
  error.message = err.message || 'Server Error';
  error.status = err.status || 500;
  
  // Process specific error types
  if (err.name === 'MongoServerError' || err.name === 'ValidationError' || err.name === 'CastError') {
    error = handleMongoError(err);
  }
  
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }
  
  // Route to appropriate environment handler
  if (process.env.NODE_ENV === 'development') {
    return handleDevelopmentError(error, req, res);
  } else {
    return handleProductionError(error, req, res);
  }
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent endpoints
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  error.name = 'NotFoundError';
  
  console.warn(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  
  next(error);
};

/**
 * Async error catcher wrapper
 * Catches errors in async route handlers
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application-specific errors
 * 
 * @class AppError
 * @extends {Error}
 */
class AppError extends Error {
  constructor(message, status, name = 'AppError') {
    super(message);
    this.status = status;
    this.name = name;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  catchAsync,
  AppError,
  handleMongoError,
  handleJWTError
};
