const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard/stats', adminController.getDashboard);

// User management
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'admin']),
  query('isActive').optional().isBoolean(),
  query('sortBy').optional().isIn(['firstname', 'lastname', 'email', 'createdAt', 'lastLoginAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, adminController.getAllUsers);

router.get('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validate, adminController.getUserById);

router.put('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('firstname').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastname').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean()
], validate, adminController.updateUser);

router.delete('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validate, adminController.deleteUser);

// Problem management
router.get('/problems', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('isActive').optional().isBoolean(),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'difficulty', 'createdAt', 'submissionCount']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, adminController.getAllProblems);

router.put('/problems/:id/toggle-status', [
  param('id').isMongoId().withMessage('Invalid problem ID')
], validate, adminController.toggleProblemStatus);

// Submission management
router.get('/submissions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error']),
  query('language').optional().isIn(['javascript', 'python', 'java', 'cpp', 'c']),
  query('userId').optional().isMongoId(),
  query('problemId').optional().isMongoId(),
  query('sortBy').optional().isIn(['createdAt', 'status', 'language', 'executionTime']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, adminController.getAllSubmissions);

router.post('/submissions/:id/rejudge', [
  param('id').isMongoId().withMessage('Invalid submission ID')
], validate, adminController.rejudgeSubmission);

// Contest management
router.get('/contests', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Draft', 'Live', 'Completed', 'Cancelled']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'startTime', 'endTime', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, adminController.getAllContests);

// System management
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/logs', [
  query('level').optional().isIn(['error', 'warn', 'info', 'debug']),
  query('limit').optional().isInt({ min: 1, max: 1000 })
], validate, adminController.getSystemLogs);

// Analytics
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/submissions', [
  query('days').optional().isInt({ min: 1, max: 365 })
], validate, adminController.getSubmissionAnalytics);
router.get('/analytics/users', [
  query('days').optional().isInt({ min: 1, max: 365 })
], validate, adminController.getUserAnalytics);

module.exports = router;
