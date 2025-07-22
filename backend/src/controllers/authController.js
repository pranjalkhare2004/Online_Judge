/**
 * AUTHENTICATION CONTROLLER
 * 
 * Purpose: Handles all user authentication operations including registration, login,
 * logout, password reset, and token management. This controller implements secure
 * authentication flows with JWT tokens and password hashing.
 * 
 * Key Responsibilities:
 * - User registration with validation and password hashing
 * - Secure login with credential verification
 * - JWT token generation and validation
 * - Password reset functionality with email verification
 * - Account lockout protection against brute force attacks
 * - Refresh token management for extended sessions
 * 
 * Why this exists: Authentication is a critical security component that needs to be
 * implemented correctly to protect user accounts and system integrity. This controller
 * centralizes all authentication logic and follows security best practices.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

// Send Token Response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .cookie('refreshToken', refreshToken, { ...cookieOptions, expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .json({
      success: true,
      message,
      data: {
        user,
        token,
        refreshToken
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstname, lastname, email, password, confirmPassword } = req.body;

    // Validation
    if (!firstname || !lastname || !email || !password) {
      return next(new AppError('Please provide all required fields', 400));
    }

    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('User already exists with this email', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user'
    });

    logger.info(`New user registered: ${user.email}`);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email (implement later)
    // await sendVerificationEmail(user, verificationToken);

    sendTokenResponse(user, 201, res, 'User registered successfully! Please check your email for verification.');

  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new AppError(`User already exists with this ${field}`, 400));
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Registration failed', 500));
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Check for user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.isLocked) {
      return next(new AppError('Account temporarily locked due to too many failed login attempts', 423));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Account has been deactivated', 403));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return next(new AppError('Invalid credentials', 401));
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);

    sendTokenResponse(user, 200, res, 'Login successful');

  } catch (error) {
    logger.error('Login error:', error);
    next(new AppError('Login failed', 500));
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res
    .status(200)
    .cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })
    .cookie('refreshToken', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })
    .json({
      success: true,
      message: 'Logged out successfully'
    });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('solvedProblems.problemId', 'title difficulty points')
      .select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get me error:', error);
    next(new AppError('Failed to get user profile', 500));
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['firstname', 'lastname', 'bio', 'institution', 'country', 'programmingLanguages', 'skillLevel'];
    const updates = {};

    // Filter allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields provided for update', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Failed to update profile', 500));
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Please provide all required fields', 400));
    }

    if (newPassword !== confirmPassword) {
      return next(new AppError('New passwords do not match', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return next(new AppError('Current password is incorrect', 400));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    next(new AppError('Failed to change password', 500));
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide email address', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return next(new AppError('No user found with this email address', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    // Send reset email (implement later)
    // await sendPasswordResetEmail(user, resetToken);

    logger.info(`Password reset requested for: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    next(new AppError('Failed to process password reset request', 500));
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (!password || !confirmPassword) {
      return next(new AppError('Please provide password and confirmation', 400));
    }

    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // Get user by token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Password reset token is invalid or has expired', 400));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    logger.info(`Password reset completed for: ${user.email}`);

    sendTokenResponse(user, 200, res, 'Password reset successful');

  } catch (error) {
    logger.error('Reset password error:', error);
    next(new AppError('Failed to reset password', 500));
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || req.cookies;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 401));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return next(new AppError('User not found or inactive', 401));
    }

    sendTokenResponse(user, 200, res, 'Token refreshed successfully');

  } catch (error) {
    logger.error('Refresh token error:', error);
    next(new AppError('Invalid refresh token', 401));
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new AppError('Email verification token is invalid or has expired', 400));
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    logger.error('Email verification error:', error);
    next(new AppError('Failed to verify email', 500));
  }
};
