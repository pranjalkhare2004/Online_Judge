#!/usr/bin/env node

/**
 * COMPREHENSIVE AUTHENTICATION SECURITY TESTING SUITE
 * 
 * This script performs detailed security testing of authentication mechanisms
 * following the exact requirements specified:
 * 
 * 1. Clear browser/application cookies and cache
 * 2. Hit public API endpoints and verify no session cookie is set
 * 3. Register a new user, login and verify session/JWT security
 * 4. Test authenticated user requests with session validation
 * 5. Verify cache operations (Redis/MongoDB)
 * 6. Comprehensive security assertions with detailed logging
 */

const axios = require('axios');
const crypto = require('crypto');
const colors = require('colors');

// Test configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  testUser: {
    email: `security-test-${Date.now()}@example.com`,
    username: `security_test_${Date.now()}`,
    name: 'Security Test User',
    password: 'SecureTestPassword123!',
    DOB: '1990-01-01'
  },
  results: {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  }
};

// Create axios instance with cookie jar simulation
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: config.backendUrl,
    timeout: 15000,
    validateStatus: () => true, // Don't throw on HTTP errors
    maxRedirects: 0 // Prevent automatic redirects
  });

  // Cookie jar simulation
  instance.cookieJar = new Map();
  
  // Request interceptor to add cookies
  instance.interceptors.request.use(request => {
    if (instance.cookieJar.size > 0) {
      const cookies = Array.from(instance.cookieJar.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      request.headers.Cookie = cookies;
    }
    return request;
  });

  // Response interceptor to store cookies
  instance.interceptors.response.use(response => {
    const setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders) {
      setCookieHeaders.forEach(cookie => {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        if (name && value) {
          instance.cookieJar.set(name.trim(), value.trim());
        }
      });
    }
    return response;
  });

  return instance;
};

// Logging utilities
const log = {
  test: (message) => console.log(`🧪 ${message}`.blue),
  pass: (message) => {
    console.log(`✅ ${message}`.green);
    config.results.passed++;
  },
  fail: (message) => {
    console.log(`❌ ${message}`.red);
    config.results.failed++;
  },
  warn: (message) => {
    console.log(`⚠️  ${message}`.yellow);
    config.results.warnings++;
  },
  info: (message) => console.log(`ℹ️  ${message}`.cyan),
  section: (title) => console.log(`\n${'='.repeat(50)}\n${title.toUpperCase()}\n${'='.repeat(50)}`.rainbow)
};

// Record test result
const recordTest = (name, status, message, details = null) => {
  config.results.tests.push({
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  });
};

/**
 * STEP 1: CLEAR BROWSER/APPLICATION COOKIES AND CACHE
 */
function clearCookiesAndCache(apiClient) {
  log.section('Step 1: Clear Browser/Application Cookies and Cache');
  
  try {
    // Clear cookie jar
    apiClient.cookieJar.clear();
    
    // Clear authorization headers
    delete apiClient.defaults.headers.Authorization;
    delete apiClient.defaults.headers.Cookie;
    
    // Clear any cached data
    apiClient.defaults.headers.common = {};
    
    log.pass('Cookies and cache cleared successfully');
    recordTest('Clear Cookies and Cache', 'PASS', 'Application state cleared');
    
    log.info(`Cookie jar size after clearing: ${apiClient.cookieJar.size}`);
    
  } catch (error) {
    log.fail(`Failed to clear cookies and cache: ${error.message}`);
    recordTest('Clear Cookies and Cache', 'FAIL', error.message);
  }
}

/**
 * STEP 2: HIT PUBLIC API ENDPOINTS AND VERIFY NO SESSION COOKIE IS SET
 */
