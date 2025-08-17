const express = require('express');
const registrationRoutes = require('./auth/registration');
const loginRoutes = require('./auth/login');
const oauthRoutes = require('./auth/oauth');
const tokenRoutes = require('./auth/tokens');

const router = express.Router();

/**
 * Authentication Routes
 * Handles user registration, login, OAuth, and token management
 */

// Mount authentication sub-routes
router.use('/', registrationRoutes);  // /api/auth/register
router.use('/', loginRoutes);         // /api/auth/login, /api/auth/logout
router.use('/oauth', oauthRoutes);    // /api/auth/oauth/google, /api/auth/oauth/github
router.use('/tokens', tokenRoutes);   // /api/auth/tokens/refresh, /api/auth/tokens/revoke

module.exports = router;
