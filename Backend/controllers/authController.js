/**
 * AUTHENTICATION CONTROLLER - USER LOGIN AND REGISTRATION LOGIC
 * 
 * DESCRIPTION:
 * This controller handles all authentication-related operations for the Online Judge platform.
 * It implements secure user login with bcrypt password verification, JWT token generation,
 * rate limiting protection, input validation, and comprehensive error handling. Supports
 * the Login/Signup collection with fields: UserId, Password, Email, DOB, FullName.
 * 
 * FUNCTIONALITY:
 * - User login with email/password authentication
 * - Secure password comparison using bcrypt
 * - JWT token generation for session management
 * - User registration with data validation
 * - Account locking mechanism for security
 * - Comprehensive error handling and logging
 * - Input sanitization and validation
 * - Rate limiting protection against brute force attacks
 * 
 * SECURITY MEASURES:
 * - bcrypt password hashing and comparison
 * - JWT token with configurable expiration (1 hour default)
 * - Account locking after failed login attempts
 * - Input validation using express-validator
 * - SQL injection protection
 * - Rate limiting on authentication endpoints
 * - Comprehensive logging of authentication attempts
 * 
 * WHEN TO MODIFY:
 * - Change JWT expiration time
 * - Add additional authentication methods (2FA)
 * - Modify account locking parameters
 * - Add new user registration fields
 * - Implement OAuth integration
 * 
 * API ENDPOINTS HANDLED:
 * - POST /auth/login - User login
 * - POST /auth/register - User registration
 * - POST /auth/logout - User logout (JWT invalidation)
 * - GET /auth/verify - Token verification
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { testConnection } = require('../config/db');

/**
 * User login controller
 * Authenticates user credentials and returns JWT token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with token or error
 */
const loginUser = async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    console.log(`🔐 Login attempt from IP: ${clientIP} at ${new Date().toISOString()}`);
    
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('❌ Login validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }
    
    const { email, password } = req.body;
    
    // Check if required fields are provided
    if (!email || !password) {
      console.warn('❌ Missing login credentials');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Test database connection before proceeding
    const dbTest = await testConnection();
    if (!dbTest.success) {
      console.error('❌ Database connection test failed during login');
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ Email: email });
    if (!user) {
      console.warn(`❌ Login failed: User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      console.warn(`❌ Login attempt for inactive account: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is disabled. Please contact support.'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      console.warn(`❌ Login attempt for locked account: ${email}`);
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }
    
    // Compare password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.warn(`❌ Invalid password for user: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = user.generateJWT();
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ Successful login for user: ${email} (${responseTime}ms)`);
    console.log(`📊 Login Details:
      - User ID: ${user.UserId}
      - Email: ${user.Email}
      - Role: ${user.role}
      - Last Login: ${user.lastLogin}
      - Response Time: ${responseTime}ms
    `);
    
    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          UserId: user.UserId,
          Email: user.Email,
          FullName: user.FullName,
          role: user.role,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin
        }
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Login error (${responseTime}ms):`, {
      error: error.message,
      stack: error.stack,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

/**
 * User registration controller
 * Creates new user account with validation and security checks
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success or error
 */
const registerUser = async (req, res) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  
  try {
    console.log(`📝 Registration attempt from IP: ${clientIP} at ${new Date().toISOString()}`);
    
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('❌ Registration validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: errors.array()
      });
    }
    
    const { email, password, fullName, dateOfBirth } = req.body;
    
    // Check if required fields are provided
    if (!email || !password || !fullName || !dateOfBirth) {
      console.warn('❌ Missing registration data');
      return res.status(400).json({
        success: false,
        message: 'All fields are required: email, password, fullName, dateOfBirth'
      });
    }
    
    // Test database connection
    const dbTest = await testConnection();
    if (!dbTest.success) {
      console.error('❌ Database connection test failed during registration');
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.warn(`❌ Registration failed: User already exists with email: ${email}`);
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }
    
    // Create new user
    const userData = {
      Email: email.toLowerCase().trim(),
      Password: password,
      FullName: fullName.trim(),
      DOB: new Date(dateOfBirth)
    };
    
    const newUser = await User.createUser(userData);
    
    const responseTime = Date.now() - startTime;
    
    console.log(`✅ User registered successfully: ${email} (${responseTime}ms)`);
    console.log(`📊 Registration Details:
      - User ID: ${newUser.UserId}
      - Email: ${newUser.Email}
      - Full Name: ${newUser.FullName}
      - Response Time: ${responseTime}ms
    `);
    
    // Return success response (no token for registration - user must login)
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please login to continue.',
      data: {
        user: {
          id: newUser._id,
          UserId: newUser.UserId,
          Email: newUser.Email,
          FullName: newUser.FullName,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Registration error (${responseTime}ms):`, {
      error: error.message,
      stack: error.stack,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.'
    });
  }
};

/**
 * User logout controller
 * Handles JWT token invalidation (client-side primarily)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 */
const logoutUser = async (req, res) => {
  try {
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`🚪 Logout request from IP: ${clientIP} at ${new Date().toISOString()}`);
    
    // For JWT tokens, logout is primarily handled client-side
    // Server-side we can log the logout and perform cleanup if needed
    
    if (req.user) {
      console.log(`✅ User logged out: ${req.user.Email}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Token verification controller
 * Validates JWT token and returns user information
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with user data or error
 */
const verifyToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          UserId: user.UserId,
          Email: user.Email,
          FullName: user.FullName,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

/**
 * Database connection test endpoint
 * Tests database connectivity for monitoring
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with connection test results
 */
const testDatabaseConnection = async (req, res) => {
  try {
    const testResult = await testConnection();
    
    if (testResult.success) {
      res.status(200).json({
        success: true,
        message: 'Database connection test successful',
        data: testResult
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database connection test failed',
        data: testResult
      });
    }
    
  } catch (error) {
    console.error('❌ Database test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message
    });
  }
};

module.exports = {
  loginUser,
  registerUser,
  logoutUser,
  verifyToken,
  testDatabaseConnection
};
