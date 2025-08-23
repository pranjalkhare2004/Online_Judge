const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate, validatePasswordChange } = require('../middleware/validation');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { getUserStats, getUserContests } = require('../controllers/userController');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId)
      .select('-Password')
      .populate('solvedProblems.problemId', 'title difficulty')
      .populate({
        path: 'submissions',
        select: 'problemId status submittedAt executionTime',
        populate: {
          path: 'problemId',
          select: 'title difficulty'
        },
        options: { limit: 10, sort: { submittedAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const statistics = user.getStatistics();

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        Email: user.Email,
        FullName: user.FullName,
        name: user.FullName,
        email: user.Email,
        avatar: user.avatar,
        bio: user.bio,
        rating: user.rating,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        role: user.role,
        // Include streak and stats data
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastSolvedDate: user.lastSolvedDate,
        // Include arrays
        submissions: user.submissions || [],
        solvedProblems: user.solvedProblems || [],
        statistics,
        recentSubmissions: user.submissions
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, validateProfileUpdate, async (req, res) => {
  try {
    const { name, username, bio, avatar } = req.body;
    
    // Check if username is taken by another user
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }

    // Update user fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (username !== undefined) updateFields.username = username;
    if (bio !== undefined) updateFields.bio = bio;
    if (avatar !== undefined) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   POST /api/user/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Check if user has a password (not OAuth-only)
    if (!user.Password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for OAuth-only accounts'
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.Password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
});

// @route   GET /api/user/submissions
// @desc    Get user submissions
// @access  Private
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const userId = req.user._id || req.user.id;
    const filter = { userId: userId };
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add problem filter if provided
    if (req.query.problemId) {
      filter.problemId = req.query.problemId;
    }

    const submissions = await Submission.find(filter)
      .populate('problemId', 'title difficulty')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalSubmissions = await Submission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSubmissions / limit),
          totalSubmissions,
          hasNext: page * limit < totalSubmissions,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching submissions'
    });
  }
});

// @route   GET /api/user/statistics
// @desc    Get detailed user statistics
// @access  Private
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('solvedProblems.problemId', 'title difficulty tags');

    // Get submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly submission activity
    const monthlyActivity = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get language usage
    const languageStats = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const basicStats = user.getStatistics();

    res.json({
      success: true,
      data: {
        basic: basicStats,
        submissions: submissionStats,
        monthlyActivity,
        languages: languageStats,
        solvedProblems: user.solvedProblems
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

// @route   DELETE /api/user/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user._id);

    // If user has password, verify it
    if (user.Password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to deactivate account'
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect password'
        });
      }
    }

    // Deactivate instead of delete to preserve data integrity
    user.isActive = false;
    user.Email = `deleted_${Date.now()}_${user.Email}`;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating account'
    });
  }
});

// @route   GET /api/user/:id/stats
// @desc    Get comprehensive user statistics
// @access  Private (user can only access their own stats unless admin)
router.get('/:id/stats', authenticateToken, getUserStats);

// @route   POST /api/user/refresh-token
// @desc    Refresh JWT token (handles expired tokens)
// @access  Public
router.post('/refresh-token', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const { generateToken } = require('../middleware/auth');
    
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
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'online-judge-backend',
        audience: 'online-judge-frontend'
      });
    } catch (error) {
      // If token is expired, try to verify ignoring expiration
      if (error.name === 'TokenExpiredError') {
        decoded = jwt.verify(token, process.env.JWT_SECRET, {
          ignoreExpiration: true,
          issuer: 'online-judge-backend',
          audience: 'online-judge-frontend'
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

    // Generate new token using the same method as login
    const newToken = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        user: {
          id: user._id,
          name: user.FullName,
          email: user.Email,
          role: user.role,
          isActive: user.isActive
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

// @route   GET /api/user/:id/contests
// @desc    Get user contest participation history with pagination
// @access  Private (user can only access their own contest history unless admin)
router.get('/:id/contests', authenticateToken, getUserContests);

// @route   GET /api/user/solved-problems
// @desc    Get user's solved problems
// @access  Private
router.get('/solved-problems', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('solvedProblems')
      .populate('solvedProblems.problemId', 'title difficulty slug tags');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const solvedProblems = user.solvedProblems.map(solved => ({
      problem: {
        id: solved.problemId._id,
        title: solved.problemId.title,
        difficulty: solved.problemId.difficulty,
        slug: solved.problemId.slug,
        tags: solved.problemId.tags
      },
      solvedAt: solved.solvedAt,
      bestSubmission: solved.bestSubmission
    }));

    res.json({
      success: true,
      data: {
        solvedProblems,
        totalSolved: solvedProblems.length
      }
    });
  } catch (error) {
    console.error('Error fetching solved problems:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch solved problems'
    });
  }
});

module.exports = router;
