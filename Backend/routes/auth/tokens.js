const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiting for token operations
router.use(rateLimit({
  windowMs: process.env.NODE_ENV === 'test' ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 minute for tests, 15 minutes for production
  max: process.env.NODE_ENV === 'test' ? 1000 : 20, // 1000 for tests, 20 for production
  message: 'Too many token requests, please try again later.'
}));

// Verify token endpoint
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }
    
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          role: user.role,
          solvedProblems: user.solvedProblems.length,
          totalSubmissions: user.totalSubmissions,
          successfulSubmissions: user.successfulSubmissions
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Find and validate refresh token
    const tokenRecord = await RefreshToken.findByToken(refreshToken);
    
    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    const user = tokenRecord.userId;
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or account deactivated'
      });
    }

    // Get device info for new refresh token
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
      fingerprint: req.headers['x-fingerprint'] || req.headers['x-device-id']
    };

    // Revoke old refresh token (token rotation)
    await tokenRecord.revoke('replaced');

    // Generate new token pair
    const tokens = await user.generateTokenPair(deviceInfo);

    console.log(`🔄 Token refreshed for user: ${user.Email}`);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresIn: tokens.accessTokenExpiresIn,
        refreshTokenExpiresIn: tokens.refreshTokenExpiresIn,
        user: {
          id: user._id,
          name: user.FullName,
          email: user.Email,
          username: user.username,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Legacy refresh endpoint (for backward compatibility)
router.post('/refresh-legacy', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required for refresh'
      });
    }

    // Verify existing token (even if expired)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // If token is expired, try to verify ignoring expiration
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          ignoreExpiration: true
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
    }

    // Get user from decoded token
    const user = await User.findById(decoded.id).select('-Password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or account deactivated'
      });
    }

    // Generate new token with consistent payload structure
    const newToken = jwt.sign(
      {
        id: user._id,
        userId: user._id,
        UserId: user.UserId,
        Email: user.Email,
        FullName: user.FullName,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE_TIME || '24h',
        issuer: 'online-judge-backend',
        audience: 'online-judge-frontend'
      }
    );
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: user._id,
          UserId: user.UserId,
          FullName: user.FullName,
          Email: user.Email,
          role: user.role,
          rating: user.rating || 1200,
          isVerified: user.isVerified || false
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Get user profile from token
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('solvedProblems', 'title difficulty slug');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          rating: user.rating,
          isVerified: user.isVerified,
          role: user.role,
          bio: user.bio,
          location: user.location,
          website: user.website,
          githubProfile: user.githubProfile,
          solvedProblems: user.solvedProblems,
          totalSubmissions: user.totalSubmissions,
          successfulSubmissions: user.successfulSubmissions,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Revoke refresh token endpoint
router.post('/revoke', async (req, res) => {
  try {
    const { refreshToken, revokeAll = false } = req.body;

    if (!refreshToken && !revokeAll) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required or set revokeAll to true'
      });
    }

    if (revokeAll) {
      // Revoke all tokens for the user (requires authentication)
      const authHeader = req.headers['authorization'];
      const accessToken = authHeader && authHeader.split(' ')[1];
      
      if (!accessToken) {
        return res.status(401).json({
          success: false,
          message: 'Access token required for revokeAll operation'
        });
      }

      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      await RefreshToken.revokeAllForUser(decoded.id, 'logout');

      console.log(`🔐 All tokens revoked for user: ${decoded.Email}`);

      return res.json({
        success: true,
        message: 'All refresh tokens revoked successfully'
      });
    } else {
      // Revoke specific token
      const tokenRecord = await RefreshToken.findByToken(refreshToken);
      
      if (!tokenRecord) {
        return res.status(404).json({
          success: false,
          message: 'Refresh token not found or already revoked'
        });
      }

      await tokenRecord.revoke('logout');

      console.log(`🔐 Refresh token revoked for user: ${tokenRecord.userId.Email}`);

      return res.json({
        success: true,
        message: 'Refresh token revoked successfully'
      });
    }

  } catch (error) {
    console.error('Token revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token revocation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get active refresh tokens for user (authenticated)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeTokens = await RefreshToken.find({
      userId: req.user.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).select('createdAt lastUsedAt deviceInfo expiresAt').sort({ lastUsedAt: -1 });

    res.json({
      success: true,
      data: {
        activeTokens: activeTokens.map(token => ({
          id: token._id,
          createdAt: token.createdAt,
          lastUsedAt: token.lastUsedAt,
          expiresAt: token.expiresAt,
          deviceInfo: {
            userAgent: token.deviceInfo?.userAgent,
            ipAddress: token.deviceInfo?.ipAddress
          }
        }))
      }
    });

  } catch (error) {
    console.error('Active tokens fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active tokens',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
