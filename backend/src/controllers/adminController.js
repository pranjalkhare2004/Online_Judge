const User = require('../models/User');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const Contest = require('../models/Contest');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.search) {
      filter.$or = [
        { firstname: { $regex: req.query.search, $options: 'i' } },
        { lastname: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    // Build sort object
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get all users error:', error);
    next(new AppError('Failed to fetch users', 500));
  }
};

// @desc    Get user by ID (admin)
// @route   GET /api/admin/users/:id
// @access  Private (admin)
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return next(new AppError('User not found', 404));
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

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Private (admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update fields
    if (firstname !== undefined) user.firstname = firstname;
    if (lastname !== undefined) user.lastname = lastname;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    logger.error('Update user error:', error);
    next(new AppError('Failed to update user', 500));
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    logger.error('Delete user error:', error);
    next(new AppError('Failed to delete user', 500));
  }
};

// Stub methods for missing admin functions
exports.getAllProblems = async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'Not implemented yet' });
};

exports.toggleProblemStatus = async (req, res) => {
  res.status(200).json({ success: true, message: 'Not implemented yet' });
};

exports.getAllSubmissions = async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'Not implemented yet' });
};

exports.rejudgeSubmission = async (req, res) => {
  res.status(200).json({ success: true, message: 'Not implemented yet' });
};

exports.getAllContests = async (req, res) => {
  res.status(200).json({ success: true, data: [], message: 'Not implemented yet' });
};

exports.getSystemHealth = async (req, res) => {
  res.status(200).json({ success: true, data: { status: 'healthy' }, message: 'Not implemented yet' });
};

exports.getAnalyticsOverview = async (req, res) => {
  res.status(200).json({ success: true, data: {}, message: 'Not implemented yet' });
};

exports.getSubmissionAnalytics = async (req, res) => {
  res.status(200).json({ success: true, data: {}, message: 'Not implemented yet' });
};

