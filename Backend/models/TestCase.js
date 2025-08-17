/**
 * TEST CASE MODEL SCHEMA
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for test cases used to evaluate code submissions
 * in the Online Judge system. It stores input data, expected outputs, and metadata
 * for automated testing of user solutions. Supports both public examples and private
 * test cases for comprehensive solution validation.
 * 
 * FUNCTIONS USED:
 * - mongoose.Schema(): MongoDB schema definition
 * - Schema.index(): Database indexing for query performance
 * - Schema.pre('save'): Pre-save middleware for validation
 * - Schema.methods.validate(): Instance method for test case validation
 * - Schema.statics.getPublicCases(): Static method for public test cases
 * - Schema.statics.getAllCases(): Static method for all test cases (admin)
 * 
 * EXPORTS:
 * - TestCase: Mongoose model for test case operations
 * 
 * USED BY:
 * - routes/testCases.js: Test case CRUD operations
 * - routes/admin.js: Test case administration
 * - routes/problems.js: Problem test case management
 * - utils/executeCode.js: Code execution and validation
 * - utils/problemTestCases.js: Test case utilities
 * - models/Problem.js: Problem test case references
 * - models/Submission.js: Submission evaluation
 * - seedDatabase.js: Test case data seeding
 * 
 * SCHEMA FIELDS:
 * - problemId: Reference to associated problem
 * - input: Test case input data (max 10KB)
 * - expectedOutput: Expected program output (max 10KB)
 * - isPublic: Visibility flag (public examples vs private tests)
 * - description: Optional test case description
 * - timeLimit: Custom time limit for this test case (optional)
 * - memoryLimit: Custom memory limit for this test case (optional)
 * - points: Points awarded for passing this test case
 * - difficulty: Test case difficulty level
 * - tags: Categorization tags for test cases
 * - createdAt/updatedAt: Timestamps
 * 
 * TEST CASE TYPES:
 * - Public: Visible examples shown to users
 * - Private: Hidden test cases for evaluation
 * - Sample: Basic functionality tests
 * - Edge: Edge case and boundary tests
 * - Stress: Performance and limit tests
 * 
 * INDEXES:
 * - problemId: Fast lookup by problem
 * - isPublic: Public/private filtering
 * - difficulty: Difficulty-based queries
 * 
 * INSTANCE METHODS:
 * - validate(): Validate test case data format
 * 
 * STATIC METHODS:
 * - getPublicCases(): Retrieve public test cases for a problem
 * - getAllCases(): Retrieve all test cases (admin access)
 */

const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  input: {
    type: String,
    required: true,
    maxlength: 10000,
    trim: true
  },
  expectedOutput: {
    type: String,
    required: true,
    maxlength: 10000,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  points: {
    type: Number,
    default: 1,
    min: 0,
    max: 100
  },
  timeLimit: {
    type: Number,
    default: null, // Inherit from problem if null
    min: 100,
    max: 10000
  },
  memoryLimit: {
    type: Number,
    default: null, // Inherit from problem if null
    min: 64,
    max: 1024
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

// Compound indexes for performance
TestCaseSchema.index({ problemId: 1, isPublic: 1 });
TestCaseSchema.index({ problemId: 1, createdAt: 1 });

// Virtual for inherited limits
TestCaseSchema.virtual('effectiveTimeLimit').get(function() {
  return this.timeLimit || (this.populated('problemId') ? this.problemId.timeLimit : null);
});

TestCaseSchema.virtual('effectiveMemoryLimit').get(function() {
  return this.memoryLimit || (this.populated('problemId') ? this.problemId.memoryLimit : null);
});

// Ensure virtual fields are serialized
TestCaseSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update timestamps
TestCaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get public test cases for a problem
TestCaseSchema.statics.getPublicTestCases = function(problemId) {
  return this.find({ problemId, isPublic: true })
    .select('input expectedOutput description points')
    .sort({ createdAt: 1 });
};

// Static method to get all test cases for a problem (admin/judge use)
TestCaseSchema.statics.getAllTestCases = function(problemId) {
  return this.find({ problemId })
    .sort({ createdAt: 1 });
};

module.exports = mongoose.model('TestCase', TestCaseSchema);