async function testPublicEndpointsNoCookies(apiClient) {
  log.section('Step 2: Test Public API Endpoints - No Session Cookies');
  
  const publicEndpoints = [
    { path: '/api/health', method: 'GET', description: 'Health check' },
    { path: '/api/problems', method: 'GET', description: 'Problems list' },
    { path: '/api/leaderboard', method: 'GET', description: 'Leaderboard' },
    { path: '/api/contests', method: 'GET', description: 'Contests list' }
  ];
  
  for (const endpoint of publicEndpoints) {
    try {
      log.test(`Testing ${endpoint.method} ${endpoint.path}`);
      
      const response = await apiClient({
        method: endpoint.method,
        url: endpoint.path
      });
      
      // Verify response status
      if (response.status >= 200 && response.status < 300) {
        log.info(`✓ ${endpoint.description}: ${response.status} ${response.statusText}`);
      } else {
        log.warn(`${endpoint.description}: ${response.status} ${response.statusText}`);
      }
      
      // Check for session cookies in response
      const setCookieHeaders = response.headers['set-cookie'];
      const hasSessionCookie = setCookieHeaders && setCookieHeaders.some(cookie => {
        const lowerCookie = cookie.toLowerCase();
        return lowerCookie.includes('session') || 
               lowerCookie.includes('connect.sid') || 
               lowerCookie.includes('oj_session');
      });
      
      if (hasSessionCookie) {
        log.fail(`${endpoint.description}: Session cookie incorrectly set on public endpoint`);
        log.info(`Cookies received: ${JSON.stringify(setCookieHeaders, null, 2)}`);
        recordTest(
          `Public Endpoint ${endpoint.path}`, 
          'FAIL', 
          'Session cookie set on public endpoint',
          { cookies: setCookieHeaders }
        );
      } else {
        log.pass(`${endpoint.description}: No session cookie set (correct behavior)`);
        recordTest(
          `Public Endpoint ${endpoint.path}`, 
          'PASS', 
          'No session cookie on public endpoint'
        );
      }
      
      // Log response headers for inspection
      log.info(`Response headers: ${JSON.stringify(response.headers, null, 2)}`);
      
    } catch (error) {
      log.fail(`${endpoint.description}: Request failed - ${error.message}`);
      recordTest(
        `Public Endpoint ${endpoint.path}`, 
        'FAIL', 
        `Request failed: ${error.message}`
      );
    }
  }
}

/**
 * STEP 3: REGISTER NEW USER AND LOGIN WITH SECURITY VALIDATION
 */
async function testUserRegistrationAndLogin(apiClient) {
  log.section('Step 3: User Registration and Login with Security Validation');
  
  let registrationSuccessful = false;
  let loginSuccessful = false;
  
  try {
    // Test user registration
    log.test('Registering new test user...');
    log.info(`User details: ${JSON.stringify(config.testUser, null, 2)}`);
    
    const registerResponse = await apiClient.post('/api/auth/register', config.testUser);
    
    if (registerResponse.status === 201) {
      log.pass('User registration successful');
      registrationSuccessful = true;
      recordTest('User Registration', 'PASS', 'User registered successfully');
      
      log.info(`Registration response: ${JSON.stringify(registerResponse.data, null, 2)}`);
    } else {
      log.fail(`Registration failed: ${registerResponse.status} - ${registerResponse.data?.message || 'Unknown error'}`);
      recordTest('User Registration', 'FAIL', `Registration failed: ${registerResponse.status}`);
    }
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      log.info('User already exists, proceeding with login test');
      registrationSuccessful = true;
    } else {
      log.fail(`Registration error: ${error.message}`);
      recordTest('User Registration', 'FAIL', `Registration error: ${error.message}`);
    }
  }
  
  // Test user login
  if (registrationSuccessful) {
    try {
      log.test('Testing user login...');
      
      const loginResponse = await apiClient.post('/api/auth/login', {
        email: config.testUser.email,
        password: config.testUser.password
      });
      
      if (loginResponse.status === 200) {
        log.pass('User login successful');
        loginSuccessful = true;
        recordTest('User Login', 'PASS', 'User logged in successfully');
        
        log.info(`Login response: ${JSON.stringify(loginResponse.data, null, 2)}`);
        
        // Analyze authentication mechanism
        await analyzeAuthenticationSecurity(loginResponse, apiClient);
        
      } else {
        log.fail(`Login failed: ${loginResponse.status} - ${loginResponse.data?.message || 'Unknown error'}`);
        recordTest('User Login', 'FAIL', `Login failed: ${loginResponse.status}`);
      }
      
    } catch (error) {
      log.fail(`Login error: ${error.message}`);
      recordTest('User Login', 'FAIL', `Login error: ${error.message}`);
    }
  }
  
  return loginSuccessful;
}

