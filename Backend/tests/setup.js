/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  generateTestUser: () => ({
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    fullName: 'Test User',
    username: `testuser${Date.now()}`,
    DOB: new Date('1990-01-01')
  }),
  
  generateTestCredentials: () => ({
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!'
  })
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
