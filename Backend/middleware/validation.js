/**
 * INPUT VALIDATION AND SANITIZATION MIDDLEWARE
 * 
 * DESCRIPTION:
 * This file provides comprehensive input validation and sanitization middleware
 * for the Online Judge backend. It prevents XSS attacks, SQL injection, and other
 * security vulnerabilities by sanitizing user input, validating data formats,
 * and enforcing business rules for registration, login, and data updates.
 * 
 * FUNCTIONS USED:
 * - sanitizeInput(): Main input sanitization middleware
 * - sanitizeString(): String sanitization helper
 * - sanitizeObject(): Object recursive sanitization
 * - validateRegistration(): User registration validation rules
 * - validateLogin(): User login validation rules
 * - validateProfileUpdate(): Profile update validation
 * - validatePasswordChange(): Password change validation
 * - validateProblemCreation(): Problem creation validation
 * - validateContestCreation(): Contest creation validation
 * - body(): Express-validator field validation
 * - validationResult(): Validation error collection
 * - validator.escape(): HTML entity escaping
 * - DOMPurify.sanitize(): Advanced HTML sanitization
 * 
 * EXPORTS:
 * - sanitizeInput: Input sanitization middleware
 * - validateRegistration: Registration validation chain
 * - validateLogin: Login validation chain
 * - validateProfileUpdate: Profile update validation
 * - validatePasswordChange: Password change validation
 * - validateProblemCreation: Problem creation validation
 * - validateContestCreation: Contest creation validation
 * 
 * USED BY:
 * - config/middleware.js: Global input sanitization
 * - routes/auth.js: Authentication form validation
 * - routes/user.js: User profile validation
 * - routes/admin.js: Admin operation validation
 * - routes/problems.js: Problem data validation
 * - routes/contests.js: Contest data validation
 * 
 * SECURITY FEATURES:
 * - XSS prevention through HTML escaping
 * - Null byte injection prevention
 * - Input length limitations
 * - Email format validation
 * - Password strength requirements
 * - Username format validation
 * - Recursive object sanitization
 */

const { body, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Function to sanitize strings
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove null bytes
    str = str.replace(/\0/g, '');
    
    // Escape HTML to prevent XSS
    str = validator.escape(str);
    
    // Additional sanitization with DOMPurify
    str = DOMPurify.sanitize(str, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    
    return str;
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  // Sanitize request body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\u00C0-\u024F\u1E00-\u1EFF._-]+$/)
    .withMessage('Full name can only contain letters, numbers, spaces, dots, hyphens, and underscores'),
  
  // Also accept 'name' for backwards compatibility
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\u00C0-\u024F\u1E00-\u1EFF._-]+$/)
    .withMessage('Name can only contain letters, numbers, spaces, dots, hyphens, and underscores'),
  
  body('email')
    .trim() // Add trim before email validation
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
      if (date > thirteenYearsAgo) {
        throw new Error('User must be at least 13 years old');
      }
      return true;
    }),
  
  // Also accept 'DOB' for backwards compatibility
  body('DOB')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .custom((value) => {
      const date = new Date(value);
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);
      if (date > thirteenYearsAgo) {
        throw new Error('User must be at least 13 years old');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Problem submission validation
const validateSubmission = [
  body('problemId')
    .isMongoId()
    .withMessage('Invalid problem ID'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 50000 })
    .withMessage('Code cannot exceed 50KB'),
  
  body('language')
    .isIn(['javascript', 'python', 'java', 'cpp', 'go', 'c', 'rust', 'kotlin', 'swift', 'typescript', 'php', 'ruby'])
    .withMessage('Invalid programming language'),
  
  handleValidationErrors
];

// Validation for problem submission (problemId from URL params)
const validateProblemSubmission = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Code is required')
    .isLength({ max: 50000 })
    .withMessage('Code cannot exceed 50KB'),
  
  body('language')
    .isIn(['javascript', 'python', 'java', 'cpp', 'go', 'c', 'rust', 'kotlin', 'swift', 'typescript', 'php', 'ruby'])
    .withMessage('Invalid programming language'),
  
  handleValidationErrors
];

// Contest creation validation
const validateContestCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Contest title must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Contest description must be between 10 and 2000 characters'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Invalid start time format')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  
  body('endTime')
    .isISO8601()
    .withMessage('Invalid end time format')
    .custom((value, { req }) => {
      const endTime = new Date(value);
      const startTime = new Date(req.body.startTime);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('problems')
    .isArray({ min: 1 })
    .withMessage('At least one problem is required'),
  
  body('problems.*.problemId')
    .isMongoId()
    .withMessage('Invalid problem ID'),
  
  body('problems.*.points')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Points must be between 0 and 1000'),
  
  handleValidationErrors
];

// Test case creation validation
const validateTestCase = [
  body('problemId')
    .isMongoId()
    .withMessage('Invalid problem ID'),
  
  body('input')
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Input cannot exceed 10,000 characters'),
  
  body('expectedOutput')
    .trim()
    .notEmpty()
    .withMessage('Expected output is required')
    .isLength({ max: 10000 })
    .withMessage('Expected output cannot exceed 10,000 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('points')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Points must be between 0 and 100'),
  
  handleValidationErrors
];

// Test case update validation
const validateTestCaseUpdate = [
  body('input')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Input cannot exceed 10,000 characters'),
  
  body('expectedOutput')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Expected output cannot exceed 10,000 characters'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('points')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Points must be between 0 and 100'),
  
  handleValidationErrors
];

module.exports = {
  sanitizeInput,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateSubmission,
  validateProblemSubmission,
  validateContestCreation,
  validateTestCase,
  validateTestCaseUpdate,
  handleValidationErrors
};
