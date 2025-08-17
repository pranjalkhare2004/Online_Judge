const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateContestCreation } = require('../middleware/validation');
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');

const router = express.Router();

// @route   GET /api/contests
// @desc    Get all contests with pagination and filters
// @access  Public (with optional auth for user context)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { isPublic: true };
    
    // Status filter
    if (req.query.status) {
      if (req.query.status === 'upcoming') {
        filter.startTime = { $gt: new Date() };
      } else if (req.query.status === 'live') {
        filter.startTime = { $lte: new Date() };
        filter.endTime = { $gt: new Date() };
      } else if (req.query.status === 'ended') {
        filter.endTime = { $lt: new Date() };
      }
    }

    // Search filter
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const contests = await Contest.find(filter)
      .select('title description startTime endTime duration participantCount maxParticipants scoringType createdBy participants')
      .populate('createdBy', 'name username')
      .sort({ startTime: req.query.status === 'ended' ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const totalContests = await Contest.countDocuments(filter);

    // Add user-specific data if authenticated
    let contestsWithUserData = contests;
    if (req.user) {
      contestsWithUserData = contests.map(contest => {
        const participants = contest.participants || [];
        const isRegistered = participants.some(
          p => p.userId.toString() === req.user._id.toString()
        );
        return {
          ...contest.toJSON(),
          isRegistered,
          canRegister: contest.canUserRegister(req.user._id)
        };
      });
    }

    res.json({
      success: true,
      data: {
        contests: contestsWithUserData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalContests / limit),
          totalContests,
          hasNext: page * limit < totalContests,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get contests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contests'
    });
  }
});

// @route   GET /api/contests/:id
// @desc    Get single contest by ID
// @access  Public (with optional auth for user context)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('createdBy', 'name username')
      .populate('problems.problemId', 'title difficulty tags');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    let contestData = contest.toJSON();

    // Add user-specific data if authenticated
    if (req.user) {
      const participant = contest.participants.find(
        p => p.userId.toString() === req.user._id.toString()
      );
      
      contestData.isRegistered = !!participant;
      contestData.canRegister = contest.canUserRegister(req.user._id);
      
      if (participant) {
        contestData.userRank = participant.rank;
        contestData.userScore = participant.totalScore;
      }
    }

    res.json({
      success: true,
      data: { contest: contestData }
    });

  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contest'
    });
  }
});

// @route   POST /api/contests/:id/register
// @desc    Register for a contest
// @access  Private
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Check if user can register
    if (!contest.canUserRegister(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for this contest'
      });
    }

    // Add user to participants
    contest.participants.push({
      userId: req.user._id,
      registeredAt: new Date()
    });

    await contest.save();

    res.json({
      success: true,
      message: 'Successfully registered for contest',
      data: {
        contestId: contest._id,
        participantCount: contest.participants.length
      }
    });

  } catch (error) {
    console.error('Register for contest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error registering for contest'
    });
  }
});

// @route   POST /api/contests/:id/unregister
// @desc    Unregister from a contest
// @access  Private
router.post('/:id/unregister', authenticateToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Check if contest has started
    if (new Date() >= contest.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unregister from a contest that has started'
      });
    }

    // Remove user from participants
    contest.participants = contest.participants.filter(
      p => p.userId.toString() !== req.user._id.toString()
    );

    await contest.save();

    res.json({
      success: true,
      message: 'Successfully unregistered from contest'
    });

  } catch (error) {
    console.error('Unregister from contest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unregistering from contest'
    });
  }
});

