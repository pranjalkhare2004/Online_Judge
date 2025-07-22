const Problem = require('../models/Problem');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all problems with filtering and pagination
// @route   GET /api/problems
// @access  Public
exports.getAllProblems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      difficulty,
      category,
      tags,
      search,
      status = 'published',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isPublic: true, isActive: true };
    
    // Admin can see all problems (including private ones)
    if (req.user && req.user.role === 'admin') {
      delete query.isPublic;
    }
    
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const [problems, total] = await Promise.all([
      Problem.find(query)
        .populate('author', 'firstname lastname username')
        .select('-testCases') // Hide test cases for security
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Problem.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        problems,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: problems.length,
          totalCount: total
        }
      }
    });

  } catch (error) {
    logger.error('Get all problems error:', error);
    next(new AppError('Failed to fetch problems', 500));
  }
};

// @desc    Get problem by ID or slug
// @route   GET /api/problems/:identifier
// @access  Public
exports.getProblemById = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by slug
    let query = {};
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: identifier };
    } else {
      query = { slug: identifier };
    }

    // Add visibility conditions
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'published';
      query.isPublic = true;
    }

    const problem = await Problem.findOne(query)
      .populate('author', 'firstname lastname username')
      .populate('moderators', 'firstname lastname username');

    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Hide test cases from non-admin users
    if (!req.user || req.user.role !== 'admin') {
      problem.testCases = undefined;
    }

    // Check if user has solved this problem
    let userSolution = null;
    if (req.user) {
      const user = await User.findById(req.user.id);
      userSolution = user.solvedProblems.find(
        sp => sp.problemId.toString() === problem._id.toString()
      );
    }

    res.status(200).json({
      success: true,
      data: {
        problem,
        userSolution: userSolution || null
      }
    });

  } catch (error) {
    logger.error('Get problem by ID error:', error);
    next(new AppError('Failed to fetch problem', 500));
  }
};

// @desc    Create new problem
// @route   POST /api/problems
// @access  Private (Admin/Moderator)
exports.createProblem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      difficulty,
      category,
      tags,
      points,
      timeLimit,
      memoryLimit,
      sampleInput,
      sampleOutput,
      constraints,
      examples,
      testCases,
      hints,
      status = 'draft'
    } = req.body;

    // Validation
    if (!title || !description || !difficulty || !category || !points || !timeLimit || !memoryLimit) {
      return next(new AppError('Please provide all required fields', 400));
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const existingProblem = await Problem.findOne({ slug });
    if (existingProblem) {
      return next(new AppError('Problem with similar title already exists', 400));
    }

    const problem = await Problem.create({
      title,
      slug,
      description,
      difficulty,
      category,
      tags: tags || [],
      points,
      timeLimit,
      memoryLimit,
      sampleInput,
      sampleOutput,
      constraints,
      examples: examples || [],
      testCases: testCases || [],
      hints: hints || [],
      status,
      author: req.user.id,
      isPublic: status === 'published'
    });

    logger.info(`New problem created: ${problem.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem
    });

  } catch (error) {
    logger.error('Create problem error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    if (error.code === 11000) {
      return next(new AppError('Problem with this title already exists', 400));
    }
    
    next(new AppError('Failed to create problem', 500));
  }
};

// @desc    Update problem
// @route   PUT /api/problems/:id
// @access  Private (Admin/Author/Moderator)
exports.updateProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const problem = await Problem.findById(id);
    
    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Check permissions
    const isAuthor = problem.author.toString() === req.user.id;
    const isModerator = problem.moderators.includes(req.user.id);
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isModerator && !isAdmin) {
      return next(new AppError('Not authorized to update this problem', 403));
    }

    const allowedFields = [
      'title', 'description', 'difficulty', 'category', 'tags', 'points',
      'timeLimit', 'memoryLimit', 'sampleInput', 'sampleOutput',
      'constraints', 'examples', 'testCases', 'hints', 'status', 'isPublic'
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

    // Update slug if title changed
    if (updates.title && updates.title !== problem.title) {
      updates.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Add modification history
    updates.modificationHistory = [
      ...problem.modificationHistory,
      {
        modifiedBy: req.user.id,
        modifiedAt: new Date(),
        changes: Object.keys(updates).join(', ')
      }
    ];

    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'firstname lastname username');

    logger.info(`Problem updated: ${updatedProblem.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: updatedProblem
    });

  } catch (error) {
    logger.error('Update problem error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Failed to update problem', 500));
  }
};

