const request = require('supertest');
const app = require('../server');

/**
 * Comprehensive API Endpoint Testing
 * Tests all API endpoints for basic functionality and database dependencies
 */

class APIHealthChecker {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.results = {
      health: { status: 'pending' },
      auth: { status: 'pending', endpoints: {} },
      user: { status: 'pending', endpoints: {} },
      problems: { status: 'pending', endpoints: {} },
      submissions: { status: 'pending', endpoints: {} },
      contests: { status: 'pending', endpoints: {} },
      admin: { status: 'pending', endpoints: {} }
    };
  }

  /**
   * Test health endpoint
   */
  async testHealthEndpoint() {
    try {
      console.log('🔍 Testing health endpoint...');
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      this.results.health = {
        status: 'healthy',
        response: response.body
      };
      
      console.log('✅ Health endpoint test passed');
      
    } catch (error) {
      this.results.health = {
        status: 'failed',
        error: error.message
      };
      console.error('❌ Health endpoint test failed:', error.message);
    }
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints() {
    try {
      console.log('🔍 Testing authentication endpoints...');
      
      const endpoints = {};
      
      // Test registration endpoint structure (without actual registration)
      try {
        const regResponse = await request(app)
          .post('/api/auth/register')
          .send({}) // Empty body to test validation
          .expect(400);
        
        endpoints.register = {
          status: 'healthy',
          validation: 'working',
          response: regResponse.body
        };
      } catch (error) {
        endpoints.register = {
          status: 'failed',
          error: error.message
        };
      }
      
      // Test login endpoint structure
      try {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({}) // Empty body to test validation
          .expect(400);
        
        endpoints.login = {
          status: 'healthy',
          validation: 'working',
          response: loginResponse.body
        };
      } catch (error) {
        endpoints.login = {
          status: 'failed',
          error: error.message
        };
      }
      
      // Test OAuth endpoints (they should redirect)
      try {
        const googleResponse = await request(app)
          .get('/api/auth/oauth/google')
          .expect(302);
        
        endpoints.googleOAuth = {
          status: 'healthy',
          redirects: true,
          location: googleResponse.headers.location
        };
      } catch (error) {
        endpoints.googleOAuth = {
          status: 'failed',
          error: error.message
        };
      }
      
      try {
        const githubResponse = await request(app)
          .get('/api/auth/oauth/github')
          .expect(302);
        
        endpoints.githubOAuth = {
          status: 'healthy',
          redirects: true,
          location: githubResponse.headers.location
        };
      } catch (error) {
        endpoints.githubOAuth = {
          status: 'failed',
          error: error.message
        };
      }
      
      this.results.auth = {
        status: Object.values(endpoints).every(e => e.status === 'healthy') ? 'healthy' : 'partial',
        endpoints
      };
      
      console.log('✅ Authentication endpoints test completed');
      
    } catch (error) {
      this.results.auth = {
        status: 'failed',
        error: error.message
      };
      console.error('❌ Authentication endpoints test failed:', error.message);
    }
  }

  /**
   * Test user endpoints
   */
  async testUserEndpoints() {
    try {
      console.log('🔍 Testing user endpoints...');
      
      const endpoints = {};
      
      // Test profile endpoint (should require auth)
      try {
        const profileResponse = await request(app)
          .get('/api/user/profile')
          .expect(401); // Should require authentication
        
        endpoints.profile = {
          status: 'healthy',
          requiresAuth: true,
          response: profileResponse.body
        };
      } catch (error) {
        endpoints.profile = {
          status: 'failed',
          error: error.message
        };
      }
      
      this.results.user = {
        status: Object.values(endpoints).every(e => e.status === 'healthy') ? 'healthy' : 'partial',
        endpoints
      };
      
      console.log('✅ User endpoints test completed');
      
    } catch (error) {
      this.results.user = {
        status: 'failed',
        error: error.message
      };
      console.error('❌ User endpoints test failed:', error.message);
    }
  }

  /**
   * Test problems endpoints
   */
  async testProblemsEndpoints() {
    try {
      console.log('🔍 Testing problems endpoints...');
      
      const endpoints = {};
      
      // Test problems list endpoint
      try {
        const problemsResponse = await request(app)
          .get('/api/problems')
          .expect(200);
        
        endpoints.list = {
          status: 'healthy',
          public: true,
          response: problemsResponse.body
        };
      } catch (error) {
        endpoints.list = {
          status: 'failed',
          error: error.message
        };
      }
      
      this.results.problems = {
        status: Object.values(endpoints).every(e => e.status === 'healthy') ? 'healthy' : 'partial',
        endpoints
      };
      
      console.log('✅ Problems endpoints test completed');
      
    } catch (error) {
      this.results.problems = {
        status: 'failed',
        error: error.message
      };
      console.error('❌ Problems endpoints test failed:', error.message);
    }
  }

  /**
   * Test submissions endpoints
   */
  async testSubmissionsEndpoints() {
    try {
      console.log('🔍 Testing submissions endpoints...');
      
      const endpoints = {};
      
      // Test submissions endpoint (should require auth)
      try {
        const submissionsResponse = await request(app)
          .post('/api/submissions')
          .send({})
          .expect(401); // Should require authentication
        
        endpoints.submit = {
          status: 'healthy',
          requiresAuth: true,
          response: submissionsResponse.body
        };
      } catch (error) {
        endpoints.submit = {
          status: 'failed',
          error: error.message
        };
      }
      
      this.results.submissions = {
        status: Object.values(endpoints).every(e => e.status === 'healthy') ? 'healthy' : 'partial',
        endpoints
      };
      
      console.log('✅ Submissions endpoints test completed');
      
    } catch (error) {
      this.results.submissions = {
        status: 'failed',
        error: error.message
      };
      console.error('❌ Submissions endpoints test failed:', error.message);
    }
  }

  /**
   * Test contests endpoints
   */
  async testContestsEndpoints() {
    try {
      console.log('🔍 Testing contests endpoints...');
      
      const endpoints = {};
      
      // Test contests list endpoint
      try {
        const contestsResponse = await request(app)
          .get('/api/contests')
          .expect(200);
        
        endpoints.list = {
          status: 'healthy',
          public: true,
          response: contestsResponse.body
        };
      } catch (error) {
        endpoints.list = {
          status: 'failed',
          error: error.message
        };
      }
      
      this.results.contests = {
        status: Object.values(endpoints).every(e => e.status === 'healthy') ? 'healthy' : 'partial',
        endpoints
      };
      
      console.log('✅ Contests endpoints test completed');
      
    } catch (error) {
      this.results.contests = {
        status: 'failed',
        error: error.message
      };
      console.error('❌ Contests endpoints test failed:', error.message);
    }
  }

  /**
   * Run all API checks
   */
  async runAllChecks() {
    console.log('🌐 Starting comprehensive API endpoint testing...\n');
    
    await this.testHealthEndpoint();
    await this.testAuthEndpoints();
    await this.testUserEndpoints();
    await this.testProblemsEndpoints();
    await this.testSubmissionsEndpoints();
    await this.testContestsEndpoints();
    
    // Generate summary
    const categories = ['health', 'auth', 'user', 'problems', 'submissions', 'contests'];
    const overallStatus = categories.every(cat => this.results[cat].status === 'healthy') ? 'HEALTHY' :
                         categories.some(cat => this.results[cat].status === 'healthy') ? 'PARTIAL' : 'FAILED';
    
    console.log('\n📊 API Health Check Summary:');
    console.log('============================');
    console.log(`Overall API Status: ${overallStatus}`);
    categories.forEach(cat => {
      console.log(`${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${this.results[cat].status.toUpperCase()}`);
    });
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      ...this.results
    };
  }
}

module.exports = APIHealthChecker;

// CLI execution
if (require.main === module) {
  const connectDB = require('../config/db');
  
  async function run() {
    try {
      // Start server implicitly by requiring it
      await connectDB();
      
      const checker = new APIHealthChecker();
      const results = await checker.runAllChecks();
      
      console.log('\n📋 Detailed API Results:');
      console.log(JSON.stringify(results, null, 2));
      
      process.exit(results.status === 'HEALTHY' ? 0 : 1);
    } catch (error) {
      console.error('❌ API health check script failed:', error);
      process.exit(1);
    }
  }
  
  run();
}
