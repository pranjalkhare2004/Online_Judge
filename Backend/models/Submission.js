/**
 * SUBMISSION MODEL SCHEMA
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for code submissions in the Online Judge system.
 * It tracks user submissions, code execution results, performance metrics, and
 * submission status. Essential for evaluating and storing user solutions to problems.
 * Handles multiple programming languages and execution feedback.
 * 
 * FUNCTIONS USED:
 * - mongoose.Schema(): MongoDB schema definition
 * - Schema.index(): Database indexing for query performance
 * - Schema.pre('save'): Pre-save middleware for validation
 * - Schema.post('save'): Post-save middleware for statistics updates
 * - Schema.methods: Instance methods for submission operations
 * - Schema.statics: Static methods for submission queries
 * 
 * EXPORTS:
 * - Submission: Mongoose model for submission operations
 * 
 * USED BY:
 * - routes/submissions.js: Submission CRUD operations
 * - routes/problems.js: Problem submission handling
 * - routes/contests.js: Contest submission management
 * - routes/user.js: User submission history
 * - routes/admin.js: Submission administration
 * - utils/executeCode.js: Code execution and result storage
 * - utils/submissionQueue.js: Submission queue management
 * - models/User.js: User submission references
 * - models/Problem.js: Problem submission tracking
 * - models/Contest.js: Contest submission tracking
 * 
 * SCHEMA FIELDS:
 * - userId: Reference to submitting user
 * - problemId: Reference to problem being solved
 * - code: User's source code (max 50KB)
 * - language: Programming language used
 * - status: Execution status (Pending/Accepted/Wrong Answer/etc.)
 * - executionTime: Code execution time in milliseconds
 * - memoryUsage: Memory consumed during execution (KB)
 * - output: Program output or error message
 * - testCasesPassed: Number of test cases passed
 * - totalTestCases: Total number of test cases
 * - score: Points earned (for partial scoring)
 * - contestId: Contest reference (if contest submission)
 * - submittedAt: Submission timestamp
 * - judgedAt: Judgment completion timestamp
 * 
 * SUPPORTED LANGUAGES:
 * - javascript, python, java, cpp, go, c, rust, kotlin, swift, typescript
 * 
 * SUBMISSION STATUSES:
 * - Pending, Accepted, Wrong Answer, Time Limit Exceeded,
 *   Memory Limit Exceeded, Runtime Error, Compilation Error
 * 
 * INDEXES:
 * - userId + submittedAt: User submission history
 * - problemId + status: Problem acceptance rates
 * - contestId + userId: Contest submissions
 * - status: Status-based filtering
 */

const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: {
    type: String,
    required: true,
    maxlength: 50000, // 50KB limit
    validate: {
      validator: function(v) {
        return v.trim().length > 0;
      },
      message: 'Code cannot be empty or contain only whitespace'
    }
  },
  language: {
    type: String,
    required: true,
    enum: {
      values: ['javascript', 'python', 'java', 'cpp', 'go', 'c', 'rust', 'kotlin', 'swift', 'typescript'],
      message: 'Language {VALUE} is not supported'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Runtime Error', 'Compilation Error'],
    default: 'Pending'
  },
  
  // Execution results
  executionTime: {
    type: Number, // in milliseconds
    default: null
  },
  memoryUsed: {
    type: Number, // in MB
    default: null
  },
  
  // Test case results
  testCaseResults: [{
    input: String,
    expectedOutput: String,
    actualOutput: String,
    status: {
      type: String,
      enum: ['Passed', 'Failed', 'Error']
    },
    executionTime: Number,
    memoryUsed: Number
  }],
  
  // Error details
  errorMessage: {
    type: String,
    default: null
  },
  
  // Contest submission (if applicable)
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  
  // Score (for contests)
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
SubmissionSchema.index({ userId: 1, submittedAt: -1 });
SubmissionSchema.index({ problemId: 1, status: 1 });
SubmissionSchema.index({ contestId: 1, submittedAt: -1 });
SubmissionSchema.index({ status: 1 });

// Enhanced compound indexes for performance
SubmissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });
SubmissionSchema.index({ problemId: 1, status: 1, submittedAt: -1 });
SubmissionSchema.index({ userId: 1, status: 1, submittedAt: -1 });
SubmissionSchema.index({ contestId: 1, userId: 1, submittedAt: -1 });
SubmissionSchema.index({ language: 1, status: 1 });
SubmissionSchema.index({ submittedAt: -1, status: 1 }); // For recent submissions queries

// Sparse index for contest submissions only
SubmissionSchema.index({ contestId: 1, score: -1 }, { sparse: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