// @desc    Delete problem
// @route   DELETE /api/problems/:id
// @access  Private (Admin only)
exports.deleteProblem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const problem = await Problem.findById(id);
    
    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Check if problem has submissions
    const submissionCount = await Submission.countDocuments({ problem: id });
    
    if (submissionCount > 0) {
      // Soft delete - archive instead of deleting
      problem.status = 'archived';
      problem.isPublic = false;
      await problem.save();
      
      logger.info(`Problem archived: ${problem.title} by ${req.user.email}`);
      
      return res.status(200).json({
        success: true,
        message: 'Problem archived successfully (has existing submissions)'
      });
    }

    // Hard delete if no submissions
    await Problem.findByIdAndDelete(id);
    
    logger.info(`Problem deleted: ${problem.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully'
    });

  } catch (error) {
    logger.error('Delete problem error:', error);
    next(new AppError('Failed to delete problem', 500));
  }
};

// @desc    Get problem statistics
// @route   GET /api/problems/:id/stats
// @access  Public
exports.getProblemStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const problem = await Problem.findById(id);
    
    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Get detailed submission statistics
    const submissionStats = await Submission.aggregate([
      { $match: { problem: problem._id } },
      {
        $group: {
          _id: {
            status: '$status',
            language: '$language'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent successful submissions
    const recentSubmissions = await Submission.find({
      problem: problem._id,
      status: 'accepted'
    })
    .populate('user', 'firstname lastname username')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get difficulty-based stats
    const difficultyComparison = await Problem.aggregate([
      {
        $group: {
          _id: '$difficulty',
          avgAcceptanceRate: {
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
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        problemStats: problem.statistics,
        submissionStats,
        recentSubmissions,
        difficultyComparison,
        acceptanceRate: problem.acceptanceRate
      }
    });

  } catch (error) {
    logger.error('Get problem stats error:', error);
    next(new AppError('Failed to fetch problem statistics', 500));
  }
};

// @desc    Search problems
// @route   GET /api/problems/search
// @access  Public
exports.searchProblems = async (req, res, next) => {
  try {
    const { q, difficulty, category, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return next(new AppError('Search query must be at least 2 characters long', 400));
    }

    const query = {
      status: 'published',
      isPublic: true,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    const problems = await Problem.find(query)
      .populate('author', 'firstname lastname username')
      .select('title slug difficulty category points statistics tags')
      .limit(parseInt(limit))
      .sort({ 'statistics.solvedBy': -1, points: -1 });

    res.status(200).json({
      success: true,
      data: problems
    });

  } catch (error) {
    logger.error('Search problems error:', error);
    next(new AppError('Failed to search problems', 500));
  }
};

// @desc    Get trending problems
// @route   GET /api/problems/trending
// @access  Public
exports.getTrendingProblems = async (req, res, next) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const problems = await Problem.getTrendingProblems(parseInt(days), parseInt(limit));

    res.status(200).json({
      success: true,
      data: problems
    });

  } catch (error) {
    logger.error('Get trending problems error:', error);
    next(new AppError('Failed to fetch trending problems', 500));
  }
};

// @desc    Get problems by category
// @route   GET /api/problems/category/:category
// @access  Public
exports.getProblemsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const problems = await Problem.getByCategory(category, parseInt(limit), skip);
    const total = await Problem.countDocuments({ 
      category, 
      status: 'published', 
      isPublic: true 
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        problems,
        pagination: {
          current: parseInt(page),
          total: totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          count: problems.length,
          totalCount: total
        },
        category
      }
    });

  } catch (error) {
    logger.error('Get problems by category error:', error);
    next(new AppError('Failed to fetch problems by category', 500));
  }
};

// @desc    Add problem moderator
// @route   POST /api/problems/:id/moderators
// @access  Private (Admin/Author)
exports.addModerator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const problem = await Problem.findById(id);
    
    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Check permissions
    const isAuthor = problem.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return next(new AppError('Not authorized to add moderators', 403));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if already a moderator
    if (problem.moderators.includes(userId)) {
      return next(new AppError('User is already a moderator', 400));
    }

    problem.moderators.push(userId);
    await problem.save();

    logger.info(`Moderator added to problem: ${problem.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Moderator added successfully'
    });

  } catch (error) {
    logger.error('Add moderator error:', error);
    next(new AppError('Failed to add moderator', 500));
  }
};

// @desc    Remove problem moderator
// @route   DELETE /api/problems/:id/moderators/:userId
// @access  Private (Admin/Author)
exports.removeModerator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const problem = await Problem.findById(id);
    
    if (!problem) {
      return next(new AppError('Problem not found', 404));
    }

    // Check permissions
    const isAuthor = problem.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isAdmin) {
      return next(new AppError('Not authorized to remove moderators', 403));
    }

    problem.moderators = problem.moderators.filter(
      moderatorId => moderatorId.toString() !== userId
    );
    
    await problem.save();

    logger.info(`Moderator removed from problem: ${problem.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Moderator removed successfully'
    });

  } catch (error) {
    logger.error('Remove moderator error:', error);
    next(new AppError('Failed to remove moderator', 500));
  }
};
