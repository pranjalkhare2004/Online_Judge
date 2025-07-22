/**
 * CONFIGURATION MANAGEMENT
 * 
 * Purpose: Centralized configuration management for the entire backend application.
 * This file loads environment variables and provides a single source of truth for
 * all application settings.
 * 
 * Key Responsibilities:
 * - Load and validate environment variables
 * - Provide default values for development
 * - Configure database connection settings
 * - Set up JWT authentication parameters
 * - Define CORS and security policies
 * 
 * Why this exists: Having all configuration in one place makes the application
 * easier to maintain and deploy across different environments (development, staging, production).
 * It prevents hardcoded values scattered throughout the codebase.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the backend root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URL || 'mongodb://localhost:27017/online-judge',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || process.env.SECRET_KEY || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // CORS configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002']
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@algouniversity.com'
  },

  // Code execution service
  codeExecution: {
    url: process.env.CODE_EXECUTION_URL || 'http://localhost:3001',
    timeout: parseInt(process.env.CODE_EXECUTION_TIMEOUT, 10) || 30000,
    maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 10
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    enableConsole: process.env.LOG_CONSOLE !== 'false'
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'session-secret-key',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE, 10) || 24 * 60 * 60 * 1000 // 24 hours
  },

  // Admin configuration
  admin: {
    defaultEmail: process.env.ADMIN_EMAIL || 'admin@algouniversity.com',
    defaultPassword: process.env.ADMIN_PASSWORD || 'Admin@123'
  }
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  if (config.env === 'production') {
    process.exit(1);
  }
}

module.exports = config;
