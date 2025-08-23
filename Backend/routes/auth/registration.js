const express = require('express');
const { validateRegistration } = require('../../middleware/validation');
const { generateToken } = require('../../middleware/auth');
const User = require('../../models/User');
const router = express.Router();
const rateLimit = require('express-rate-limit');

/**
 * Rate limiting for registration attempts
 * Prevents brute force attacks on registration endpoint
 */
const registrationRateLimit = rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1 * 60 * 1000 : 5 * 60 * 1000, // 1 minute for tests, 5 minutes for production
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // 1000 for tests, 10 for production
  message: {
    success: false,
    message: 'Too many registration attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with email/password
 * @access  Public
 * @body    { name, email, password, username }
 * @returns { success, message, data: { token, user } }
 */
router.post('/register', registrationRateLimit, (req, res, next) => {
  // Normalize registration fields to lowercase for validation
  req.body.name = req.body.name || req.body.FullName || req.body.fullName || '';
  req.body.email = req.body.email || req.body.Email || '';
  req.body.password = req.body.password || req.body.Password || '';
  req.body.DOB = req.body.DOB || req.body.dob || req.body.dateOfBirth || '';
  
  // Also set fullName for validation compatibility
  req.body.fullName = req.body.fullName || req.body.name || req.body.FullName || '';
  req.body.dateOfBirth = req.body.dateOfBirth || req.body.DOB || req.body.dob || '';
  
  next();
}, validateRegistration, async (req, res) => {
  // Debug: print the received registration body
  console.log('Registration request body:', req.body);
  try {
    // Map validated fields to model fields
    const userData = {
      FullName: (req.body.fullName || req.body.name) ? (req.body.fullName || req.body.name).trim() : undefined,
      Email: req.body.email ? req.body.email.toLowerCase() : undefined,
      Password: req.body.password,
      DOB: req.body.dateOfBirth || req.body.DOB,
      username: req.body.username ? req.body.username.trim() : undefined
    };
    // Debug: print the userData object being sent to Mongoose
    console.log('User data for Mongoose:', userData);

    // Check if user with email already exists
    const existingUser = await User.findOne({ Email: userData.Email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if username is taken (if provided)
    if (userData.username) {
      const existingUsername = await User.findOne({ username: userData.username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User(userData);
    await user.save();

    console.log('🔍 Attempting to generate token pair...');
    
    // Generate token pair (access token + refresh token)
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    try {
      const tokenPair = await user.generateTokenPair(deviceInfo);
      console.log('✅ Token pair generated successfully:', { 
        hasAccessToken: !!tokenPair.accessToken, 
        hasRefreshToken: !!tokenPair.refreshToken 
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: 900, // 15 minutes in seconds (default for access token)
          user: {
            id: user._id,
            name: user.FullName,
            email: user.Email,
            username: user.username,
            avatar: user.avatar,
            rating: user.rating,
            isVerified: user.isVerified,
            role: user.role,
            createdAt: user.createdAt
          }
        }
      });
    } catch (tokenError) {
      console.error('❌ Token pair generation failed, falling back to single token:', tokenError);
      
      // Fallback to old token generation
      const { generateToken } = require('../../middleware/auth');
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: user._id,
            name: user.FullName,
            email: user.Email,
            username: user.username,
            avatar: user.avatar,
            rating: user.rating,
            isVerified: user.isVerified,
            role: user.role,
            createdAt: user.createdAt
          }
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    // ...existing code...
  }
});

module.exports = router;
