const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

/**
 * Validation middleware to check express-validator results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return next(new AppError('Validation failed', 400, true, errorMessages));
  }
  
  next();
};

/**
 * Joi validation middleware
 */
const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      return next(new AppError('Validation failed', 400, true, errorMessages));
    }
    
    req.body = value;
    next();
  };
};

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdRegex.test(id)) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
    }
    
    next();
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return next(new AppError('Page number must be greater than 0', 400));
  }
  
  if (limit < 1 || limit > 100) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }
  
  req.pagination = { page, limit };
  next();
};

/**
 * Validate sort parameters
 */
const validateSort = (allowedFields = []) => {
  return (req, res, next) => {
    const { sortBy, sortOrder = 'desc' } = req.query;
    
    if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return next(new AppError(`Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`, 400));
    }
    
    if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      return next(new AppError('Sort order must be either "asc" or "desc"', 400));
    }
    
    req.sort = {
      field: sortBy || 'createdAt',
      order: sortOrder.toLowerCase() === 'asc' ? 1 : -1
    };
    
    next();
  };
};

module.exports = {
  validate,
  validateWithJoi,
  validateObjectId,
  validatePagination,
  validateSort
};
