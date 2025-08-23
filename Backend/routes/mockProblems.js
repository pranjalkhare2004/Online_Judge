/**
 * MOCK PROBLEMS API ROUTES
 * 
 * Temporary API endpoints using mock data for development
 * when database connection is not available
 */

const express = require('express');
const router = express.Router();
const { mockProblems, applyFilters, applyPagination, getAllTags } = require('../data/mockProblems');

// @route   GET /api/mock/problems
// @desc    Get problems with filtering and pagination (mock data)
// @access  Public (for now)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      difficulty,
      tags,
      search,
      acceptanceRateMin,
      acceptanceRateMax,
      sortBy = 'title',
      sortOrder = 'asc'
    } = req.query;

    // Parse tags if provided
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Apply filters
    const filters = {
      difficulty,
      tags: parsedTags,
      search,
      acceptanceRateMin: acceptanceRateMin ? Number(acceptanceRateMin) : undefined,
      acceptanceRateMax: acceptanceRateMax ? Number(acceptanceRateMax) : undefined
    };

    let filtered = applyFilters(mockProblems, filters);

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'acceptanceRate') {
        aValue = (a.acceptedSubmissions / a.totalSubmissions) * 100;
        bValue = (b.acceptedSubmissions / b.totalSubmissions) * 100;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    });

    // Apply pagination
    const result = applyPagination(filtered, Number(page), Number(limit));

    // Add acceptance rate to each problem
    result.problems = result.problems.map(problem => ({
      ...problem,
      acceptanceRate: Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100 * 100) / 100
    }));

    res.json({
      success: true,
      data: {
        problems: result.problems,
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Mock problems fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching problems'
    });
  }
});

// @route   GET /api/mock/problems/tags
// @desc    Get all available tags (mock data)
// @access  Public
router.get('/tags', (req, res) => {
  try {
    const tags = getAllTags();
    
    res.json({
      success: true,
      data: { tags }
    });

  } catch (error) {
    console.error('Mock tags fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching tags'
    });
  }
});

// @route   GET /api/mock/problems/:id
// @desc    Get a single problem by ID (mock data)
// @access  Public
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const problem = mockProblems.find(p => p._id === id || p.slug === id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Add acceptance rate
    const problemWithRate = {
      ...problem,
      acceptanceRate: Math.round((problem.acceptedSubmissions / problem.totalSubmissions) * 100 * 100) / 100
    };

    res.json({
      success: true,
      data: { problem: problemWithRate }
    });

  } catch (error) {
    console.error('Mock problem fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching problem'
    });
  }
});

// @route   GET /api/mock/problems/stats
// @desc    Get problems statistics (mock data)
// @access  Public
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: mockProblems.length,
      easy: mockProblems.filter(p => p.difficulty === 'Easy').length,
      medium: mockProblems.filter(p => p.difficulty === 'Medium').length,
      hard: mockProblems.filter(p => p.difficulty === 'Hard').length,
      totalSubmissions: mockProblems.reduce((sum, p) => sum + p.totalSubmissions, 0),
      totalAccepted: mockProblems.reduce((sum, p) => sum + p.acceptedSubmissions, 0)
    };

    stats.overallAcceptanceRate = Math.round((stats.totalAccepted / stats.totalSubmissions) * 100 * 100) / 100;

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Mock stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

module.exports = router;
