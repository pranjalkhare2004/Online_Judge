/**
 * REFRESH TOKEN MODEL
 * 
 * DESCRIPTION:
 * This model handles refresh tokens for enhanced JWT security.
 * Refresh tokens are longer-lived tokens used to generate new access tokens
 * without requiring the user to log in again.
 * 
 * SECURITY FEATURES:
 * - Separate refresh token storage
 * - Token rotation on refresh
 * - Automatic expiration
 * - User-specific token management
 * - Token revocation capability
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const RefreshTokenSchema = new mongoose.Schema({
  // Token value (hashed for security)
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User who owns this token
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Token expiration date
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // When token was created
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // When token was last used
  lastUsedAt: {
    type: Date,
    default: Date.now
  },
  
  // Device/browser information for security
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    fingerprint: String
  },
  
  // Token status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Revocation information
  revokedAt: {
    type: Date
  },
  
  revokedReason: {
    type: String,
    enum: ['logout', 'security', 'expired', 'replaced']
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user's active tokens
RefreshTokenSchema.index({ userId: 1, isActive: 1 });

// Static method to generate a new refresh token
RefreshTokenSchema.statics.generateToken = function(userId, deviceInfo = {}) {
  // Generate a cryptographically secure random token
  const tokenValue = crypto.randomBytes(64).toString('hex');
  
  // Hash the token for storage (never store plain tokens)
  const hashedToken = crypto.createHash('sha256').update(tokenValue).digest('hex');
  
  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  const refreshToken = new this({
    token: hashedToken,
    userId,
    expiresAt,
    deviceInfo
  });
  
  // Return both the plain token (to send to client) and the model instance
  return {
    token: tokenValue,
    model: refreshToken
  };
};

// Static method to find and validate a refresh token
RefreshTokenSchema.statics.findByToken = async function(tokenValue) {
  // Hash the provided token to match stored hash
  const hashedToken = crypto.createHash('sha256').update(tokenValue).digest('hex');
  
  const refreshToken = await this.findOne({
    token: hashedToken,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
  
  if (refreshToken) {
    // Update last used timestamp
    refreshToken.lastUsedAt = new Date();
    await refreshToken.save();
  }
  
  return refreshToken;
};

// Instance method to revoke a token
RefreshTokenSchema.methods.revoke = async function(reason = 'logout') {
  this.isActive = false;
  this.revokedAt = new Date();
  this.revokedReason = reason;
  await this.save();
};

// Static method to revoke all tokens for a user
RefreshTokenSchema.statics.revokeAllForUser = async function(userId, reason = 'security') {
  await this.updateMany(
    { userId, isActive: true },
    {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason
    }
  );
};

// Static method to cleanup expired tokens (called periodically)
RefreshTokenSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isActive: false, revokedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Remove revoked tokens after 7 days
    ]
  });
  
  console.log(`Cleaned up ${result.deletedCount} expired/revoked refresh tokens`);
  return result.deletedCount;
};

// Virtual for checking if token is expired
RefreshTokenSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Virtual for checking if token is valid
RefreshTokenSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired;
});

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

module.exports = RefreshToken;
