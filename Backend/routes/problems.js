const express = require('express');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateSubmission } = require('../middleware/validation');
const { addSubmission } = require('../utils/submissionQueue');
const { cacheData, getCachedData } = require('../utils/cache');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const CustomProblemList = require('../models/CustomProblemList');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// @route   GET /api/problems
// @desc    Get paginated and filtered problems with advanced filtering
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      difficulty, 
      tags, 
      search, 
      sort = 'difficulty_asc',
      solved,
      minAcceptance = 0,
      maxAcceptance = 100
    } = req.query;
    
    // Build cache key
    const cacheKey = `problems:${page}:${limit}:${difficulty || ''}:${tags || ''}:${search || ''}:${sort}:${solved || ''}:${minAcceptance}:${maxAcceptance}`;
    
    // Try to get cached data, but handle cache errors gracefully
    let cached = null;
    try {
      cached = await getCachedData(cacheKey);
    } catch (cacheError) {
      console.log('Cache read error (continuing with database):', cacheError.message);
    }
    
    if (cached) return res.status(200).json({ success: true, data: cached });

    // Build query
    const query = { isActive: true };
    
    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
      query.difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort criteria
    let sortCriteria = {};
    const [sortField, sortOrder] = sort.split('_');
    const order = sortOrder === 'desc' ? -1 : 1;
    
    switch (sortField) {
      case 'title':
        sortCriteria.title = order;
        break;
      case 'acceptance':
        sortCriteria.acceptanceRate = order;
        break;
      case 'submissions':
        sortCriteria.totalSubmissions = order;
        break;
      case 'created':
        sortCriteria.createdAt = order;
        break;
      case 'difficulty':
      default:
        // Custom sort for difficulty
        sortCriteria = order === 1 
          ? { difficulty: 1, createdAt: -1 }
          : { difficulty: -1, createdAt: -1 };
        break;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [problems, totalCount] = await Promise.all([
      Problem.find(query)
        .select('title slug difficulty tags totalSubmissions acceptedSubmissions isFeatured createdAt')
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Problem.countDocuments(query)
    ]);

    // Add computed fields and user-specific data
    let enhancedProblems = problems.map(problem => {
      const acceptanceRate = problem.totalSubmissions > 0 
        ? Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100)
        : 0;
      
      return {
        ...problem,
        acceptanceRate,
        solved: false // Will be updated below if user is authenticated
      };
    });

    // Filter by acceptance rate
    if (minAcceptance > 0 || maxAcceptance < 100) {
      enhancedProblems = enhancedProblems.filter(problem => 
        problem.acceptanceRate >= parseInt(minAcceptance) && 
        problem.acceptanceRate <= parseInt(maxAcceptance)
      );
    }

    // Add user-specific solved status
    if (req.user) {
      try {
        const userWithSolved = await User.findById(req.user._id)
          .select('solvedProblems')
          .populate('solvedProblems.problemId', '_id');
        
        const solvedProblemIds = new Set(
          userWithSolved?.solvedProblems?.map(sp => sp.problemId._id.toString()) || []
        );

        enhancedProblems = enhancedProblems.map(problem => ({
          ...problem,
          solved: solvedProblemIds.has(problem._id.toString())
        }));

        // Filter by solved status if requested
        if (solved === 'true') {
          enhancedProblems = enhancedProblems.filter(problem => problem.solved);
        } else if (solved === 'false') {
          enhancedProblems = enhancedProblems.filter(problem => !problem.solved);
        }
      } catch (userError) {
        console.log('Error fetching user solved problems:', userError.message);
      }
    }

    // Pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const pagination = {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNext: parseInt(page) < totalPages,
      hasPrev: parseInt(page) > 1,
      limit: parseInt(limit)
    };

    const result = {
      problems: enhancedProblems,
      pagination,
      totalCount
    };

    // Try to cache data, but handle cache errors gracefully
    try {
      await cacheData(cacheKey, result, 1800); // Cache for 30 minutes
    } catch (cacheError) {
      console.log('Cache write error (ignoring):', cacheError.message);
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problems',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/problems/featured
// @desc    Get featured problems
// @access  Public
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const problems = await Problem.find({ 
      isActive: true, 
      isFeatured: true 
    })
      .select('title slug difficulty tags totalSubmissions acceptedSubmissions')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Add user-specific data if authenticated
    let problemsWithUserData = problems;
    if (req.user) {
      problemsWithUserData = problems.map(problem => {
        const solved = req.user.solvedProblems.some(
          sp => sp.problemId.toString() === problem._id.toString()
        );
        return {
          ...problem.toJSON(),
          solved
        };
      });
    }

    res.json({
      success: true,
      data: { problems: problemsWithUserData }
    });

  } catch (error) {
    console.error('Get featured problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured problems'
    });
  }
});

