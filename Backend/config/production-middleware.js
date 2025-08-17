/**
 * PRODUCTION SECURITY MIDDLEWARE CONFIGURATION
 * 
 * Enhanced security middleware for production deployment with comprehensive
 * authentication testing capabilities and security hardening features.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { sanitizeInput } = require('../middleware/validation');
const winston = require('winston');

// Create logger for security events
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  ]
});

module.exports = (app) => {
  // Enhanced security headers with strict CSP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'strict-dynamic'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  }));

  // Production-ready CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:3000', 'http://localhost:3002'];

  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log suspicious origin attempts
      securityLogger.warn('CORS: Blocked origin', { 
        origin, 
        allowedOrigins,
        userAgent: app.locals.currentReq?.get('User-Agent'),
        ip: app.locals.currentReq?.ip
      });
      
      const msg = `CORS: Origin ${origin} not allowed`;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Rate-Limit-Remaining']
  }));

  // Store current request for logging
  app.use((req, res, next) => {
    app.locals.currentReq = req;
    next();
  });

  // Compression with security considerations
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Don't compress responses that might contain sensitive data
      if (res.getHeader('content-type')?.includes('application/json')) {
        const sensitiveRoutes = ['/api/auth/login', '/api/user/profile'];
        if (sensitiveRoutes.some(route => req.path.includes(route))) {
          return false;
        }
      }
      
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));

  // Enhanced rate limiting with multiple tiers
  const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
    return rateLimit({
      windowMs,
      max,
      message: {
        error: message,
        retryAfter: `${Math.ceil(windowMs / 1000 / 60)} minutes`
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests,
      keyGenerator: (req) => {
        // Use combination of IP and user agent for better accuracy
        return `${req.ip}_${req.get('User-Agent') || 'unknown'}`;
      },
      onLimitReached: (req, res, options) => {
        securityLogger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userAgent: req.get('User-Agent'),
          limit: max,
          windowMs
        });
      },
      skip: (req) => {
        // Skip rate limiting for health checks and certain admin routes
        const skipPaths = ['/api/health'];
        return skipPaths.includes(req.path);
      }
    });
  };

  // Global rate limiting
  app.use(createRateLimit(
    15 * 60 * 1000, // 15 minutes
    process.env.RATE_LIMIT_MAX || 100,
    'Too many requests from this IP, please try again later.'
  ));

  // Strict rate limiting for authentication endpoints
  app.use('/api/auth', createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10, // Much stricter for auth
    'Too many authentication attempts, please try again later.',
    true // Skip successful requests
  ));

  // Very strict rate limiting for registration
  app.use('/api/auth/register', createRateLimit(
    60 * 60 * 1000, // 1 hour
    3, // Only 3 registrations per hour per IP
    'Too many registration attempts, please try again in an hour.'
  ));

  // Moderate rate limiting for submissions
  app.use('/api/problems/*/submit', createRateLimit(
    60 * 1000, // 1 minute
    5, // 5 submissions per minute
    'Too many submissions, please wait before submitting again.'
  ));

  // Body parsing with size limits and validation
  app.use(express.json({ 
    limit: process.env.MAX_FILE_SIZE || '10mb',
    verify: (req, res, buf, encoding) => {
      req.rawBody = buf;
      
      // Log large payloads for monitoring
      if (buf.length > 1024 * 1024) { // > 1MB
        securityLogger.info('Large payload received', {
          size: buf.length,
          path: req.path,
          method: req.method,
          ip: req.ip
        });
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: process.env.MAX_FILE_SIZE || '10mb'
  }));

  // Enhanced session configuration with MongoDB store
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'oj_session', // Custom session name
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Require HTTPS in production
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
  };

  // Use MongoDB for session storage in production
  if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI) {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600, // Lazy session update
      crypto: {
        secret: process.env.SESSION_SECRET
      }
    });
  }

  app.use(session(sessionConfig));

  // Enhanced input sanitization
  app.use(sanitizeInput);

  // Security event logging middleware
  app.use((req, res, next) => {
    // Log sensitive operations
    const sensitiveOps = ['POST /api/auth/login', 'POST /api/auth/register', 'DELETE'];
    const operation = `${req.method} ${req.path}`;
    
    if (sensitiveOps.some(op => operation.includes(op))) {
      securityLogger.info('Sensitive operation', {
        operation,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        sessionId: req.sessionID
      });
    }
    
    next();
  });

  // Request logging for development
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  // Trust proxy settings for production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Add security testing endpoints for production validation
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/security/test-headers', (req, res) => {
      res.json({
        message: 'Security headers test endpoint',
        headers: req.headers,
        secure: req.secure,
        protocol: req.protocol,
        cookies: req.cookies,
        session: req.session ? 'present' : 'absent'
      });
    });

    app.get('/api/security/test-cors', (req, res) => {
      res.json({
        message: 'CORS test endpoint',
        origin: req.headers.origin,
        allowedOrigins,
        method: req.method
      });
    });
  }
};