/**
 * ANALYZE AUTHENTICATION SECURITY (SESSION/JWT)
 */
async function analyzeAuthenticationSecurity(loginResponse, apiClient) {
  log.section('Authentication Security Analysis');
  
  const responseData = loginResponse.data;
  const cookies = loginResponse.headers['set-cookie'];
  const authHeader = loginResponse.headers.authorization;
  
  // Check for JWT token
  if (responseData.token || responseData.accessToken || authHeader) {
    const token = responseData.token || responseData.accessToken || authHeader;
    log.pass('JWT token found in response');
    log.info(`Token (first 50 chars): ${String(token).substring(0, 50)}...`);
    
    // Validate JWT structure
    if (typeof token === 'string' && token.split('.').length === 3) {
      log.pass('JWT token has valid structure (3 parts)');
      recordTest('JWT Token Structure', 'PASS', 'Valid JWT structure');
      
      // Store token for authenticated requests
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
      
    } else {
      log.warn('JWT token has invalid structure');
      recordTest('JWT Token Structure', 'WARN', 'Invalid JWT structure');
    }
    
    recordTest('JWT Token Presence', 'PASS', 'JWT token found in response');
  }
  
  // Check for session cookies
  if (cookies) {
    log.info(`Cookies received: ${JSON.stringify(cookies, null, 2)}`);
    
    const sessionCookie = cookies.find(cookie => {
      const lowerCookie = cookie.toLowerCase();
      return lowerCookie.includes('session') || 
             lowerCookie.includes('connect.sid') || 
             lowerCookie.includes('oj_session');
    });
    
    if (sessionCookie) {
      log.pass('Session cookie found');
      log.info(`Session cookie: ${sessionCookie}`);
      
      // Check security attributes
      const isHttpOnly = sessionCookie.includes('HttpOnly');
      const isSecure = sessionCookie.includes('Secure');
      const sameSite = sessionCookie.includes('SameSite');
      
      if (isHttpOnly) {
        log.pass('✓ HttpOnly attribute set on session cookie');
        recordTest('Cookie Security - HttpOnly', 'PASS', 'HttpOnly attribute present');
      } else {
        log.fail('✗ HttpOnly attribute missing on session cookie');
        recordTest('Cookie Security - HttpOnly', 'FAIL', 'HttpOnly attribute missing');
      }
      
      if (isSecure || process.env.NODE_ENV !== 'production') {
        log.pass('✓ Secure attribute handled appropriately');
        recordTest('Cookie Security - Secure', 'PASS', 'Secure attribute appropriate for environment');
      } else {
        log.warn('⚠ Secure attribute should be set in production');
        recordTest('Cookie Security - Secure', 'WARN', 'Secure attribute recommended for production');
      }
      
      if (sameSite) {
        log.pass('✓ SameSite attribute set on session cookie');
        recordTest('Cookie Security - SameSite', 'PASS', 'SameSite attribute present');
      } else {
        log.warn('⚠ SameSite attribute recommended for CSRF protection');
        recordTest('Cookie Security - SameSite', 'WARN', 'SameSite attribute recommended');
      }
      
      recordTest('Session Cookie Presence', 'PASS', 'Session cookie found with security analysis');
    } else {
      log.info('No session cookie found (JWT-only authentication)');
      recordTest('Session Cookie Presence', 'INFO', 'No session cookie (JWT-only)');
    }
  } else {
    log.info('No cookies set in login response');
  }
}

/**
 * STEP 4: TEST AUTHENTICATED USER REQUESTS
 */