/**
 * @route   GET /api/problems/:identifier
 * @desc    Get a specific problem with description (by ID or slug)
 * @access  Public
 */
router.get('/:identifier', optionalAuth, async (req, res) => {
  try {
    const { identifier } = req.params;
    const cacheKey = `problem:${identifier}`;
    
    // Try to get cached data, but handle cache errors gracefully
    let cached = null;
    try {
      cached = await getCachedData(cacheKey);
    } catch (cacheError) {
      console.log('Cache read error (continuing with database):', cacheError.message);
    }
    
    if (cached) return res.status(200).json({ success: true, data: cached });

    // Try to find by ObjectId first, then by slug if that fails
    let problem;
    try {
      // Check if identifier is a valid ObjectId
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        problem = await Problem.findOne({ _id: identifier, isActive: true })
          .select('title slug difficulty description constraints examples tags timeLimit memoryLimit')
          .lean();
      }
    } catch (error) {
      // If ObjectId search fails, we'll try slug search below
      console.log('ObjectId search failed, trying slug search');
    }

    // If not found by ObjectId, try finding by slug
    if (!problem) {
      problem = await Problem.findOne({ slug: identifier, isActive: true })
        .select('title slug difficulty description constraints examples tags timeLimit memoryLimit')
        .lean();
    }

    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    // Try to cache data, but handle cache errors gracefully
    try {
      await cacheData(cacheKey, problem, 3600); // Cache for 1 hour
    } catch (cacheError) {
      console.log('Cache write error (ignoring):', cacheError.message);
    }

    res.status(200).json({
      success: true,
      data: problem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problem',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/problems/:id/submit
 * @desc    Submit code for a problem
 * @access  Private
 */
router.post('/:id/submit', authenticateToken, rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many submissions. Please try again later.'
}), validateSubmission, async (req, res) => {
  try {
    const { code, language } = req.body;
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

    const submission = new Submission({
      userId: req.user.id,
      problemId: req.params.id,
      code,
      language,
      status: 'Pending'
    });
    await submission.save();

    await addSubmission({
      code,
      language,
      problemId: req.params.id,
      submissionId: submission._id
    });

    res.status(202).json({
      success: true,
      message: 'Submission queued for processing',
      submissionId: submission._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Submission failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/problems/:id/submissions
// @desc    Get submissions for a problem (user's own submissions)
// @access  Private
router.get('/:id/submissions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Find the problem
    const problem = await Problem.findOne({
      $or: [{ _id: id }, { slug: id }],
      isActive: true
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const submissions = await Submission.find({
      userId: req.user._id,
      problemId: problem._id
    })
      .select('status submittedAt executionTime memoryUsed language')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalSubmissions = await Submission.countDocuments({
      userId: req.user._id,
      problemId: problem._id
    });

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
    console.error('Get problem submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching submissions'
    });
  }
});

// @route   GET /api/problems/tags/popular
// @desc    Get popular problem tags with proper formatting
// @access  Public
router.get('/tags/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const tags = await Problem.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      { $group: { 
        _id: '$tags', 
        name: { $first: '$tags' },
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    res.json({
      success: true,
      data: { tags }
    });

  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching popular tags'
    });
  }
});

// ============ CUSTOM PROBLEM LISTS ENDPOINTS ============

// @route   GET /api/problems/lists
// @desc    Get user's custom problem lists
// @access  Private
router.get('/lists', authenticateToken, async (req, res) => {
  try {
    const lists = await CustomProblemList.getUserLists(req.user._id);
    
    res.json({
      success: true,
      data: { lists }
    });

  } catch (error) {
    console.error('Get custom lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching custom lists'
    });
  }
});

// @route   POST /api/problems/lists
// @desc    Create a new custom problem list
// @access  Private
router.post('/lists', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPublic = false } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'List name is required'
      });
    }

    // Check if user already has a list with this name
    const existingList = await CustomProblemList.findOne({
      userId: req.user._id,
      name: name.trim()
    });

    if (existingList) {
      return res.status(400).json({
        success: false,
        message: 'You already have a list with this name'
      });
    }

    const newList = new CustomProblemList({
      name: name.trim(),
      description: description?.trim() || '',
      userId: req.user._id,
      isPublic: Boolean(isPublic),
      problems: []
    });

    const savedList = await newList.save();
    const populatedList = await CustomProblemList.findById(savedList._id)
      .populate('problems', 'title slug difficulty tags');

    res.status(201).json({
      success: true,
      data: { list: populatedList },
      message: 'Custom list created successfully'
    });

  } catch (error) {
    console.error('Create custom list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating custom list'
    });
  }
});

