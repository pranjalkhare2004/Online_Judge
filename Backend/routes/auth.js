const express = require('express');
const registrationRoutes = require('./auth/registration');
const loginRoutes = require('./auth/login');
const oauthRoutes = require('./auth/oauth');
const tokenRoutes = require('./auth/tokens');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Authentication Routes
 * Handles user registration, login, OAuth, and token management
 */

// Verify token endpoint (used by frontend to check auth status)
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.Email, // Use the correct field name from User model
          username: user.username,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          role: user.role,
          solvedProblems: user.solvedProblems.length,
          totalSubmissions: user.totalSubmissions,
          successfulSubmissions: user.successfulSubmissions
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mount authentication sub-routes
router.use('/', registrationRoutes);  // /api/auth/register
router.use('/', loginRoutes);         // /api/auth/login, /api/auth/logout
router.use('/oauth', oauthRoutes);    // /api/auth/oauth/google, /api/auth/oauth/github
router.use('/tokens', tokenRoutes);   // /api/auth/tokens/refresh, /api/auth/tokens/revoke

module.exports = router;