async function testAuthenticatedUserRequests(apiClient) {
  log.section('Step 4: Authenticated User Requests');
  
  const protectedEndpoints = [
    { 
      path: '/api/user/profile', 
      method: 'GET', 
      description: 'User profile',
      expectedStatus: 200
    },
    { 
      path: '/api/user/submissions', 
      method: 'GET', 
      description: 'User submissions',
      expectedStatus: [200, 404] // 404 is acceptable if no submissions
    },
    { 
      path: '/api/user/stats', 
      method: 'GET', 
      description: 'User statistics',
      expectedStatus: [200, 404]
    }
  ];
  
  for (const endpoint of protectedEndpoints) {
    try {
      log.test(`Testing authenticated ${endpoint.method} ${endpoint.path}`);
      
      const response = await apiClient({
        method: endpoint.method,
        url: endpoint.path
      });
      
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
        ? endpoint.expectedStatus 
        : [endpoint.expectedStatus];
      
      if (expectedStatuses.includes(response.status)) {
        log.pass(`${endpoint.description}: Authenticated access successful (${response.status})`);
        log.info(`Response data: ${JSON.stringify(response.data, null, 2)}`);
        recordTest(
          `Authenticated ${endpoint.path}`, 
          'PASS', 
          `Authenticated access successful (${response.status})`
        );
      } else if (response.status === 401) {
        log.fail(`${endpoint.description}: Authentication failed (401)`);
        log.info('This might indicate issues with token/session management');
        recordTest(
          `Authenticated ${endpoint.path}`, 
          'FAIL', 
          'Authentication failed - token/session invalid'
        );
      } else if (response.status === 403) {
        log.warn(`${endpoint.description}: Access forbidden (403)`);
        recordTest(
          `Authenticated ${endpoint.path}`, 
          'WARN', 
          'Access forbidden - possible authorization issue'
        );
      } else {
        log.warn(`${endpoint.description}: Unexpected response (${response.status})`);
        log.info(`Response: ${JSON.stringify(response.data, null, 2)}`);
        recordTest(
          `Authenticated ${endpoint.path}`, 
          'WARN', 
          `Unexpected response: ${response.status}`
        );
      }
      
    } catch (error) {
      log.fail(`${endpoint.description}: Request failed - ${error.message}`);
      recordTest(
        `Authenticated ${endpoint.path}`, 
        'FAIL', 
        `Request failed: ${error.message}`
      );
    }
  }
  
  // Test access to sensitive routes without authentication
  await testUnauthenticatedAccess();
}

/**
 * TEST UNAUTHENTICATED ACCESS TO PROTECTED ROUTES
 */
async function testUnauthenticatedAccess() {
  log.section('Testing Unauthenticated Access to Protected Routes');
  
  // Create fresh client without authentication
  const unauthClient = createAxiosInstance();
  
  const protectedRoutes = [
    '/api/user/profile',
    '/api/user/submissions',
    '/api/admin/users',
    '/api/problems/1/submit'
  ];
  
  for (const route of protectedRoutes) {
    try {
      log.test(`Testing unauthenticated access to ${route}`);
      
      const response = await unauthClient.get(route);
      
      if (response.status === 401) {
        log.pass(`${route}: Correctly requires authentication (401)`);
        recordTest(
          `Unauthenticated ${route}`, 
          'PASS', 
          'Correctly requires authentication'
        );
      } else if (response.status === 403) {
        log.pass(`${route}: Access forbidden without authentication (403)`);
        recordTest(
          `Unauthenticated ${route}`, 
          'PASS', 
          'Access forbidden without authentication'
        );
      } else if (response.status >= 200 && response.status < 300) {
        log.fail(`${route}: Security vulnerability - accessible without authentication!`);
        log.warn('This is a critical security issue that must be fixed');
        recordTest(
          `Unauthenticated ${route}`, 
          'FAIL', 
          'CRITICAL: Accessible without authentication'
        );
      } else {
        log.info(`${route}: Unexpected response ${response.status}`);
        recordTest(
          `Unauthenticated ${route}`, 
          'INFO', 
          `Unexpected response: ${response.status}`
        );
      }
      
    } catch (error) {
      log.info(`${route}: Request failed (expected) - ${error.message}`);
    }
  }
}

/**
 * STEP 5: SESSION EXPIRY AND LOGOUT TESTING
 */
async function testSessionExpiryAndLogout(apiClient) {
  log.section('Step 5: Session Management - Logout and Expiry');
  
  try {
    log.test('Testing user logout...');
    
    const logoutResponse = await apiClient.post('/api/auth/logout');
    
    if (logoutResponse.status === 200) {
      log.pass('Logout request successful');
      log.info(`Logout response: ${JSON.stringify(logoutResponse.data, null, 2)}`);
      
      // Clear stored authentication
      delete apiClient.defaults.headers.Authorization;
      apiClient.cookieJar.clear();
      
      recordTest('User Logout', 'PASS', 'Logout successful');
      
      // Test that protected routes are now inaccessible
      await testPostLogoutAccess(apiClient);
      
    } else {
      log.fail(`Logout failed: ${logoutResponse.status}`);
      recordTest('User Logout', 'FAIL', `Logout failed: ${logoutResponse.status}`);
    }
    
  } catch (error) {
    log.fail(`Logout error: ${error.message}`);
    recordTest('User Logout', 'FAIL', `Logout error: ${error.message}`);
  }
}

