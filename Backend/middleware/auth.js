/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * DESCRIPTION:
 * This file provides JWT-based authentication middleware for protecting API routes.
 * It verifies JWT tokens, validates user existence, enforces role-based access control,
 * handles token expiration, and provides comprehensive authentication security.
 * Essential for securing protected API endpoints.
 * 
 * FUNCTIONS USED:
 * - authenticateToken(): Main JWT authentication middleware
 * - requireAdmin(): Admin role authorization middleware
 * - requireRole(): Generic role-based authorization middleware
 * - optionalAuth(): Optional authentication for public routes
 * - jwt.verify(): JWT token verification
 * - User.findById(): Database user lookup
 * - User.select(): User field selection (excludes password)
 * 
 * EXPORTS:
 * - authenticateToken: JWT token verification middleware
 * - requireAdmin: Admin role requirement middleware
 * - requireRole: Role-based access control middleware
 * - optionalAuth: Optional authentication middleware
 * 
 * USED BY:
 * - routes/admin.js: Admin route protection
 * - routes/auth.js: Protected authentication routes
 * - routes/user.js: User profile and settings routes
 * - routes/problems.js: Problem submission routes
 * - routes/contests.js: Contest participation routes
 * - routes/submissions.js: Submission viewing routes
 * 
 * DEPENDENCIES:
 * - models/User.js: User model for database operations
 * 
 * MIDDLEWARE FUNCTIONS:
 * - authenticateToken: Verifies JWT and loads user
 * - requireAdmin: Ensures user has admin role
 * - requireRole: Checks for specific user roles
 * - optionalAuth: Provides user context when available
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required for authentication'
      });
    }

    // Verify token with additional checks
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'online-judge-backend',
      audience: 'online-judge-frontend'
    });
    
    // Get user from token and verify user still exists
    const user = await User.findById(decoded.id).select('-Password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request object for use in protected routes
    req.user = user;
    next();
  } catch (error) {
    if (process.env.DEBUG_AUTH === 'true') {
      console.error('Auth middleware error:', error);
    }
    
    // Handle different JWT error types
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active yet'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional Authentication Middleware
 * For routes that benefit from user context but don't require authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'online-judge-backend',
        audience: 'online-judge-frontend'
      });
      
      const user = await User.findById(decoded.id).select('-Password');
      
      // Only attach user if found and active
      if (user && user.isActive) {
        req.user = user;
      }
    }

    // Always continue to next middleware
    next();
  } catch (error) {
    // For optional auth, we don't send error responses
    // Just continue without authentication
    next();
  }
};

/**
 * Admin Authorization Middleware
 * Requires user to be authenticated and have admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const requireAdmin = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * Generate JWT Token
 * Creates a signed JWT token for user authentication
 * @param {String} userId - User ID to encode in token
 * @returns {String} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { 
      id: userId,
      iat: Math.floor(Date.now() / 1000) // Issued at time
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '7d',
      issuer: 'online-judge-backend',
      audience: 'online-judge-frontend',
      algorithm: 'HS256'
    }
  );
};

/**
 * Verify and decode token without throwing errors
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'online-judge-backend',
      audience: 'online-judge-frontend'
    });
  } catch (error) {
    if (process.env.DEBUG_AUTH === 'true') {
      console.error('Token verification failed:', error.message);
    }
    return null;
  }
};

/**
 * Refresh Token Middleware
 * Checks if token is close to expiration and provides refresh info
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const checkTokenRefresh = (req, res, next) => {
  if (req.user && req.headers['authorization']) {
    const token = req.headers['authorization'].split(' ')[1];
    const decoded = verifyToken(token);
    
    if (decoded) {
      const now = Math.floor(Date.now() / 1000);
      const timeToExpiry = decoded.exp - now;
      
      // If token expires in less than 1 day, suggest refresh
      if (timeToExpiry < 24 * 60 * 60) {
        res.setHeader('X-Token-Refresh-Suggested', 'true');
        res.setHeader('X-Token-Expires-In', timeToExpiry.toString());
      }
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  generateToken,
  verifyToken,
  checkTokenRefresh
};
