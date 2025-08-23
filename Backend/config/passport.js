/**
 * PASSPORT AUTHENTICATION CONFIGURATION
 * 
 * DESCRIPTION:
 * This file configures Passport.js authentication strategies for the Online Judge application.
 * It implements OAuth 2.0 authentication with Google and GitHub providers, handles user
 * serialization/deserialization for sessions, and manages user creation/login for social auth.
 * Provides secure third-party authentication integration.
 * 
 * FUNCTIONS USED:
 * - passport.serializeUser(): Stores user ID in session
 * - passport.deserializeUser(): Retrieves user from database using session ID
 * - passport.use(): Registers authentication strategies
 * - GoogleStrategy(): Google OAuth 2.0 strategy configuration
 * - GitHubStrategy(): GitHub OAuth strategy configuration
 * - User.findOne(): Database user lookup
 * - User.create(): New user creation
 * - generateUsername(): Unique username generation
 * - console.error(): Error logging
 * 
 * EXPORTS:
 * - None (configures passport globally)
 * 
 * USED BY:
 * - server.js: Imports this configuration during app initialization
 * - routes/auth.js: Uses configured passport strategies for OAuth routes
 * 
 * DEPENDENCIES:
 * - models/User.js: User model for database operations
 * 
 * AUTHENTICATION STRATEGIES:
 * - Google OAuth 2.0: Sign in with Google account
 * - GitHub OAuth: Sign in with GitHub account
 * 
 * ENVIRONMENT VARIABLES USED:
 * - GOOGLE_CLIENT_ID: Google OAuth application ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth application secret
 * - GITHUB_CLIENT_ID: GitHub OAuth application ID
 * - GITHUB_CLIENT_SECRET: GitHub OAuth application secret
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

/**
 * Passport.js configuration for OAuth authentication
 * Supports Google OAuth 2.0 and GitHub OAuth
 */

// Serialize user for session (stores user ID in session)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session (retrieves user from database)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    console.error('Passport deserialize error:', error);
    done(error, null);
  }
});

/**
 * Google OAuth Strategy Configuration
 * Handles Google OAuth 2.0 authentication flow
 */
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/oauth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (process.env.DEBUG_OAUTH === 'true') {
      console.log('Google OAuth Profile:', {
        id: profile.id,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos
      });
    }

    // Extract profile information
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    if (!email) {
      return done(new Error('No email found in Google profile'), null);
    }

    // Try to find existing user
    let user = await User.findOne({
      $or: [
        { googleId: profile.id },
        { email: email }
      ]
    });

    if (user) {
      // If user exists but doesn't have Google ID, link it
      if (!user.googleId) {
        user.googleId = profile.id;
        if (!user.avatar && avatar) {
          user.avatar = avatar;
        }
        user.isVerified = true; // OAuth users are considered verified
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        name: profile.displayName || 'Google User',
        email: email,
        googleId: profile.id,
        avatar: avatar,
        isVerified: true,
        rating: 1200, // Default rating for new users
        lastLogin: new Date()
      });
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    return done(error, null);
  }
}));

/**
 * GitHub OAuth Strategy Configuration
 * Handles GitHub OAuth authentication flow
 */
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/api/auth/oauth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    if (process.env.DEBUG_OAUTH === 'true') {
      console.log('GitHub OAuth Profile:', {
        id: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        emails: profile.emails,
        photos: profile.photos
      });
    }

    // Extract profile information
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

    // GitHub might not provide email, so we need to handle this case
    let searchQuery = { githubId: profile.id };
    if (email) {
      searchQuery = {
        $or: [
          { githubId: profile.id },
          { email: email }
        ]
      };
    }

    // Try to find existing user
    let user = await User.findOne(searchQuery);

    if (user) {
      // If user exists but doesn't have GitHub ID, link it
      if (!user.githubId) {
        user.githubId = profile.id;
        if (!user.avatar && avatar) {
          user.avatar = avatar;
        }
        user.isVerified = true; // OAuth users are considered verified
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      }
    } else {
      // Create new user
      const userData = {
        name: profile.displayName || profile.username || 'GitHub User',
        githubId: profile.id,
        avatar: avatar,
        isVerified: true,
        rating: 1200, // Default rating for new users
        lastLogin: new Date()
      };

      // Handle email (GitHub might not provide it)
      if (email) {
        userData.email = email;
      } else {
        // Use GitHub username as fallback email
        userData.email = `${profile.username}@github.local`;
      }

      user = new User(userData);
      await user.save();
    }

    return done(null, user);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    return done(error, null);
  }
}));

module.exports = passport;
