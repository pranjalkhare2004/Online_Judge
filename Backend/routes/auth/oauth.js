const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../../middleware/auth');
const User = require('../../models/User');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

/**
 * Rate limiting for OAuth endpoints
 * Prevents abuse of OAuth authentication flow
 */
const oauthRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { 
    success: false, 
    message: 'Too many OAuth requests, please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all OAuth routes
router.use(oauthRateLimit);

/**
 * @route   GET /api/auth/oauth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @route   GET /api/auth/oauth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (called by Google OAuth service)
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true&provider=google`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed&provider=google`);
    }
  }
);

/**
 * @route   GET /api/auth/oauth/github
 * @desc    Initiate GitHub OAuth authentication
 * @access  Public
 */
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

/**
 * @route   GET /api/auth/oauth/github/callback
 * @desc    Handle GitHub OAuth callback
 * @access  Public (called by GitHub OAuth service)
 */
router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      const token = generateToken(req.user._id);
      
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&success=true&provider=github`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=oauth_failed&provider=github`);
    }
  }
);

/**
 * @route   GET /api/auth/oauth/failure
 * @desc    OAuth failure handler
 * @access  Public
 */
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'OAuth authentication failed',
    error: req.query.error || 'unknown_error'
  });
});

module.exports = router;
