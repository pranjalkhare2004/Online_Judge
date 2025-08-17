/**
 * API ROUTES MAIN INDEX
 * 
 * DESCRIPTION:
 * This file serves as the central routing hub for the Online Judge backend API.
 * It organizes and mounts all route modules under their respective endpoints,
 * provides API documentation, and serves as the main entry point for all
 * API requests. Implements proper route organization and API versioning.
 * 
 * FUNCTIONS USED:
 * - express.Router(): Express router instance creation
 * - router.use(): Mounting route modules
 * - router.get(): API documentation endpoint
 * - res.json(): JSON response formatting
 * 
 * EXPORTS:
 * - router: Main Express router with all mounted routes
 * 
 * USED BY:
 * - server.js: Main server application routing
 * 
 * DEPENDENCIES:
 * - routes/auth.js: Authentication routes
 * - routes/user.js: User management routes
 * - routes/problems.js: Problem management routes
 * - routes/submissions.js: Submission handling routes
 * - routes/contests.js: Contest management routes
 * - routes/leaderboard.js: Ranking and leaderboard routes
 * - routes/admin.js: Administrative routes
 * - routes/testCases.js: Test case management routes
 * 
 * MOUNTED ROUTES:
 * - /auth: User authentication and authorization
 * - /user: User profile and account management
 * - /problems: Problem CRUD and browsing
 * - /submissions: Code submission and evaluation
 * - /contests: Contest management and participation
 * - /leaderboard: Rankings and statistics
 * - /admin: Administrative operations
 * - /testcases: Test case management
 * 
 * API ENDPOINTS:
 * - GET /: API documentation and endpoint listing
 * - All mounted route endpoints under their respective prefixes
 * 
 * FEATURES:
 * - Centralized route management
 * - API documentation endpoint
 * - Organized endpoint structure
 * - Version information
 * - Route module separation
 */

const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const problemRoutes = require('./problems');
const mockProblemsRoutes = require('./mockProblems');
const submissionRoutes = require('./submissions');
const contestRoutes = require('./contests');
const leaderboardRoutes = require('./leaderboard');
const adminRoutes = require('./admin');
const testCaseRoutes = require('./testCases');
const notificationRoutes = require('./notifications');
const compilerRoutes = require('./compiler-simple'); // Using simple version for testing

const router = express.Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/problems', problemRoutes);
router.use('/mock/problems', mockProblemsRoutes); // Mount under /mock/problems to avoid conflicts
router.use('/submissions', submissionRoutes);
router.use('/contests', contestRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);
router.use('/testcases', testCaseRoutes);
router.use('/notifications', notificationRoutes);
router.use('/compiler', compilerRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Online Judge API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        google: 'GET /api/auth/google',
        github: 'GET /api/auth/github',
        tokens: {
          verify: 'POST /api/auth/tokens/verify',
          refresh: 'POST /api/auth/tokens/refresh',
          profile: 'GET /api/auth/tokens/profile'
        }
      },
      user: {
        profile: 'GET /api/user/profile',
        update: 'PUT /api/user/profile',
        submissions: 'GET /api/user/submissions'
      },
      problems: {
        list: 'GET /api/problems',
        get: 'GET /api/problems/:id'
      },
      submissions: {
        submit: 'POST /api/submissions',
        get: 'GET /api/submissions/:id',
        userSubmissions: 'GET /api/submissions/user/:userId',
        problemSubmissions: 'GET /api/submissions/problem/:problemId'
      },
      contests: {
        list: 'GET /api/contests',
        get: 'GET /api/contests/:id',
        register: 'POST /api/contests/:id/register',
        leaderboard: 'GET /api/contests/:id/leaderboard'
      },
      leaderboard: {
        global: 'GET /api/leaderboard',
        problems: 'GET /api/leaderboard/problems'
      },
      admin: {
        queueStats: 'GET /api/admin/queue/stats',
        cleanQueue: 'POST /api/admin/queue/clean',
        dockerStatus: 'GET /api/admin/system/docker',
        pullImages: 'POST /api/admin/system/docker/pull'
      }
    },
    documentation: 'https://api-docs.onlinejudge.com'
  });
});

module.exports = router;
