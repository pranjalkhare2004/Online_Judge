const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all contests
// @route   GET /api/contests
// @access  Public
exports.getAllContests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (req.query.status) {
      const now = new Date();
      switch (req.query.status) {
        case 'upcoming':
          filter.startTime = { $gt: now };
          break;
        case 'running':
          filter.startTime = { $lte: now };
          filter.endTime = { $gt: now };
          break;
        case 'ended':
          filter.endTime = { $lte: now };
          break;
      }
    }

    const [contests, total] = await Promise.all([
      Contest.find(filter)
        .populate('problems', 'title difficulty')
        .populate('createdBy', 'firstname lastname')
        .sort({ startTime: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Contest.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        contests,
        pagination: {
          currentPage: page,
          totalPages,
          totalContests: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Get all contests error:', error);
    next(new AppError('Failed to fetch contests', 500));
  }
};

// @desc    Get contest by ID
// @route   GET /api/contests/:id
// @access  Public
exports.getContestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findById(id)
      .populate('problems', 'title difficulty category')
      .populate('participants', 'firstname lastname email')
      .populate('createdBy', 'firstname lastname email');

    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    res.status(200).json({
      success: true,
      data: contest
    });

  } catch (error) {
    logger.error('Get contest by ID error:', error);
    next(new AppError('Failed to fetch contest', 500));
  }
};

// @desc    Create new contest (admin only)
// @route   POST /api/contests
// @access  Private (admin)
exports.createContest = async (req, res, next) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      problems,
      isPublic,
      maxParticipants
    } = req.body;

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return next(new AppError('Start time must be before end time', 400));
    }
    
    if (start <= new Date()) {
      return next(new AppError('Start time must be in the future', 400));
    }

    // Validate problems exist
    if (problems && problems.length > 0) {
      const existingProblems = await Problem.find({ _id: { $in: problems } });
      if (existingProblems.length !== problems.length) {
        return next(new AppError('One or more problems not found', 400));
      }
    }

    const contest = new Contest({
      title,
      description,
      startTime,
      endTime,
      problems: problems || [],
      isPublic: isPublic !== false, // Default to true
      maxParticipants,
      createdBy: req.user.id
    });

    await contest.save();

    await contest.populate([
      { path: 'problems', select: 'title difficulty' },
      { path: 'createdBy', select: 'firstname lastname email' }
    ]);

    logger.info(`Contest created: ${contest._id} by admin: ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      data: contest
    });

  } catch (error) {
    logger.error('Create contest error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Failed to create contest', 500));
  }
};

// @desc    Update contest (admin only)
// @route   PUT /api/contests/:id
// @access  Private (admin)
exports.updateContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      startTime,
      endTime,
      problems,
      isPublic,
      maxParticipants
    } = req.body;

    const contest = await Contest.findById(id);
    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    // Check if contest has already started
    if (contest.startTime <= new Date()) {
      return next(new AppError('Cannot update a contest that has already started', 400));
    }

    // Validate dates if provided
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (start >= end) {
        return next(new AppError('Start time must be before end time', 400));
      }
    }

    // Validate problems if provided
    if (problems && problems.length > 0) {
      const existingProblems = await Problem.find({ _id: { $in: problems } });
      if (existingProblems.length !== problems.length) {
        return next(new AppError('One or more problems not found', 400));
      }
    }

    // Update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (startTime !== undefined) updateFields.startTime = startTime;
    if (endTime !== undefined) updateFields.endTime = endTime;
    if (problems !== undefined) updateFields.problems = problems;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (maxParticipants !== undefined) updateFields.maxParticipants = maxParticipants;

    const updatedContest = await Contest.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).populate([
      { path: 'problems', select: 'title difficulty' },
      { path: 'createdBy', select: 'firstname lastname email' }
    ]);

    logger.info(`Contest updated: ${id} by admin: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Contest updated successfully',
      data: updatedContest
    });

  } catch (error) {
    logger.error('Update contest error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    next(new AppError('Failed to update contest', 500));
  }
};

