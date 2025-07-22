const express = require('express');
const { body, param, query } = require('express-validator');
const contestController = require('../controllers/contestController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all contests (public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Draft', 'Live', 'Completed', 'Cancelled']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'startTime', 'endTime', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, contestController.getAllContests);

// Get contest by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid contest ID')
], validate, contestController.getContestById);

// Create new contest (admin only)
router.post('/', authenticate, requireAdmin, [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('problems')
    .isArray({ min: 1 })
    .withMessage('Contest must have at least one problem'),
  body('problems.*.problem')
    .isMongoId()
    .withMessage('Invalid problem ID'),
  body('problems.*.points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max participants must be a positive integer')
], validate, contestController.createContest);

// Update contest (admin only)
router.put('/:id', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid contest ID'),
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().isLength({ min: 10 }),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('isPublic').optional().isBoolean(),
  body('maxParticipants').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['Draft', 'Live', 'Completed', 'Cancelled'])
], validate, contestController.updateContest);

// Delete contest (admin only)
router.delete('/:id', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid contest ID')
], validate, contestController.deleteContest);

// Register for contest
router.post('/:id/register', authenticate, [
  param('id').isMongoId().withMessage('Invalid contest ID')
], validate, contestController.registerForContest);

// Unregister from contest
router.delete('/:id/register', authenticate, [
  param('id').isMongoId().withMessage('Invalid contest ID')
], validate, contestController.unregisterFromContest);

// Get contest leaderboard
router.get('/:id/leaderboard', [
  param('id').isMongoId().withMessage('Invalid contest ID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validate, contestController.getContestLeaderboard);

// Get contest submissions
router.get('/:id/submissions', authenticate, [
  param('id').isMongoId().withMessage('Invalid contest ID'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('problemId').optional().isMongoId(),
  query('userId').optional().isMongoId()
], validate, contestController.getContestSubmissions);

module.exports = router;
