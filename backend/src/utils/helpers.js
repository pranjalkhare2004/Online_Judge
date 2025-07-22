const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate a secure random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a password using crypto
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} - Hashed password
 */
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Generate slug from title
 * @param {string} title - Title to convert
 * @returns {string} - URL-friendly slug
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} - Pagination metadata
 */
const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Sanitize user data for response
 * @param {Object} user - User object
 * @returns {Object} - Sanitized user data
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

/**
 * Generate contest leaderboard
 * @param {Array} submissions - Contest submissions
 * @returns {Array} - Sorted leaderboard
 */
const generateLeaderboard = (submissions) => {
  const userScores = new Map();

  submissions.forEach(submission => {
    const userId = submission.user._id.toString();
    const problemId = submission.problem._id.toString();
    
    if (!userScores.has(userId)) {
      userScores.set(userId, {
        user: submission.user,
        totalScore: 0,
        solvedProblems: new Set(),
        submissions: 0,
        lastSubmissionTime: submission.createdAt
      });
    }

    const userScore = userScores.get(userId);
    userScore.submissions++;

    if (submission.status === 'Accepted' && !userScore.solvedProblems.has(problemId)) {
      userScore.solvedProblems.add(problemId);
      userScore.totalScore += submission.points || 100;
      userScore.lastSubmissionTime = submission.createdAt;
    }
  });

  return Array.from(userScores.values())
    .map(score => ({
      ...score,
      solvedProblems: score.solvedProblems.size
    }))
    .sort((a, b) => {
      if (a.totalScore !== b.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return new Date(a.lastSubmissionTime) - new Date(b.lastSubmissionTime);
    });
};

/**
 * Format execution time
 * @param {number} timeMs - Time in milliseconds
 * @returns {string} - Formatted time
 */
const formatExecutionTime = (timeMs) => {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }
  return `${(timeMs / 1000).toFixed(2)}s`;
};

/**
 * Format memory usage
 * @param {number} memoryBytes - Memory in bytes
 * @returns {string} - Formatted memory
 */
const formatMemoryUsage = (memoryBytes) => {
  const mb = memoryBytes / (1024 * 1024);
  return `${mb.toFixed(2)}MB`;
};

/**
 * Validate and parse sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {Array} allowedFields - Allowed sort fields
 * @returns {Object} - Parsed sort object
 */
const parseSortParams = (sortBy, sortOrder = 'desc', allowedFields = []) => {
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  
  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    sortBy = allowedFields[0]; // Default to first allowed field
  }
  
  return sortBy ? { [sortBy]: order } : { createdAt: -1 };
};

/**
 * Create API response format
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} - Formatted response
 */
const createResponse = (success, message, data = null, meta = null) => {
  const response = { success, message };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return response;
};

module.exports = {
  generateRandomString,
  hashPassword,
  generateToken,
  verifyToken,
  generateSlug,
  calculatePagination,
  sanitizeUser,
  generateLeaderboard,
  formatExecutionTime,
  formatMemoryUsage,
  parseSortParams,
  createResponse
};
