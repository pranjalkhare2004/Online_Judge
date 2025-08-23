/**
 * PROBLEM MODEL SCHEMA
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for coding problems in the Online Judge system.
 * It stores problem statements, test cases, constraints, examples, and metadata.
 * Handles problem categorization, difficulty levels, tags, and submission tracking.
 * Essential for the core functionality of the coding platform.
 * 
 * FUNCTIONS USED:
 * - mongoose.Schema(): MongoDB schema definition
 * - Schema.pre('save'): Pre-save middleware for slug generation
 * - Schema.index(): Database indexing for performance
 * - Schema.virtual(): Virtual fields for computed properties
 * - Schema.methods: Instance methods for problem operations
 * - Schema.statics: Static methods for problem queries
 * 
 * EXPORTS:
 * - Problem: Mongoose model for problem operations
 * 
 * USED BY:
 * - routes/problems.js: Problem CRUD operations
 * - routes/admin.js: Problem administration
 * - routes/submissions.js: Problem submission handling
 * - routes/contests.js: Contest problem management
 * - utils/problemTestCases.js: Test case operations
 * - models/Submission.js: Problem reference in submissions
 * - models/Contest.js: Contest problem references
 * - models/TestCase.js: Associated test cases
 * - seedDatabase.js: Problem data seeding
 * 
 * SCHEMA FIELDS:
 * - title: Problem title/name
 * - slug: URL-friendly identifier (unique)
 * - difficulty: Problem difficulty level (Easy/Medium/Hard)
 * - description: Detailed problem statement
 * - inputFormat: Input specification
 * - outputFormat: Output specification
 * - constraints: Problem constraints and limits
 * - examples: Sample input/output examples
 * - tags: Problem categorization tags
 * - timeLimit: Execution time limit (milliseconds)
 * - memoryLimit: Memory usage limit (MB)
 * - points: Scoring points for correct solution
 * - author: Problem creator reference
 * - isPublic: Problem visibility status
 * - testCases: Associated test case references
 * - submissions: Submission count tracking
 * - acceptedSubmissions: Successful submission count
 * - createdAt/updatedAt: Timestamps
 * 
 * INDEXES:
 * - slug: Unique index for fast lookups
 * - difficulty: Index for difficulty-based queries
 * - tags: Index for tag-based filtering
 * - isPublic: Index for public/private filtering
 */

const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  description: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return v.length <= 10000;
      },
      message: 'Description exceeds maximum length of 10,000 characters'
    }
  },
  constraints: [{
    type: String
  }],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  timeLimit: {
    type: Number,
    default: 1000, // milliseconds
    min: 100,
    max: 10000
  },
  memoryLimit: {
    type: Number,
    default: 256, // MB
    min: 64,
    max: 1024
  },
  
  // Test cases (referenced from TestCase collection)
  testCases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCase'
  }],
  
  // Statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  acceptedSubmissions: {
    type: Number,
    default: 0
  },
  
  // Problem status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Author/Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for acceptance rate
ProblemSchema.virtual('acceptanceRate').get(function() {
  if (this.totalSubmissions === 0) return 0;
  return Math.round((this.acceptedSubmissions / this.totalSubmissions) * 100);
});

// Ensure virtual fields are serialized
ProblemSchema.set('toJSON', { virtuals: true });

// Indexes
ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ tags: 1 });
ProblemSchema.index({ slug: 1 });
ProblemSchema.index({ isFeatured: -1, createdAt: -1 });

// Enhanced compound indexes for performance
ProblemSchema.index({ slug: 1, difficulty: 1, tags: 1 });
ProblemSchema.index({ isActive: 1, difficulty: 1 });
ProblemSchema.index({ isActive: 1, isFeatured: -1, createdAt: -1 });
ProblemSchema.index({ tags: 1, difficulty: 1, isActive: 1 });
ProblemSchema.index({ createdBy: 1, isActive: 1 });

// Text index for search functionality
ProblemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    tags: 5,
    description: 1
  },
  name: 'problem_text_index'
});

module.exports = mongoose.model('Problem', ProblemSchema);
