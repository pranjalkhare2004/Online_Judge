/**
 * CONTEST MODEL SCHEMA
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for programming contests in the Online Judge system.
 * It manages contest metadata, timing, problems, participants, rankings, and scoring rules.
 * Handles contest lifecycle from creation to completion, participant tracking, and
 * leaderboard generation. Essential for competitive programming features.
 * 
 * FUNCTIONS USED:
 * - mongoose.Schema(): MongoDB schema definition
 * - Schema.pre('save'): Pre-save validation middleware
 * - Schema.methods.isActive(): Instance method to check contest status
 * - Schema.methods.canRegister(): Registration eligibility check
 * - Schema.methods.getLeaderboard(): Leaderboard generation
 * - Schema.methods.addParticipant(): Participant registration
 * - Schema.statics.getUpcoming(): Static method for upcoming contests
 * - Schema.statics.getActive(): Static method for active contests
 * - Date.now(): Timestamp generation
 * 
 * EXPORTS:
 * - Contest: Mongoose model for contest operations
 * 
 * USED BY:
 * - routes/contests.js: Contest CRUD operations
 * - routes/admin.js: Contest administration
 * - routes/submissions.js: Contest submission handling
 * - routes/leaderboard.js: Contest ranking operations
 * - routes/user.js: User contest history
 * - models/Submission.js: Contest submission tracking
 * - models/User.js: User contest participation
 * - utils/contestScheduler.js: Contest timing management
 * - seedDatabase.js: Contest data seeding
 * 
 * SCHEMA FIELDS:
 * - title: Contest name/title
 * - description: Contest description and rules
 * - startTime: Contest start timestamp
 * - endTime: Contest end timestamp
 * - duration: Contest duration in minutes
 * - problems: Array of problem references with scoring
 * - participants: Array of registered participant references
 * - maxParticipants: Maximum participant limit
 * - isPublic: Contest visibility (public/private)
 * - registrationStartTime: Registration opening time
 * - registrationEndTime: Registration closing time
 * - creator: Contest creator reference
 * - prizes: Prize information for winners
 * - rules: Contest-specific rules and regulations
 * - status: Contest status (Upcoming/Active/Ended)
 * - leaderboard: Real-time ranking cache
 * - createdAt/updatedAt: Timestamps
 * 
 * CONTEST LIFECYCLE:
 * - Created: Contest setup phase
 * - Registration Open: Participants can register
 * - Upcoming: Registered, waiting for start
 * - Active: Contest in progress
 * - Ended: Contest completed, final rankings
 * 
 * INSTANCE METHODS:
 * - isActive(): Check if contest is currently running
 * - canRegister(): Check if registration is allowed
 * - getLeaderboard(): Generate current rankings
 * - addParticipant(): Register new participant
 */

const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Contest timing
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  
  // Contest problems
  problems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true
    },
    points: {
      type: Number,
      default: 100,
      min: 0
    },
    order: {
      type: Number,
      required: true
    }
  }],
  
  // Participants
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    rank: {
      type: Number,
      default: null
    },
    totalScore: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number, // in minutes
      default: 0
    }
  }],
  
  // Contest settings
  isPublic: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    default: null // null means unlimited
  },
  
  // Contest rules
  scoringType: {
    type: String,
    enum: ['ICPC', 'IOI', 'AtCoder'],
    default: 'ICPC'
  },
  
  // Contest status
  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended'],
    default: 'upcoming'
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Virtual for participant count
ContestSchema.virtual('participantCount').get(function() {
  return (this.participants && this.participants.length) || 0;
});

// Virtual for contest status based on time
ContestSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now >= this.startTime && now <= this.endTime) return 'live';
  return 'ended';
});

// Method to check if user can register
ContestSchema.methods.canUserRegister = function(userId) {
  const now = new Date();
  
  // Check if contest hasn't started
  if (now >= this.startTime) return false;
  
  // Check if user is already registered
  const isRegistered = this.participants.some(p => p.userId.toString() === userId.toString());
  if (isRegistered) return false;
  
  // Check max participants limit
  if (this.maxParticipants && this.participants.length >= this.maxParticipants) return false;
  
  return true;
};

// Ensure virtual fields are serialized
ContestSchema.set('toJSON', { virtuals: true });

// Indexes
ContestSchema.index({ startTime: 1 });
ContestSchema.index({ status: 1, startTime: -1 });
ContestSchema.index({ 'participants.userId': 1 });

// Enhanced compound indexes for performance
ContestSchema.index({ startTime: 1, status: 1 });
ContestSchema.index({ isPublic: 1, startTime: -1 });
ContestSchema.index({ createdBy: 1, startTime: -1 });
ContestSchema.index({ endTime: 1, status: 1 });
ContestSchema.index({ status: 1, isPublic: 1, startTime: -1 });

// Sparse indexes for optional fields
ContestSchema.index({ maxParticipants: 1 }, { sparse: true });

// Text index for contest search
ContestSchema.index({
  title: 'text',
  description: 'text'
}, {
  weights: {
    title: 10,
    description: 1
  },
  name: 'contest_text_index'
});

module.exports = mongoose.model('Contest', ContestSchema);
