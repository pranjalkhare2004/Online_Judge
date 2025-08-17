#!/usr/bin/env node

/**
 * PRACTICAL AUTHENTICATION FUNCTIONALITY TEST
 * 
 * This script tests the actual functionality of the authentication system
 * by making real API calls to verify everything works as expected.
 */

const axios = require('axios');
const colors = require('colors');

const config = {
  baseURL: 'http://localhost:5000',
  timeout: 10000
};

const client = axios.create(config);

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, success, message = '') {
  const status = success ? '✅ PASS'.green : '❌ FAIL'.red;
  console.log(`${status} ${name}: ${message}`);
  
  testResults.tests.push({ name, success, message });
  if (success) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function runAuthenticationTests() {
  console.log('🔐 PRACTICAL AUTHENTICATION FUNCTIONALITY TESTS'.cyan.bold);
  console.log('='.repeat(60).cyan);
  
  try {
    // Test 1: Health Check
    console.log('\n1. 🏥 HEALTH CHECK TEST'.yellow.bold);
    try {
      const response = await client.get('/api/health');
      if (response.status === 200 && response.data.status === 'OK') {
        logTest('Health Check', true, 'Server is running and responsive');
      } else {
        logTest('Health Check', false, `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      logTest('Health Check', false, `Server not responding: ${error.message}`);
      console.log('⚠️  Backend server may not be running. Please start it with: npm run dev'.yellow);
      return false;
    }

    // Test 2: User Registration
    console.log('\n2. 📝 USER REGISTRATION TEST'.yellow.bold);
    const testUser = {
      name: 'Test User ' + Date.now(),
      email: `testuser${Date.now()}@example.com`,
      password: 'TestPassword123!',
      DOB: '1990-01-01'
    };

    try {
      const response = await client.post('/api/auth/register', testUser);
      if (response.status === 201 && response.data.success) {
        logTest('User Registration', true, 'User registered successfully');
        
        // Store user credentials for login test
        config.testUser = testUser;
        config.authToken = response.data.data.token;
      } else {
        logTest('User Registration', false, `Registration failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      logTest('User Registration', false, `Registration error: ${errorMsg}`);
    }

    // Test 3: User Login
    console.log('\n3. 🔑 USER LOGIN TEST'.yellow.bold);
    if (config.testUser) {
      try {
        const loginData = {
          email: config.testUser.email,
          password: config.testUser.password
        };
        
        const response = await client.post('/api/auth/login', loginData);
        if (response.status === 200 && response.data.success) {
          logTest('User Login', true, 'Login successful');
          config.authToken = response.data.data.token;
        } else {
          logTest('User Login', false, `Login failed: ${response.data.message || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logTest('User Login', false, `Login error: ${errorMsg}`);
      }
    } else {
      logTest('User Login', false, 'Skipped - no test user available');
    }

    // Test 4: Token Verification
    console.log('\n4. 🎫 TOKEN VERIFICATION TEST'.yellow.bold);
    if (config.authToken) {
      try {
        const response = await client.get('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${config.authToken}`
          }
        });
        
        if (response.status === 200 && response.data.success) {
          logTest('Token Verification', true, 'Token is valid and verified');
        } else {
          logTest('Token Verification', false, `Verification failed: ${response.data.message || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        logTest('Token Verification', false, `Verification error: ${errorMsg}`);
      }
    } else {
      logTest('Token Verification', false, 'Skipped - no auth token available');
    }

    // Test 5: Invalid Login Attempt
    console.log('\n5. 🚫 INVALID LOGIN TEST'.yellow.bold);
    try {
      const response = await client.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
      
      if (response.status === 400 || response.status === 401) {
        logTest('Invalid Login Rejection', true, 'Invalid credentials properly rejected');
      } else {
        logTest('Invalid Login Rejection', false, 'Invalid login was not properly rejected');
      }
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        logTest('Invalid Login Rejection', true, 'Invalid credentials properly rejected');
      } else {
        logTest('Invalid Login Rejection', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 6: Invalid Token Test
    console.log('\n6. 🚫 INVALID TOKEN TEST'.yellow.bold);
    try {
      const response = await client.get('/api/auth/verify', {
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        }
      });
      
      if (response.status === 401 || response.status === 403) {
        logTest('Invalid Token Rejection', true, 'Invalid token properly rejected');
      } else {
        logTest('Invalid Token Rejection', false, 'Invalid token was not properly rejected');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        logTest('Invalid Token Rejection', true, 'Invalid token properly rejected');
      } else {
        logTest('Invalid Token Rejection', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 7: Password Strength Validation
    console.log('\n7. 💪 PASSWORD STRENGTH TEST'.yellow.bold);
    try {
      const weakPasswordUser = {
        name: 'Weak Password User',
        email: `weakuser${Date.now()}@example.com`,
        password: '123', // Weak password
        DOB: '1990-01-01'
      };
      
      const response = await client.post('/api/auth/register', weakPasswordUser);
      
      if (response.status === 400) {
        logTest('Password Strength Validation', true, 'Weak password properly rejected');
      } else {
        logTest('Password Strength Validation', false, 'Weak password was accepted');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Password Strength Validation', true, 'Weak password properly rejected');
      } else {
        logTest('Password Strength Validation', false, `Unexpected error: ${error.message}`);
      }
    }

    // Test 8: Duplicate Email Registration
    console.log('\n8. 🔄 DUPLICATE EMAIL TEST'.yellow.bold);
    if (config.testUser) {
      try {
        const duplicateUser = {
          name: 'Duplicate User',
          email: config.testUser.email, // Same email as previously registered user
          password: 'AnotherPassword123!',
          DOB: '1990-01-01'
        };
        
        const response = await client.post('/api/auth/register', duplicateUser);
        
        if (response.status === 400 || response.status === 409) {
          logTest('Duplicate Email Prevention', true, 'Duplicate email properly rejected');
        } else {
          logTest('Duplicate Email Prevention', false, 'Duplicate email was accepted');
        }
      } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 409) {
          logTest('Duplicate Email Prevention', true, 'Duplicate email properly rejected');
        } else {
          logTest('Duplicate Email Prevention', false, `Unexpected error: ${error.message}`);
        }
      }
    } else {
      logTest('Duplicate Email Prevention', false, 'Skipped - no test user available');
    }

    // Test 9: OAuth Endpoints Availability
    console.log('\n9. 🔗 OAUTH ENDPOINTS TEST'.yellow.bold);
    try {
      const googleResponse = await client.get('/api/auth/oauth/google', {
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      });
      
      if (googleResponse.status === 302) {
        logTest('Google OAuth Endpoint', true, 'Google OAuth endpoint available');
      } else {
        logTest('Google OAuth Endpoint', false, 'Google OAuth endpoint not working');
      }
    } catch (error) {
      if (error.response?.status === 302) {
        logTest('Google OAuth Endpoint', true, 'Google OAuth endpoint available');
      } else {
        logTest('Google OAuth Endpoint', false, `OAuth endpoint error: ${error.message}`);
      }
    }

    try {
      const githubResponse = await client.get('/api/auth/oauth/github', {
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      });
      
      if (githubResponse.status === 302) {
        logTest('GitHub OAuth Endpoint', true, 'GitHub OAuth endpoint available');
      } else {
        logTest('GitHub OAuth Endpoint', false, 'GitHub OAuth endpoint not working');
      }
    } catch (error) {
      if (error.response?.status === 302) {
        logTest('GitHub OAuth Endpoint', true, 'GitHub OAuth endpoint available');
      } else {
        logTest('GitHub OAuth Endpoint', false, `OAuth endpoint error: ${error.message}`);
      }
    }

    return true;

  } catch (error) {
    console.error('Test suite failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await runAuthenticationTests();
  
  // Display Results Summary
  console.log('\n📊 TEST RESULTS SUMMARY'.green.bold);
  console.log('='.repeat(40).green);
  
  const total = testResults.passed + testResults.failed;
  const successRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;
  
  console.log(`✅ Passed: ${testResults.passed}`.green);
  console.log(`❌ Failed: ${testResults.failed}`.red);
  console.log(`📈 Success Rate: ${successRate}%`.cyan);
  
  // Status Assessment
  if (successRate >= 90) {
    console.log('🎉 Authentication Status: EXCELLENT'.green.bold);
  } else if (successRate >= 75) {
    console.log('✅ Authentication Status: GOOD'.yellow.bold);
  } else if (successRate >= 50) {
    console.log('⚠️  Authentication Status: NEEDS IMPROVEMENT'.orange.bold);
  } else {
    console.log('🚨 Authentication Status: CRITICAL ISSUES'.red.bold);
  }
  
  // Detailed Results
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:'.red.bold);
    testResults.tests
      .filter(test => !test.success)
      .forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.name}: ${test.message}`.red);
      });
  }
  
  console.log('\n✅ Authentication testing complete!'.green.bold);
  console.log(`📄 Report generated at: ${new Date().toISOString()}`.gray);
  
  process.exit(successRate >= 75 ? 0 : 1);
}

// Handle SIGINT gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Tests interrupted by user'.yellow);
  process.exit(1);
});

// Run the tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