exports.getUserAnalytics = async (req, res) => {
  res.status(200).json({ success: true, data: {}, message: 'Not implemented yet' });
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboard = async (req, res, next) => {
  try {
    // Get basic counts
    const [
      totalUsers,
      totalProblems,
      totalSubmissions,
      totalContests,
      activeUsers,
      publishedProblems,
      acceptedSubmissions
    ] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Submission.countDocuments(),
      Contest.countDocuments(),
      User.countDocuments({ isActive: true }),
      Problem.countDocuments({ status: 'published' }),
      Submission.countDocuments({ status: 'accepted' })
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstname lastname email createdAt');

    const recentProblems = await Problem.find()
      .populate('author', 'firstname lastname')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title difficulty status createdAt author');

    const recentSubmissions = await Submission.find()
      .populate('user', 'firstname lastname')
      .populate('problem', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status language createdAt user problem');

    // Get user growth data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get submission statistics by status
    const submissionStats = await Submission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get problem difficulty distribution
    const problemDifficultyStats = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top performers
    const topPerformers = await User.find({ isActive: true })
      .sort({ 'statistics.totalPoints': -1 })
      .limit(5)
      .select('firstname lastname statistics.totalPoints statistics.acceptedSubmissions');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProblems,
          totalSubmissions,
          totalContests,
          activeUsers,
          publishedProblems,
          acceptedSubmissions,
          acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0
        },
        recent: {
          users: recentUsers,
          problems: recentProblems,
          submissions: recentSubmissions
        },
        analytics: {
          userGrowth,
          submissionStats,
          problemDifficultyStats,
          topPerformers
        }
      }
    });

  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    next(new AppError('Failed to fetch dashboard data', 500));
  }
};

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getSystemStats = async (req, res, next) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // User statistics
    const userStats = await User.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          active: [{ $match: { isActive: true } }, { $count: "count" }],
          verified: [{ $match: { isVerified: true } }, { $count: "count" }],
          byRole: [
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 }
              }
            }
          ],
          growth: [
            {
              $match: { createdAt: { $gte: startDate } }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    // Problem statistics
    const problemStats = await Problem.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          published: [{ $match: { status: 'published' } }, { $count: "count" }],
          byDifficulty: [
            {
              $group: {
                _id: '$difficulty',
                count: { $sum: 1 }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                count: { $sum: 1 }
              }
            }
          ],
          avgAcceptanceRate: [
            {
              $group: {
                _id: null,
                avgRate: {
                  $avg: {
                    $cond: [
                      { $eq: ['$statistics.totalSubmissions', 0] },
                      0,
                      {
                        $multiply: [
                          { $divide: ['$statistics.acceptedSubmissions', '$statistics.totalSubmissions'] },
                          100
                        ]
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    // Submission statistics
    const submissionStats = await Submission.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          recent: [
            { $match: { createdAt: { $gte: startDate } } },
            { $count: "count" }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          byLanguage: [
            {
              $group: {
                _id: '$language',
                count: { $sum: 1 }
              }
            }
          ],
          timeline: [
            {
              $match: { createdAt: { $gte: startDate } }
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                total: { $sum: 1 },
                accepted: {
                  $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
                }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    // Server performance metrics (placeholder - implement based on your monitoring)
    const performanceStats = {
      averageResponseTime: 150, // ms
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };

    res.status(200).json({
      success: true,
      data: {
        timeframe,
        users: userStats[0],
        problems: problemStats[0],
        submissions: submissionStats[0],
        performance: performanceStats
      }
    });

  } catch (error) {
    logger.error('Get system stats error:', error);
    next(new AppError('Failed to fetch system statistics', 500));
  }
};

// @desc    Manage user (activate/deactivate/change role)
// @route   PUT /api/admin/users/:id/manage
// @access  Private (Admin only)
exports.manageUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Prevent admin from managing themselves
    if (req.user.id === id) {
      return next(new AppError('You cannot manage your own account', 400));
    }

    switch (action) {
      case 'activate':
        user.isActive = true;
        break;
      case 'deactivate':
        user.isActive = false;
        break;
      case 'verify':
        user.isVerified = true;
        break;
      case 'unverify':
        user.isVerified = false;
        break;
      case 'changeRole':
        if (!role || !['user', 'admin', 'moderator'].includes(role)) {
          return next(new AppError('Invalid role specified', 400));
        }
        user.role = role;
        break;
      case 'resetPassword':
        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        user.password = tempPassword;
        // TODO: Send email with temporary password
        break;
      default:
        return next(new AppError('Invalid action specified', 400));
    }

    await user.save();

    logger.info(`User ${action} action performed on ${user.email} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `User ${action} successful`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          isActive: user.isActive,
          isVerified: user.isVerified,
          role: user.role
        }
      }
    });

  } catch (error) {
    logger.error('Manage user error:', error);
    next(new AppError('Failed to manage user', 500));
  }
};

// @desc    Bulk manage users
// @route   PUT /api/admin/users/bulk-manage
// @access  Private (Admin only)
exports.bulkManageUsers = async (req, res, next) => {
  try {
    const { userIds, action, role } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new AppError('Please provide valid user IDs', 400));
    }

    // Prevent admin from including themselves
    if (userIds.includes(req.user.id)) {
      return next(new AppError('You cannot include your own account in bulk operations', 400));
    }

    const updateQuery = {};

    switch (action) {
      case 'activate':
        updateQuery.isActive = true;
        break;
      case 'deactivate':
        updateQuery.isActive = false;
        break;
      case 'verify':
        updateQuery.isVerified = true;
        break;
      case 'unverify':
        updateQuery.isVerified = false;
        break;
      case 'changeRole':
        if (!role || !['user', 'admin', 'moderator'].includes(role)) {
          return next(new AppError('Invalid role specified', 400));
        }
        updateQuery.role = role;
        break;
      default:
        return next(new AppError('Invalid action specified', 400));
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateQuery
    );

    logger.info(`Bulk ${action} performed on ${result.modifiedCount} users by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      }
    });

  } catch (error) {
    logger.error('Bulk manage users error:', error);
    next(new AppError('Failed to perform bulk operation', 500));
  }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
exports.getSystemLogs = async (req, res, next) => {
  try {
    const {
      level = 'all',
      page = 1,
      limit = 100,
      startDate,
      endDate
    } = req.query;

    // This is a placeholder - implement based on your logging system
    // You might want to read from log files or a logging database

    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'User logged in',
        meta: { userId: '123', ip: '192.168.1.1' }
      },
      {
        timestamp: new Date(),
        level: 'error',
        message: 'Database connection failed',
        meta: { error: 'Connection timeout' }
      }
      // Add more log entries
    ];

    // Filter logs based on criteria
    let filteredLogs = logs;

    if (level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= new Date(startDate));
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= new Date(endDate));
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedLogs = filteredLogs.slice(skip, skip + parseInt(limit));
    const total = filteredLogs.length;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        logs: paginatedLogs,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: paginatedLogs.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    logger.error('Get system logs error:', error);
    next(new AppError('Failed to fetch system logs', 500));
  }
};

// @desc    Get database backup status
// @route   GET /api/admin/backup
// @access  Private (Admin only)
exports.getBackupStatus = async (req, res, next) => {
  try {
    // This is a placeholder - implement based on your backup system
    const backupStatus = {
      lastBackup: new Date(),
      nextScheduledBackup: new Date(Date.now() + 24 * 60 * 60 * 1000),
      backupSize: '2.5 GB',
      status: 'completed',
      retentionPeriod: '30 days',
      backupLocation: 'AWS S3',
      autoBackupEnabled: true
    };

    res.status(200).json({
      success: true,
      data: backupStatus
    });

  } catch (error) {
    logger.error('Get backup status error:', error);
    next(new AppError('Failed to fetch backup status', 500));
  }
};

// @desc    Create manual backup
// @route   POST /api/admin/backup
// @access  Private (Admin only)
exports.createBackup = async (req, res, next) => {
  try {
    // This is a placeholder - implement your backup logic
    logger.info(`Manual backup initiated by admin ${req.user.email}`);

    // Simulate backup process
    setTimeout(() => {
      logger.info('Manual backup completed');
    }, 5000);

    res.status(200).json({
      success: true,
      message: 'Backup initiated successfully',
      data: {
        backupId: `backup_${Date.now()}`,
        status: 'in_progress',
        initiatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Create backup error:', error);
    next(new AppError('Failed to initiate backup', 500));
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
exports.updateSystemSettings = async (req, res, next) => {
  try {
    const {
      maintenanceMode,
      registrationEnabled,
      submissionEnabled,
      maxSubmissionsPerHour,
      contestCreationEnabled
    } = req.body;

    // This is a placeholder - implement based on your settings storage
    const settings = {
      maintenanceMode: maintenanceMode || false,
      registrationEnabled: registrationEnabled !== false,
      submissionEnabled: submissionEnabled !== false,
      maxSubmissionsPerHour: maxSubmissionsPerHour || 100,
      contestCreationEnabled: contestCreationEnabled !== false,
      updatedAt: new Date(),
      updatedBy: req.user.id
    };

    logger.info(`System settings updated by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings
    });

  } catch (error) {
    logger.error('Update system settings error:', error);
    next(new AppError('Failed to update system settings', 500));
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit
// @access  Private (Admin only)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      userId,
      startDate,
      endDate
    } = req.query;

    // This is a placeholder - implement based on your audit logging system
    const auditLogs = [
      {
        id: '1',
        timestamp: new Date(),
        action: 'user_created',
        userId: '123',
        adminId: req.user.id,
        details: { email: 'user@example.com' },
        ipAddress: '192.168.1.1'
      }
      // Add more audit entries
    ];

    const skip = (page - 1) * limit;
    const paginatedLogs = auditLogs.slice(skip, skip + parseInt(limit));
    const total = auditLogs.length;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        auditLogs: paginatedLogs,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: paginatedLogs.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    logger.error('Get audit logs error:', error);
    next(new AppError('Failed to fetch audit logs', 500));
  }
};
