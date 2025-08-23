/**
 * CUSTOM PROBLEM LIST MODEL SCHEMA
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for custom problem lists that users can create
 * to organize problems by topic, difficulty, or personal preference. Users can create
 * public or private lists and manage their problem collections.
 * 
 * FUNCTIONS USED:
 * - mongoose.Schema(): MongoDB schema definition
 * - Schema.index(): Database indexing for performance
 * - Schema.pre('save'): Pre-save middleware for validation
 * - Schema.methods: Instance methods for list operations
 * - Schema.statics: Static methods for list queries
 * 
 * EXPORTS:
 * - CustomProblemList: Mongoose model for custom problem list operations
 * 
 * USED BY:
 * - routes/problems.js: Custom list CRUD operations
 * - routes/user.js: User's custom lists
 * - models/User.js: User's list references
 * - models/Problem.js: Problem references in lists
 * 
 * SCHEMA FIELDS:
 * - name: List name/title
 * - description: Optional list description
 * - userId: Reference to list owner/creator
 * - problems: Array of problem references
 * - isPublic: Visibility flag (public/private)
 * - tags: Optional categorization tags
 * - createdAt/updatedAt: Timestamps
 * 
 * INDEXES:
 * - userId: Fast lookup by user
 * - isPublic: Public/private filtering
 * - name: Text search on list names
 */

const mongoose = require('mongoose');

const CustomProblemListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  }],
  isPublic: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
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
CustomProblemListSchema.index({ userId: 1, isPublic: 1 });
CustomProblemListSchema.index({ isPublic: 1, createdAt: -1 });
CustomProblemListSchema.index({ userId: 1, name: 1 }, { unique: true });

// Text index for search functionality
CustomProblemListSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    tags: 5,
    description: 1
  },
  name: 'custom_list_text_index'
});

// Virtual for problem count
CustomProblemListSchema.virtual('problemCount').get(function() {
  return this.problems.length;
});

// Ensure virtual fields are serialized
CustomProblemListSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update timestamps
CustomProblemListSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get public lists
CustomProblemListSchema.statics.getPublicLists = function(limit = 10, skip = 0) {
  return this.find({ isPublic: true })
    .populate('userId', 'name username')
    .populate('problems', 'title slug difficulty tags')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user's lists
CustomProblemListSchema.statics.getUserLists = function(userId) {
  return this.find({ userId })
    .populate('problems', 'title slug difficulty tags')
    .sort({ createdAt: -1 });
};

// Instance method to add problem to list
CustomProblemListSchema.methods.addProblem = function(problemId) {
  if (!this.problems.includes(problemId)) {
    this.problems.push(problemId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove problem from list
CustomProblemListSchema.methods.removeProblem = function(problemId) {
  this.problems = this.problems.filter(
    id => id.toString() !== problemId.toString()
  );
  return this.save();
};

module.exports = mongoose.model('CustomProblemList', CustomProblemListSchema);