// @desc    Delete contest (admin only)
// @route   DELETE /api/contests/:id
// @access  Private (admin)
exports.deleteContest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    // Check if contest has participants
    if (contest.participants && contest.participants.length > 0) {
      return next(new AppError('Cannot delete contest with participants', 400));
    }

    await Contest.findByIdAndDelete(id);

    logger.info(`Contest deleted: ${id} by admin: ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Contest deleted successfully'
    });

  } catch (error) {
    logger.error('Delete contest error:', error);
    next(new AppError('Failed to delete contest', 500));
  }
};

// @desc    Register for contest
// @route   POST /api/contests/:id/register
// @access  Private
exports.registerForContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const contest = await Contest.findById(id);
    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    // Check if contest is public
    if (!contest.isPublic) {
      return next(new AppError('Contest is not public', 403));
    }

    // Check if contest has not started
    if (contest.startTime <= new Date()) {
      return next(new AppError('Contest has already started', 400));
    }

    // Check if already registered
    if (contest.participants.includes(userId)) {
      return next(new AppError('Already registered for this contest', 400));
    }

    // Check max participants
    if (contest.maxParticipants && contest.participants.length >= contest.maxParticipants) {
      return next(new AppError('Contest is full', 400));
    }

    contest.participants.push(userId);
    await contest.save();

    logger.info(`User registered for contest: ${userId} -> ${id}`);

    res.status(200).json({
      success: true,
      message: 'Successfully registered for contest'
    });

  } catch (error) {
    logger.error('Register for contest error:', error);
    next(new AppError('Failed to register for contest', 500));
  }
};

// @desc    Unregister from contest
// @route   DELETE /api/contests/:id/register
// @access  Private
exports.unregisterFromContest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const contest = await Contest.findById(id);
    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    // Check if contest has not started
    if (contest.startTime <= new Date()) {
      return next(new AppError('Cannot unregister from a contest that has started', 400));
    }

    // Check if registered
    if (!contest.participants.includes(userId)) {
      return next(new AppError('Not registered for this contest', 400));
    }

    contest.participants = contest.participants.filter(
      participant => participant.toString() !== userId
    );
    await contest.save();

    logger.info(`User unregistered from contest: ${userId} -> ${id}`);

    res.status(200).json({
      success: true,
      message: 'Successfully unregistered from contest'
    });

  } catch (error) {
    logger.error('Unregister from contest error:', error);
    next(new AppError('Failed to unregister from contest', 500));
  }
};

// @desc    Get contest leaderboard
// @route   GET /api/contests/:id/leaderboard
// @access  Public
exports.getContestLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    // For now, return basic leaderboard structure
    // TODO: Implement actual scoring logic based on submissions
    const leaderboard = contest.participants.map((participant, index) => ({
      rank: index + 1,
      participant,
      score: 0,
      solvedProblems: 0,
      penalty: 0
    }));

    res.status(200).json({
      success: true,
      data: {
        contest: {
          id: contest._id,
          title: contest.title,
          startTime: contest.startTime,
          endTime: contest.endTime
        },
        leaderboard
      }
    });

  } catch (error) {
    logger.error('Get contest leaderboard error:', error);
    next(new AppError('Failed to fetch contest leaderboard', 500));
  }
};

// @desc    Get contest submissions
// @route   GET /api/contests/:id/submissions
// @access  Private
exports.getContestSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contest = await Contest.findById(id);
    if (!contest) {
      return next(new AppError('Contest not found', 404));
    }

    // Check if user is participant or admin
    if (!contest.participants.includes(req.user.id) && req.user.role !== 'admin') {
      return next(new AppError('Access denied', 403));
    }

    // For now, return empty submissions array
    // TODO: Implement actual contest submissions query
    res.status(200).json({
      success: true,
      data: {
        contest: {
          id: contest._id,
          title: contest.title
        },
        submissions: []
      }
    });

  } catch (error) {
    logger.error('Get contest submissions error:', error);
    next(new AppError('Failed to fetch contest submissions', 500));
  }
};
