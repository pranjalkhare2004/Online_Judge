/**
 * USER MODEL SCHEMA - LOGIN/SIGNUP COLLECTION
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for the Login/Signup collection in the Online Judge system.
 * It handles user authentication data with fields: UserId, Password, Email, DOB, FullName.
 * Includes secure password hashing with bcrypt, email validation, and authentication methods.
 * Implements JWT token generation and password comparison for secure login functionality.
 * 
 * FUNCTIONALITY:
 * - Secure password hashing using bcrypt with salt rounds
 * - Email validation and uniqueness constraints
 * - JWT token generation for authentication
 * - Password comparison methods for login verification
 * - User creation and validation
 * - Date of birth handling and validation
 * - Role-based access control (user/admin)
 * - Pre-save middleware for password hashing
 * 
 * WHEN TO MODIFY:
 * - Add new user fields (e.g., phone number, profile picture)
 * - Modify password complexity requirements
 * - Update JWT token expiration settings
 * - Add additional validation rules
 * - Implement user activity tracking
 * 
 * SECURITY FEATURES:
 * - bcrypt password hashing with configurable salt rounds
 * - Password field excluded from JSON serialization
 * - Input validation and sanitization
 * - Unique email constraint
 * - Secure password comparison methods
 * 
 * SCHEMA FIELDS (MATCHING LOGIN/SIGNUP COLLECTION):
 * - UserId: Unique user identifier (auto-generated)
 * - Password: Hashed password using bcrypt
 * - Email: User's email address (unique, validated)
 * - DOB: Date of birth (Date object)
 * - FullName: User's complete name
 * - role: User role (user/admin) - additional field for authorization
 * - isActive: Account status - additional field for user management
 * - createdAt/updatedAt: Automatic timestamps
 * 
 * INSTANCE METHODS:
 * - comparePassword(): Password verification against hashed password
 * - generateJWT(): Generate JWT token for authentication
 * - toJSON(): Safe JSON serialization (excludes password)
 * 
 * STATIC METHODS:
 * - findByEmail(): Find user by email address
 * - hashPassword(): Static method to hash passwords
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login/Signup Collection Schema (matching specified fields)
const UserSchema = new mongoose.Schema({
  // UserId - MongoDB will auto-generate _id, but we can add a custom UserId
  UserId: {
    type: String,
    unique: true,
    default: function() {
      return 'USR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // Password - Hashed using bcrypt
  Password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    // Will be hashed before saving
  },
  
  // Email - Unique and validated
  Email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  
  // DOB - Date of Birth
  DOB: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(date) {
        // User must be at least 13 years old
        const thirteenYearsAgo = new Date();
        thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
        return date <= thirteenYearsAgo;
      },
      message: 'User must be at least 13 years old'
    }
  },
  
  // FullName - User's complete name
  FullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  
  // Additional fields for system functionality
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Optional fields for enhanced functionality
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  
  // OAuth provider IDs for future expansion
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // User statistics and tracking (optional for basic login/signup)
  rating: {
    type: Number,
    default: 1200,
    min: 0,
    max: 4000
  },
  
  solvedProblems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard']
    }
  }],
  
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }],
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Login attempts tracking for security
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date
  }
  
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  collection: 'Login' // Use 'Login' collection name as specified
});

// Index for faster email lookups
UserSchema.index({ Email: 1 });
UserSchema.index({ UserId: 1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('Password')) return next();
  
  try {
    // Generate salt with cost factor of 12 (recommended for 2024)
    const salt = await bcrypt.genSalt(12);
    
    // Hash password with salt
    this.Password = await bcrypt.hash(this.Password, salt);
    
    console.log('🔐 Password hashed successfully for user:', this.Email);
    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    next(error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // If account is locked, don't allow login
    if (this.isLocked) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
    
    const isMatch = await bcrypt.compare(candidatePassword, this.Password);
    
    // If password matches, reset login attempts
    if (isMatch) {
      if (this.loginAttempts > 0) {
        await this.updateOne({
          $unset: { loginAttempts: 1, lockUntil: 1 }
        });
      }
      return true;
    }
    
    // If password doesn't match, increment login attempts
    await this.incLoginAttempts();
    return false;
    
  } catch (error) {
    console.error('❌ Error comparing password:', error);
    throw error;
  }
};

// Instance method to increment login attempts and lock account if necessary
UserSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have reached max attempts and haven't locked the account yet, lock it
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
    console.warn(`🔒 Account locked for user: ${this.Email} due to too many failed attempts`);
  }
  
  return await this.updateOne(updates);
};

// Instance method to generate JWT token
UserSchema.methods.generateJWT = function() {
  const payload = {
    id: this._id, // Use 'id' field as expected by middleware
    userId: this._id,
    UserId: this.UserId,
    Email: this.Email,
    FullName: this.FullName,
    role: this.role,
    iat: Date.now()
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    { 
      expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '15m', // Check both possible env vars
      issuer: 'online-judge-backend',
      audience: 'online-judge-frontend'
    }
  );
};

// Instance method to generate token pair (access + refresh)
UserSchema.methods.generateTokenPair = async function(deviceInfo = {}) {
  const RefreshToken = require('./RefreshToken');
  
  // Generate access token (short-lived)
  const accessToken = this.generateJWT();
  
  // Generate refresh token (long-lived)
  const { token: refreshTokenValue, model: refreshTokenModel } = RefreshToken.generateToken(this._id, deviceInfo);
  
  // Save refresh token to database
  await refreshTokenModel.save();
  
  return {
    accessToken,
    refreshToken: refreshTokenValue,
    accessTokenExpiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: '30d'
  };
};

// Instance method for safe JSON serialization (excludes sensitive fields)
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.Password;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  delete userObject.__v;
  
  return userObject;
};

// Static method to find user by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ Email: email.toLowerCase() });
};

// Static method to hash password (useful for user creation)
UserSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Static method to create user with hashed password
UserSchema.statics.createUser = async function(userData) {
  try {
    // Validate required fields
    if (!userData.Email || !userData.Password || !userData.FullName || !userData.DOB) {
      throw new Error('Missing required fields: Email, Password, FullName, DOB');
    }
    
    // Create new user instance
    const user = new this(userData);
    
    // Save user (password will be automatically hashed by pre-save middleware)
    await user.save();
    
    console.log('✅ User created successfully:', user.Email);
    return user;
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

// Instance method to get basic user statistics
UserSchema.methods.getStatistics = function() {
  return {
    problemsSolved: this.solvedProblems ? this.solvedProblems.length : 0,
    rating: this.rating || 1200,
    submissionCount: this.submissions ? this.submissions.length : 0,
    joinDate: this.createdAt
  };
};

// Create the model
const User = mongoose.model('User', UserSchema);

module.exports = User;
