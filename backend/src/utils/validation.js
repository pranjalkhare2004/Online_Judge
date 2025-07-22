const Joi = require('joi');

// User validation schemas
const userValidationSchemas = {
  register: Joi.object({
    firstname: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),
    
    lastname: Joi.string()
      .min(2)
      .max(50)
      .required()
      .trim()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .lowercase()
      .trim(),
    
    password: Joi.string()
      .min(6)
      .required()
  }),

  updateProfile: Joi.object({
    firstname: Joi.string().min(2).max(50).trim(),
    lastname: Joi.string().min(2).max(50).trim(),
    bio: Joi.string().max(500).allow(''),
    website: Joi.string().uri().allow(''),
    github: Joi.string().allow(''),
    linkedin: Joi.string().allow('')
  })
};

// Problem validation schemas
const problemValidationSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(5)
      .max(200)
      .required()
      .trim(),
    
    description: Joi.string()
      .min(20)
      .required(),
    
    difficulty: Joi.string()
      .valid('Easy', 'Medium', 'Hard')
      .required(),
    
    tags: Joi.array()
      .items(Joi.string().trim())
      .min(1)
      .max(10),
    
    timeLimit: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .default(2),
    
    memoryLimit: Joi.number()
      .integer()
      .min(64)
      .max(512)
      .default(256),
    
    testCases: Joi.array()
      .items(Joi.object({
        input: Joi.string().required(),
        expectedOutput: Joi.string().required(),
        isHidden: Joi.boolean().default(false),
        points: Joi.number().integer().min(1).default(1)
      }))
      .min(1)
      .required(),
    
    sampleInput: Joi.string().required(),
    sampleOutput: Joi.string().required(),
    constraints: Joi.string().allow(''),
    hints: Joi.array().items(Joi.string())
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).trim(),
    description: Joi.string().min(20),
    difficulty: Joi.string().valid('Easy', 'Medium', 'Hard'),
    tags: Joi.array().items(Joi.string().trim()).min(1).max(10),
    timeLimit: Joi.number().integer().min(1).max(10),
    memoryLimit: Joi.number().integer().min(64).max(512),
    isActive: Joi.boolean(),
    constraints: Joi.string().allow(''),
    hints: Joi.array().items(Joi.string())
  })
};

// Submission validation schemas
const submissionValidationSchemas = {
  create: Joi.object({
    problemId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid problem ID format'
      }),
    
    language: Joi.string()
      .valid('javascript', 'python', 'java', 'cpp', 'c')
      .required(),
    
    code: Joi.string()
      .min(1)
      .max(10000)
      .required()
      .messages({
        'string.min': 'Code cannot be empty',
        'string.max': 'Code cannot exceed 10,000 characters'
      })
  })
};

// Contest validation schemas
const contestValidationSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(5)
      .max(200)
      .required()
      .trim(),
    
    description: Joi.string()
      .min(10)
      .required(),
    
    startTime: Joi.date()
      .greater('now')
      .required(),
    
    endTime: Joi.date()
      .greater(Joi.ref('startTime'))
      .required(),
    
    problems: Joi.array()
      .items(Joi.object({
        problem: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
        points: Joi.number().integer().min(1).default(100)
      }))
      .min(1)
      .required(),
    
    isPublic: Joi.boolean().default(true),
    maxParticipants: Joi.number().integer().min(1),
    rules: Joi.string().allow('')
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).trim(),
    description: Joi.string().min(10),
    startTime: Joi.date(),
    endTime: Joi.date(),
    isPublic: Joi.boolean(),
    maxParticipants: Joi.number().integer().min(1),
    rules: Joi.string().allow(''),
    status: Joi.string().valid('Draft', 'Live', 'Completed', 'Cancelled')
  })
};

// Common validation schemas
const commonValidationSchemas = {
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format'
    }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  search: Joi.object({
    query: Joi.string().min(1).max(100).trim(),
    filters: Joi.object()
  })
};

module.exports = {
  userValidationSchemas,
  problemValidationSchemas,
  submissionValidationSchemas,
  contestValidationSchemas,
  commonValidationSchemas
};
