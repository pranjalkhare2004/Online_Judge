/**
 * NOTIFICATION MODEL SCHEMA
 * 
 * DESCRIPTION:
 * This file defines the MongoDB schema for user notifications in the Online Judge system.
 * It manages contest announcements, system notifications, and user-specific messages.
 * Handles notification creation, delivery tracking, and bulk notification operations.
 * Essential for keeping users informed about contests, updates, and platform changes.
 * 
 * FUNCTIONS USED:
 * - mongoose.Schema(): MongoDB schema definition
 * - Schema.pre('save'): Pre-save validation middleware
 * - Schema.methods.markAsRead(): Instance method to mark notification as read
 * - Schema.statics.createForAllUsers(): Static method for bulk notifications
 * - Schema.statics.getUnreadCount(): Get unread notification count
 * - Date.now(): Timestamp generation
 * 
 * EXPORTS:
 * - Notification: Mongoose model for notification operations
 * 
 * USED BY:
 * - routes/admin.js: Admin notification creation
 * - routes/user.js: User notification retrieval
 * - routes/contests.js: Contest notification generation
 * - controllers/notificationController.js: Notification management
 * - utils/notificationService.js: Notification utilities
 * - seedDatabase.js: Notification data seeding
 * 
 * SCHEMA FIELDS:
 * - userId: Reference to User model
 * - message: Notification message content
 * - type: Notification type (contest, system, admin, etc.)
 * - title: Notification title/subject
 * - data: Additional notification data (contest ID, etc.)
 * - read: Boolean indicating if notification was read
 * - priority: Notification priority (low, medium, high, urgent)
 * - expiresAt: Optional expiration date for notification
 * - createdAt: Timestamp when notification was created
 * - readAt: Timestamp when notification was read
 * - category: Notification category for filtering
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true // Index for efficient user-specific queries
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: ['contest', 'system', 'admin', 'submission', 'achievement', 'reminder'],
      message: 'Type must be one of: contest, system, admin, submission, achievement, reminder'
    },
    index: true
  },
  category: {
    type: String,
    enum: {
      values: ['announcement', 'update', 'warning', 'info', 'success', 'error'],
      message: 'Category must be one of: announcement, update, warning, info, success, error'
    },
    default: 'info'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true // Index for efficient unread queries
  },
  readAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 }); // User notifications by date
notificationSchema.index({ userId: 1, read: 1 }); // Unread notifications
notificationSchema.index({ type: 1, createdAt: -1 }); // Notifications by type
notificationSchema.index({ createdAt: -1 }); // All notifications by date

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set readAt timestamp when marking as read
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  
  // Validate expiration date
  if (this.expiresAt && this.expiresAt <= new Date()) {
    return next(new Error('Expiration date must be in the future'));
  }
  
  next();
});

// Instance Methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt <= new Date();
};

// Static Methods
notificationSchema.statics.createForAllUsers = async function(notificationData) {
  const User = mongoose.model('User');
  const users = await User.find({ isActive: true }, '_id');
  
  const notifications = users.map(user => ({
    ...notificationData,
    userId: user._id
  }));
  
  return this.insertMany(notifications);
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, read: false });
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    unreadOnly = false
  } = options;
  
  const filter = { userId };
  if (type) filter.type = type;
  if (unreadOnly) filter.read = false;
  
  const skip = (page - 1) * limit;
  
  const [notifications, total] = await Promise.all([
    this.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(filter)
  ]);
  
  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

notificationSchema.statics.markAllAsRead = async function(userId, type = null) {
  const filter = { userId, read: false };
  if (type) filter.type = type;
  
  return this.updateMany(filter, { 
    read: true, 
    readAt: new Date() 
  });
};

notificationSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lte: new Date() }
  });
  return result.deletedCount;
};

// Indexes for performance
notificationSchema.index({ 
  userId: 1, 
  type: 1, 
  read: 1, 
  createdAt: -1 
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
