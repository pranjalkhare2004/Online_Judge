
const express = require('express');
const bcrypt = require('bcryptjs');
const { validateLogin } = require('../../middleware/validation');
const { generateToken } = require('../../middleware/auth');
const User = require('../../models/User');
const router = express.Router();
const rateLimit = require('express-rate-limit');


/**
 * Rate limiting for login attempts
 * Prevents brute force attacks on login endpoint
 */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // temporarily increased for testing - normally 5
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user with email/password
 * @access  Public
 * @body    { email, password }
 * @returns { success, message, data: { token, user } }
 */
router.post('/login', loginRateLimit, (req, res, next) => {
  // Normalize login fields to lowercase for validation
  req.body.email = req.body.email || req.body.Email || '';
  req.body.password = req.body.password || req.body.Password || '';
  next();
}, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by email (case-insensitive)
    const user = await User.findOne({ Email: email.toLowerCase() });
    console.log('Login attempt for email:', email, 'User found:', !!user, user ? { Email: user.Email, Password: user.Password } : null);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }
    // Validate password using the user model method
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();
    
    console.log('🔍 Attempting to generate token pair for login...');
    
    // Generate token pair (access token + refresh token)
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    try {
      const tokenPair = await user.generateTokenPair(deviceInfo);
      console.log('✅ Login token pair generated successfully:', { 
        hasAccessToken: !!tokenPair.accessToken, 
        hasRefreshToken: !!tokenPair.refreshToken 
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          expiresIn: 900, // 15 minutes in seconds (default for access token)
          user: {
            id: user._id,
            name: user.FullName,
            email: user.Email,
            username: user.username,
            dob: user.DOB,
            isActive: user.isActive,
            role: user.role,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (tokenError) {
      console.error('❌ Login token pair generation failed, falling back to single token:', tokenError);
      
      // Fallback to old token generation
      const token = generateToken(user._id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id,
            name: user.FullName,
            email: user.Email,
            username: user.username,
            dob: user.DOB,
            isActive: user.isActive,
            role: user.role,
            lastLogin: user.lastLogin
          }
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke refresh tokens
 * @access  Public
 * @body    { refreshToken, revokeAll? }
 */
router.post('/logout', async (req, res) => {
  try {
    const RefreshToken = require('../../models/RefreshToken');
    const { refreshToken, revokeAll = false } = req.body;

    if (revokeAll) {
      // Revoke all tokens for the user (requires access token)
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];
      
      if (accessToken) {
        try {
          const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
          await RefreshToken.revokeAllForUser(decoded.id, 'logout');
          console.log(`🔐 All tokens revoked for user: ${decoded.Email}`);
        } catch (error) {
          console.log('Access token invalid during logout, continuing...');
        }
      }
    } else if (refreshToken) {
      // Revoke specific refresh token
      try {
        const tokenRecord = await RefreshToken.findByToken(refreshToken);
        if (tokenRecord) {
          await tokenRecord.revoke('logout');
          console.log(`🔐 Refresh token revoked for user: ${tokenRecord.userId.Email}`);
        }
      } catch (error) {
        console.log('Refresh token revocation failed during logout:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Logout successful. Tokens have been revoked.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({
      success: true,
      message: 'Logout successful. Please remove tokens from client storage.'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token (handles expired tokens)
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required for refresh'
      });
    }

    // Verify existing token (even if expired)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'online-judge-backend',
        audience: 'online-judge-frontend'
      });
    } catch (error) {
      // If token is expired, try to verify ignoring expiration
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          ignoreExpiration: true,
          issuer: 'online-judge-backend',
          audience: 'online-judge-frontend'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
    }

    // Get user from decoded token
    const user = await User.findById(decoded.id).select('-Password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or account deactivated'
      });
    }

    // Generate new token with consistent payload structure
    const newToken = jwt.sign(
      {
        id: user._id,
        userId: user._id,
        UserId: user.UserId,
        Email: user.Email,
        FullName: user.FullName,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE_TIME || '24h',
        issuer: 'online-judge-backend',
        audience: 'online-judge-frontend'
      }
    );
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: user._id,
          UserId: user.UserId,
          FullName: user.FullName,
          Email: user.Email,
          role: user.role,
          rating: user.rating || 1200,
          isVerified: user.isVerified || false
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

module.exports = router;
