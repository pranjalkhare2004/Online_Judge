/**
 * DOCKER COMPILER TESTING ROUTES
 * Direct endpoints for testing Docker compiler functionality
 */

const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const { executeCodeSecure, isDockerAvailable, getSupportedLanguages } = require('../services/dockerCompilerFixed');

/**
 * GET /api/docker/status
 * Check Docker availability and status
 */
router.get('/status', async (req, res) => {
  try {
    const dockerAvailable = await isDockerAvailable();
    const supportedLanguages = getSupportedLanguages();
    
    res.json({
      success: true,
      data: {
        dockerAvailable,
        supportedLanguages,
        containerSecurity: {
          networkIsolation: true,
          resourceLimits: true,
          autoCleanup: true,
          readOnlyFilesystem: false // For compilation
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check Docker status',
      error: error.message
    });
  }
});

/**
 * POST /api/docker/execute
 * Execute code using Docker compiler directly
 */
router.post('/execute', auth, async (req, res) => {
  try {
    const { code, language, testCases } = req.body;
    
    // Validation
    if (!code || !language || !testCases) {
      return res.status(400).json({
        success: false,
        message: 'Code, language, and testCases are required'
      });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one test case is required'
      });
    }

    console.log(`🐳 Docker execution request from user ${req.user.id}: ${language}, ${testCases.length} test cases`);

    const startTime = Date.now();
    const result = await executeCodeSecure(code, language, testCases);
    const totalTime = Date.now() - startTime;

    res.json({
      success: result.success,
      data: result,
      metadata: {
        executionMode: 'docker',
        totalExecutionTime: totalTime,
        userId: req.user.id,
        timestamp: new Date().toISOString()
      },
      message: result.success 
        ? `Docker execution completed: ${result.summary?.passedTestCases || 0}/${result.summary?.totalTestCases || 0} tests passed`
        : 'Docker execution failed'
    });

  } catch (error) {
    console.error('Docker execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Docker execution failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/docker/test-connection
 * Test Docker connection and basic functionality
 */
router.post('/test-connection', auth, async (req, res) => {
  try {
    // Simple test code
    const testCode = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello Docker!" << endl;
    return 0;
}`;

    const testCases = [
      { input: "", expectedOutput: "Hello Docker!" }
    ];

    console.log(`🧪 Docker connection test from user ${req.user.id}`);

    const result = await executeCodeSecure(testCode, 'cpp', testCases);

    res.json({
      success: result.success,
      data: {
        dockerWorking: result.success,
        testResult: result,
        message: result.success 
          ? 'Docker is working correctly!' 
          : 'Docker execution failed'
      }
    });

  } catch (error) {
    console.error('Docker connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Docker connection test failed',
      error: error.message
    });
  }
});

/**
 * GET /api/docker/languages
 * Get supported languages with Docker image details
 */
router.get('/languages', (req, res) => {
  try {
    const languages = getSupportedLanguages();
    
    res.json({
      success: true,
      data: languages,
      count: languages.length,
      metadata: {
        provider: 'Docker',
        security: 'Container Isolation',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get supported languages',
      error: error.message
    });
  }
});

module.exports = router;
