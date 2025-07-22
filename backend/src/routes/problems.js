const express = require('express');
const { body, param, query } = require('express-validator');
const problemController = require('../controllers/problemController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all problems (public)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  query('tags').optional().isString(),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'difficulty', 'createdAt', 'submissionCount']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validate, problemController.getAllProblems);

// Get problem by ID or slug
router.get('/:identifier', [
  param('identifier').notEmpty().withMessage('Problem identifier is required')
], validate, problemController.getProblemById);

// Create new problem (admin only)
router.post('/', authenticate, requireAdmin, [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters long'),
  body('difficulty')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  body('tags')
    .isArray({ min: 1, max: 10 })
    .withMessage('Must provide 1-10 tags'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Time limit must be between 1 and 10 seconds'),
  body('memoryLimit')
    .optional()
    .isInt({ min: 64, max: 512 })
    .withMessage('Memory limit must be between 64 and 512 MB'),
  body('testCases')
    .isArray({ min: 1 })
    .withMessage('Must provide at least one test case'),
  body('sampleInput')
    .notEmpty()
    .withMessage('Sample input is required'),
  body('sampleOutput')
    .notEmpty()
    .withMessage('Sample output is required')
], validate, problemController.createProblem);

// Update problem (admin only)
router.put('/:id', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid problem ID'),
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().isLength({ min: 20 }),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']),
  body('tags').optional().isArray({ min: 1, max: 10 }),
  body('timeLimit').optional().isInt({ min: 1, max: 10 }),
  body('memoryLimit').optional().isInt({ min: 64, max: 512 }),
  body('isActive').optional().isBoolean()
], validate, problemController.updateProblem);

// Delete problem (admin only)
router.delete('/:id', authenticate, requireAdmin, [
  param('id').isMongoId().withMessage('Invalid problem ID')
], validate, problemController.deleteProblem);

// Get problem statistics
router.get('/:id/stats', [
  param('id').isMongoId().withMessage('Invalid problem ID')
], validate, problemController.getProblemStats);

module.exports = router;