// @route   GET /api/contests/:id/leaderboard
// @desc    Get contest leaderboard
// @access  Public
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('participants.userId', 'name username avatar rating');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Sort participants by rank (or score if ranks not calculated)
    let leaderboard = contest.participants
      .filter(p => p.userId) // Ensure user still exists
      .sort((a, b) => {
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        }
        return b.totalScore - a.totalScore || a.totalTime - b.totalTime;
      })
      .map((participant, index) => ({
        rank: participant.rank || index + 1,
        user: {
          id: participant.userId._id,
          name: participant.userId.name,
          username: participant.userId.username,
          avatar: participant.userId.avatar,
          rating: participant.userId.rating
        },
        totalScore: participant.totalScore,
        totalTime: participant.totalTime,
        registeredAt: participant.registeredAt
      }));

    res.json({
      success: true,
      data: {
        contest: {
          id: contest._id,
          title: contest.title,
          startTime: contest.startTime,
          endTime: contest.endTime,
          status: contest.currentStatus
        },
        leaderboard
      }
    });

  } catch (error) {
    console.error('Get contest leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard'
    });
  }
});

// @route   GET /api/contests/:id/problems
// @desc    Get contest problems (for registered users during/after contest)
// @access  Private
router.get('/:id/problems', authenticateToken, async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('problems.problemId', 'title difficulty description examples constraints timeLimit memoryLimit');

    if (!contest) {
      return res.status(404).json({
        success: false,
        message: 'Contest not found'
      });
    }

    // Check if user is registered
    const isRegistered = contest.participants.some(
      p => p.userId.toString() === req.user._id.toString()
    );

    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this contest to view problems'
      });
    }

    // Check if contest has started (for viewing problems)
    const now = new Date();
    if (now < contest.startTime) {
      return res.status(403).json({
        success: false,
        message: 'Contest has not started yet'
      });
    }

    // Get user's submissions for contest problems
    const problemIds = contest.problems.map(p => p.problemId._id);
    const userSubmissions = await Submission.find({
      userId: req.user._id,
      problemId: { $in: problemIds },
      contestId: contest._id
    }).select('problemId status submittedAt score');

    // Enhance problems with user submission data
    const problemsWithSubmissions = contest.problems.map(contestProblem => {
      const problem = contestProblem.problemId;
      const submissions = userSubmissions.filter(
        sub => sub.problemId.toString() === problem._id.toString()
      );
      
      return {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        examples: problem.examples,
        constraints: problem.constraints,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        points: contestProblem.points,
        order: contestProblem.order,
        submissions: submissions.length,
        solved: submissions.some(sub => sub.status === 'Accepted'),
        bestScore: submissions.length > 0 ? Math.max(...submissions.map(s => s.score || 0)) : 0
      };
    });

    // Sort by order
    problemsWithSubmissions.sort((a, b) => a.order - b.order);

    res.json({
      success: true,
      data: {
        contest: {
          id: contest._id,
          title: contest.title,
          startTime: contest.startTime,
          endTime: contest.endTime,
          status: contest.currentStatus
        },
        problems: problemsWithSubmissions
      }
    });

  } catch (error) {
    console.error('Get contest problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching contest problems'
    });
  }
});

// @route   POST /api/contests
// @desc    Create a new contest (admin only for now)
// @access  Private
router.post('/', authenticateToken, validateContestCreation, async (req, res) => {
  try {
    const {
      title,
      description,
      startTime,
      endTime,
      problems,
      maxParticipants,
      scoringType
    } = req.body;

    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end - start) / (1000 * 60)); // in minutes

    // Verify all problems exist
    const problemIds = problems.map(p => p.problemId);
    const existingProblems = await Problem.find({
      _id: { $in: problemIds },
      isActive: true
    });

    if (existingProblems.length !== problemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more problems not found'
      });
    }

    // Create contest
    const contest = new Contest({
      title,
      description,
      startTime: start,
      endTime: end,
      duration,
      problems: problems.map((problem, index) => ({
        problemId: problem.problemId,
        points: problem.points || 100,
        order: index + 1
      })),
      maxParticipants,
      scoringType: scoringType || 'ICPC',
      createdBy: req.user._id
    });

    await contest.save();

    res.status(201).json({
      success: true,
      message: 'Contest created successfully',
      data: { contest }
    });

  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating contest'
    });
  }
});

module.exports = router;
