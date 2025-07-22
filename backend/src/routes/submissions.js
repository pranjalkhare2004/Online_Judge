const express = require('express');
const { body, param, query } = require('express-validator');
const submissionController = require('../controllers/submissionController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Submit solution
router.post('/', authenticate, [
  body('problemId')
    .isMongoId()
    .withMessage('Invalid problem ID'),
  body('language')
    .isIn(['javascript', 'python', 'java', 'cpp', 'c'])
    .withMessage('Unsupported programming language'),
  body('code')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Code must be between 1 and 10,000 characters')
], validate, submissionController.createSubmission);

// Get all submissions (admin only)
router.get('/', authenticate, requireAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error']),
  query('language').optional().isIn(['javascript', 'python', 'java', 'cpp', 'c']),
  query('userId').optional().isMongoId(),
  query('problemId').optional().isMongoId(),
  query('sortBy').optional().isIn(['createdAt', 'status', 'language', 'executionTime']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, submissionController.getAllSubmissions);

// Get submission by ID
router.get('/:id', authenticate, [
  param('id').isMongoId().withMessage('Invalid submission ID')
], validate, submissionController.getSubmissionById);

// Get user's submissions (authenticated user)
router.get('/user/me', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Pending', 'Running', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error']),
  query('language').optional().isIn(['javascript', 'python', 'java', 'cpp', 'c']),
  query('problemId').optional().isMongoId(),
  query('sortBy').optional().isIn(['createdAt', 'status', 'language', 'executionTime']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, submissionController.getUserSubmissions);

// Rejudge submission (admin only)
router.post('/:id/rejudge', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid submission ID')
], validate, submissionController.rejudgeSubmission);

// Get submission statistics
router.get('/stats/overview', authenticate, submissionController.getSubmissionStats);

module.exports = router;
