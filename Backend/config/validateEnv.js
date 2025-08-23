/**
 * ENVIRONMENT VARIABLES VALIDATION
 * 
 * DESCRIPTION:
 * This file validates the presence and format of environment variables required
 * for the Online Judge backend application. It ensures all critical configuration
 * variables are set before the application starts, preventing runtime failures
 * due to missing configuration. Provides warnings for optional variables.
 * 
 * FUNCTIONS USED:
 * - validateEnvironment(): Main validation function for all environment variables
 * - process.env access: Reading environment variables
 * - Array.forEach(): Iterating through required/optional variables
 * - console.error(): Error logging for missing variables
 * - console.warn(): Warning logging for optional variables
 * - process.exit(): Application termination on critical errors
 * 
 * EXPORTS:
 * - validateEnvironment: Function to validate all environment variables
 * 
 * USED BY:
 * - server.js: Environment validation before server startup
 * - tests/setup.js: Test environment validation
 * 
 * VALIDATED VARIABLES:
 * Required:
 * - MONGODB_URI: Database connection string
 * - JWT_SECRET: JSON Web Token signing secret
 * - SESSION_SECRET: Session encryption secret
 * - FRONTEND_URL: Frontend application URL for CORS
 * 
 * Optional:
 * - GOOGLE_CLIENT_ID/SECRET: Google OAuth credentials
 * - GITHUB_CLIENT_ID/SECRET: GitHub OAuth credentials
 * - EMAIL_*: Email service configuration
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'SESSION_SECRET',
  'FRONTEND_URL'
];

const optionalEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const validateEnvironment = () => {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  // Check for placeholder values in critical variables
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('your-')) {
    warnings.push('JWT_SECRET appears to be a placeholder value');
  }

  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.includes('your-')) {
    warnings.push('SESSION_SECRET appears to be a placeholder value');
  }

  // Check OAuth configuration completeness
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const hasGithubConfig = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

  if (!hasGoogleConfig && !hasGithubConfig) {
    warnings.push('No OAuth providers configured (Google or GitHub)');
  }

  // Display results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
    console.warn('');
  }

  console.log('✅ Environment validation passed');

  // Additional security checks
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET is too short for production (minimum 32 characters)');
      process.exit(1);
    }

    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      console.error('❌ SESSION_SECRET is too short for production (minimum 32 characters)');
      process.exit(1);
    }
  }
};

module.exports = validateEnvironment;
