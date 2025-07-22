const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('solvedProblems.problemId', 'title difficulty points category');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    next(new AppError('Failed to fetch user profile', 500));
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['firstname', 'lastname', 'bio', 'institution', 'country', 'programmingLanguages', 'skillLevel'];
    const updates = {};

    // Filter allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields provided for update', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    logger.info(`User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Failed to update profile', 500));
  }
};

// @desc    Get all users with pagination and filtering
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      isActive,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    
    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: users.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    next(new AppError('Failed to fetch users', 500));
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password')
      .populate('solvedProblems.problemId', 'title difficulty points category');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if requesting user can access this profile
    if (req.user.role !== 'admin' && req.user.id !== id) {
      // Return limited public information
      const publicUser = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        avatar: user.avatar,
        institution: user.institution,
        country: user.country,
        statistics: user.statistics,
        skillLevel: user.skillLevel,
        createdAt: user.createdAt
      };

      return res.status(200).json({
        success: true,
        data: publicUser
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    next(new AppError('Failed to fetch user', 500));
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'firstname', 'lastname', 'email', 'role', 'isActive', 'isVerified',
      'bio', 'institution', 'country', 'programmingLanguages', 'skillLevel'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields provided for update', 400));
    }

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    logger.info(`User updated by admin: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    logger.error('Update user error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new AppError(`User already exists with this ${field}`, 400));
    }
    
    next(new AppError('Failed to update user', 500));
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return next(new AppError('You cannot delete your own account', 400));
    }

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Soft delete - deactivate user instead of actually deleting
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info(`User soft deleted by admin: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    next(new AppError('Failed to delete user', 500));
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('statistics solvedProblems');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Get detailed submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get problem difficulty distribution
    const difficultyStats = await Problem.aggregate([
      { 
        $match: { 
          _id: { $in: user.solvedProblems.map(sp => sp.problemId) }
        }
      },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent submissions
    const recentSubmissions = await Submission.find({ user: user._id })
      .populate('problem', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        userStats: user.statistics,
        submissionStats,
        difficultyStats,
        recentSubmissions,
        solvedProblems: user.solvedProblems.length
      }
    });

  } catch (error) {
    logger.error('Get user stats error:', error);
    next(new AppError('Failed to fetch user statistics', 500));
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      timeframe = 'all', // all, weekly, monthly
      category = 'points' // points, problems, contests
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build sort criteria based on category
    let sortCriteria;
    switch (category) {
      case 'problems':
        sortCriteria = { 'statistics.problemsSolved': -1, 'statistics.totalPoints': -1 };
        break;
      case 'contests':
        sortCriteria = { 'statistics.contestsParticipated': -1, 'statistics.totalPoints': -1 };
        break;
      default:
        sortCriteria = { 'statistics.totalPoints': -1, 'statistics.acceptedSubmissions': -1 };
    }

    // Apply timeframe filter if needed
    let matchCriteria = { isActive: true };
    
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      
      if (timeframe === 'weekly') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'monthly') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (startDate) {
        matchCriteria.lastActiveAt = { $gte: startDate };
      }
    }

    const [users, total] = await Promise.all([
      User.find(matchCriteria)
        .select('firstname lastname username avatar institution country statistics createdAt')
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(matchCriteria)
    ]);

    // Add rank to each user
    const rankedUsers = users.map((user, index) => ({
      ...user.toObject(),
      rank: skip + index + 1
    }));

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        leaderboard: rankedUsers,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: users.length,
          totalCount: total
        },
        filters: {
          timeframe,
          category
        }
      }
    });

  } catch (error) {
    logger.error('Get leaderboard error:', error);
    next(new AppError('Failed to fetch leaderboard', 500));
  }
};

// @desc    Get user's solved problems
// @route   GET /api/users/:id/solved-problems
// @access  Private
exports.getUserSolvedProblems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, difficulty, category } = req.query;

    const user = await User.findById(id).populate({
      path: 'solvedProblems.problemId',
      select: 'title slug difficulty category points statistics',
      match: {
        ...(difficulty && { difficulty }),
        ...(category && { category })
      }
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Filter out null problems (from match conditions)
    const filteredProblems = user.solvedProblems.filter(sp => sp.problemId);

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedProblems = filteredProblems.slice(skip, skip + parseInt(limit));
    const total = filteredProblems.length;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        solvedProblems: paginatedProblems,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: paginatedProblems.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    logger.error('Get user solved problems error:', error);
    next(new AppError('Failed to fetch user solved problems', 500));
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return next(new AppError('Search query must be at least 2 characters long', 400));
    }

    const users = await User.find({
      isActive: true,
      $or: [
        { firstname: { $regex: q, $options: 'i' } },
        { lastname: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('firstname lastname username avatar institution statistics.totalPoints')
    .limit(parseInt(limit))
    .sort({ 'statistics.totalPoints': -1 });

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    logger.error('Search users error:', error);
    next(new AppError('Failed to search users', 500));
  }
};

// @desc    Get user submissions
// @route   GET /api/users/:id/submissions
// @access  Public
exports.getUserSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { userId: id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.language) {
      filter.language = req.query.language;
    }

    // Get submissions with pagination
    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('problemId', 'title difficulty category')
        .sort({ submittedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Submission.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        submissions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubmissions: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get user submissions error:', error);
    next(new AppError('Failed to fetch user submissions', 500));
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
exports.toggleFollow = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId === id) {
      return next(new AppError('You cannot follow yourself', 400));
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(id)
    ]);

    if (!targetUser) {
      return next(new AppError('User not found', 404));
    }

    // Check if already following
    const isFollowing = currentUser.following && currentUser.following.includes(id);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(followId => followId.toString() !== id);
      targetUser.followers = targetUser.followers.filter(followerId => followerId.toString() !== currentUserId);
    } else {
      // Follow
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];
      
      currentUser.following.push(id);
      targetUser.followers.push(currentUserId);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.status(200).json({
      success: true,
      message: isFollowing ? 'User unfollowed successfully' : 'User followed successfully',
      data: {
        isFollowing: !isFollowing,
        followersCount: targetUser.followers.length
      }
    });

  } catch (error) {
    logger.error('Toggle follow error:', error);
    next(new AppError('Failed to update follow status', 500));
  }
};