// @route   PUT /api/problems/lists/:listId/problems/:problemId
// @desc    Add a problem to a custom list
// @access  Private
router.put('/lists/:listId/problems/:problemId', authenticateToken, async (req, res) => {
  try {
    const { listId, problemId } = req.params;

    // Find the list and verify ownership
    const list = await CustomProblemList.findOne({
      _id: listId,
      userId: req.user._id
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'Custom list not found or access denied'
      });
    }

    // Verify the problem exists
    const problem = await Problem.findOne({
      _id: problemId,
      isActive: true
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Add problem to list
    await list.addProblem(problemId);
    
    // Return updated list
    const updatedList = await CustomProblemList.findById(listId)
      .populate('problems', 'title slug difficulty tags');

    res.json({
      success: true,
      data: { list: updatedList },
      message: 'Problem added to list successfully'
    });

  } catch (error) {
    console.error('Add problem to list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding problem to list'
    });
  }
});

// @route   DELETE /api/problems/lists/:listId/problems/:problemId
// @desc    Remove a problem from a custom list
// @access  Private
router.delete('/lists/:listId/problems/:problemId', authenticateToken, async (req, res) => {
  try {
    const { listId, problemId } = req.params;

    // Find the list and verify ownership
    const list = await CustomProblemList.findOne({
      _id: listId,
      userId: req.user._id
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'Custom list not found or access denied'
      });
    }

    // Remove problem from list
    await list.removeProblem(problemId);
    
    // Return updated list
    const updatedList = await CustomProblemList.findById(listId)
      .populate('problems', 'title slug difficulty tags');

    res.json({
      success: true,
      data: { list: updatedList },
      message: 'Problem removed from list successfully'
    });

  } catch (error) {
    console.error('Remove problem from list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing problem from list'
    });
  }
});

// @route   GET /api/problems/solved
// @desc    Get user's solved problems
// @access  Private
router.get('/solved', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'solvedProblems.problemId',
        select: 'title slug difficulty tags totalSubmissions acceptedSubmissions',
        match: { isActive: true }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const solvedProblems = user.solvedProblems
      .filter(sp => sp.problemId) // Filter out any null problemIds
      .map(sp => sp.problemId._id.toString());

    res.json({
      success: true,
      data: { solvedProblems }
    });

  } catch (error) {
    console.error('Get solved problems error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching solved problems'
    });
  }
});

// Simulation function for code execution (replace with actual execution service)
function simulateCodeExecution(code, language, problem) {
  // This is a mock function - replace with actual code execution logic
  const random = Math.random();
  
  if (random < 0.7) { // 70% acceptance rate simulation
    return {
      status: 'Accepted',
      executionTime: Math.floor(Math.random() * 1000) + 100,
      memoryUsed: Math.floor(Math.random() * 50) + 10,
      testCaseResults: problem.examples.map(example => ({
        input: example.input,
        expectedOutput: example.output,
        actualOutput: example.output,
        status: 'Passed',
        executionTime: Math.floor(Math.random() * 100) + 10,
        memoryUsed: Math.floor(Math.random() * 10) + 5
      }))
    };
  } else if (random < 0.9) {
    return {
      status: 'Wrong Answer',
      executionTime: Math.floor(Math.random() * 1000) + 100,
      memoryUsed: Math.floor(Math.random() * 50) + 10,
      testCaseResults: problem.examples.map((example, index) => ({
        input: example.input,
        expectedOutput: example.output,
        actualOutput: index === 0 ? 'Wrong output' : example.output,
        status: index === 0 ? 'Failed' : 'Passed',
        executionTime: Math.floor(Math.random() * 100) + 10,
        memoryUsed: Math.floor(Math.random() * 10) + 5
      }))
    };
  } else {
    return {
      status: 'Runtime Error',
      executionTime: null,
      memoryUsed: null,
      testCaseResults: [],
      errorMessage: 'Runtime error occurred during execution'
    };
  }
}

module.exports = router;