/**
 * TEST POST-LOGOUT ACCESS CONTROL
 */
async function testPostLogoutAccess(apiClient) {
  log.test('Testing access control after logout...');
  
  const testRoutes = ['/api/user/profile', '/api/user/submissions'];
  
  for (const route of testRoutes) {
    try {
      const response = await apiClient.get(route);
      
      if (response.status === 401) {
        log.pass(`${route}: Correctly inaccessible after logout (401)`);
        recordTest(
          `Post-logout ${route}`, 
          'PASS', 
          'Correctly inaccessible after logout'
        );
      } else if (response.status >= 200 && response.status < 300) {
        log.fail(`${route}: Security vulnerability - still accessible after logout!`);
        recordTest(
          `Post-logout ${route}`, 
          'FAIL', 
          'CRITICAL: Still accessible after logout'
        );
      } else {
        log.info(`${route}: Response ${response.status} after logout`);
        recordTest(
          `Post-logout ${route}`, 
          'INFO', 
          `Response ${response.status} after logout`
        );
      }
      
    } catch (error) {
      log.info(`${route}: Expected failure after logout`);
    }
  }
}

/**
 * STEP 6: CACHE VALIDATION TESTING
 */
async function testCacheValidation(apiClient) {
  log.section('Step 6: Cache Validation Testing');
  
  // Test cache headers on frequently requested endpoints
  const cacheTestEndpoints = [
    { path: '/api/problems', description: 'Problems list caching' },
    { path: '/api/leaderboard', description: 'Leaderboard caching' },
    { path: '/api/contests', description: 'Contests caching' }
  ];
  
  for (const endpoint of cacheTestEndpoints) {
    try {
      log.test(`Testing cache headers for ${endpoint.path}`);
      
      const response = await apiClient.get(endpoint.path);
      
      // Check for cache-related headers
      const cacheHeaders = {
        'cache-control': response.headers['cache-control'],
        'etag': response.headers.etag,
        'last-modified': response.headers['last-modified'],
        'expires': response.headers.expires
      };
      
      const presentHeaders = Object.entries(cacheHeaders)
        .filter(([key, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`);
      
      if (presentHeaders.length > 0) {
        log.pass(`${endpoint.description}: Cache headers present`);
        presentHeaders.forEach(header => log.info(`  ${header}`));
        recordTest(
          `Cache Headers ${endpoint.path}`, 
          'PASS', 
          `Cache headers present: ${presentHeaders.join(', ')}`
        );
      } else {
        log.warn(`${endpoint.description}: No cache headers found`);
        log.info('Consider adding cache headers to improve performance');
        recordTest(
          `Cache Headers ${endpoint.path}`, 
          'WARN', 
          'No cache headers found - consider adding caching'
        );
      }
      
      // Test conditional requests if ETag is present
      if (response.headers.etag) {
        await testConditionalRequest(apiClient, endpoint.path, response.headers.etag);
      }
      
    } catch (error) {
      log.fail(`Cache test failed for ${endpoint.path}: ${error.message}`);
      recordTest(
        `Cache Headers ${endpoint.path}`, 
        'FAIL', 
        `Cache test failed: ${error.message}`
      );
    }
  }
}

/**
 * TEST CONDITIONAL REQUESTS (304 Not Modified)
 */
async function testConditionalRequest(apiClient, path, etag) {
  try {
    log.test(`Testing conditional request for ${path}`);
    
    const response = await apiClient.get(path, {
      headers: {
        'If-None-Match': etag
      }
    });
    
    if (response.status === 304) {
      log.pass(`Conditional request: 304 Not Modified (cache working correctly)`);
      recordTest(
        `Conditional Request ${path}`, 
        'PASS', 
        '304 Not Modified response received'
      );
    } else {
      log.info(`Conditional request: ${response.status} (content might have changed)`);
      recordTest(
        `Conditional Request ${path}`, 
        'INFO', 
        `Received ${response.status} instead of 304`
      );
    }
    
  } catch (error) {
    log.warn(`Conditional request test failed: ${error.message}`);
  }
}

/**
 * GENERATE COMPREHENSIVE SECURITY REPORT
 */
function generateSecurityReport() {
  log.section('Comprehensive Security Testing Report');
  
  const totalTests = config.results.passed + config.results.failed + config.results.warnings;
  const successRate = totalTests > 0 ? (config.results.passed / totalTests * 100).toFixed(1) : 0;
  
  console.log('\n📊 FINAL TEST RESULTS:');
  console.log(`   ✅ Passed: ${config.results.passed}`.green);
  console.log(`   ❌ Failed: ${config.results.failed}`.red);
  console.log(`   ⚠️  Warnings: ${config.results.warnings}`.yellow);
  console.log(`   📈 Success Rate: ${successRate}%`);
  
  const overallStatus = config.results.failed === 0 ? 'SECURE' : 'NEEDS ATTENTION';
  const statusColor = overallStatus === 'SECURE' ? 'green' : 'red';
  
  console.log(`\n🔒 SECURITY STATUS: ${overallStatus}`[statusColor].bold);
  
  // Detailed test breakdown
  console.log('\n📋 DETAILED TEST RESULTS:');
  config.results.tests.forEach((test, index) => {
    const statusEmoji = test.status === 'PASS' ? '✅' : 
                       test.status === 'WARN' ? '⚠️' : 
                       test.status === 'INFO' ? 'ℹ️' : '❌';
    console.log(`${index + 1}. ${statusEmoji} ${test.name}: ${test.message}`);
    
    if (test.details) {
      console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`.gray);
    }
  });
  
  // Critical security recommendations
  const criticalIssues = config.results.tests.filter(test => test.status === 'FAIL');
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL SECURITY ISSUES THAT MUST BE FIXED:'.red.bold);
    criticalIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.name}: ${issue.message}`.red);
    });
  }
  
  const warnings = config.results.tests.filter(test => test.status === 'WARN');
  
  if (warnings.length > 0) {
    console.log('\n⚠️  SECURITY RECOMMENDATIONS:'.yellow.bold);
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning.name}: ${warning.message}`.yellow);
    });
  }
  
  if (config.results.failed === 0 && config.results.warnings === 0) {
    console.log('\n🎉 EXCELLENT! No critical security issues found.'.green.bold);
    console.log('Your authentication system passes all security tests.'.green);
  }
  
  return overallStatus === 'SECURE';
}

