const express = require('express');
const { param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { verifyToken, verifyAdmin, verifyAdminOrSelf } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all users (with pagination and search)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('role').optional().isIn(['user', 'admin']),
  query('sortBy').optional().isIn(['firstname', 'lastname', 'email', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, userController.getAllUsers);

// Get user profile (authenticated user)
router.get('/profile', verifyToken, userController.getProfile);

// Update user profile (authenticated user)
router.put('/profile', verifyToken, userController.updateProfile);

// Get user by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validate, userController.getUserById);

// Get user statistics
router.get('/:id/stats', [
  param('id').isMongoId().withMessage('Invalid user ID')
], validate, userController.getUserStats);

// Get user submissions
router.get('/:id/submissions', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error']),
  query('language').optional().isIn(['javascript', 'python', 'java', 'cpp', 'c'])
], validate, userController.getUserSubmissions);

module.exports = router;