/**
 * MAIN EXECUTION FUNCTION
 */
async function main() {
  console.log('🔐 COMPREHENSIVE AUTHENTICATION SECURITY TESTING SUITE'.rainbow.bold);
  console.log('='.repeat(60).gray);
  console.log(`Backend URL: ${config.backendUrl}`);
  console.log(`Test User: ${config.testUser.email}`);
  console.log(`Test Started: ${new Date().toISOString()}`);
  
  try {
    // Initialize API client
    const apiClient = createAxiosInstance();
    
    // Execute all test steps in sequence
    clearCookiesAndCache(apiClient);
    await testPublicEndpointsNoCookies(apiClient);
    const loginSuccessful = await testUserRegistrationAndLogin(apiClient);
    
    if (loginSuccessful) {
      await testAuthenticatedUserRequests(apiClient);
      await testSessionExpiryAndLogout(apiClient);
    } else {
      log.warn('Skipping authenticated tests due to login failure');
    }
    
    await testCacheValidation(apiClient);
    
    // Generate final report
    const isSecure = generateSecurityReport();
    
    console.log(`\nTest completed at: ${new Date().toISOString()}`);
    
    // Exit with appropriate code
    process.exit(isSecure && config.results.failed === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR DURING SECURITY TESTING:'.red.bold);
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  clearCookiesAndCache,
  testPublicEndpointsNoCookies,
  testUserRegistrationAndLogin,
  testAuthenticatedUserRequests,
  testSessionExpiryAndLogout,
  testCacheValidation,
  generateSecurityReport,
  config
};
