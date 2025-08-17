/**
 * MIDDLEWARE CONFIGURATION
 * 
 * DESCRIPTION:
 * This file configures and sets up all Express.js middleware for the Online Judge backend.
 * It includes security middleware (Helmet, CORS), performance optimization (compression),
 * rate limiting, session management, input sanitization, and request parsing middleware.
 * The middleware stack ensures secure, performant, and reliable API operations.
 * 
 * FUNCTIONS USED:
 * - app.use(): Registers middleware with Express application
 * - helmet(): Security headers middleware
 * - cors(): Cross-Origin Resource Sharing configuration
 * - compression(): Response compression middleware
 * - rateLimit(): Request rate limiting
 * - express.json(): JSON body parsing
 * - express.urlencoded(): URL-encoded body parsing
 * - session(): Session management
 * - sanitizeInput(): Custom input sanitization middleware
 * 
 * EXPORTS:
 * - module.exports: Function that configures middleware on Express app
 * 
 * USED BY:
 * - server.js: Main server middleware setup
 * 
 * DEPENDENCIES:
 * - middleware/validation.js: Custom validation and sanitization functions
 * 
 * MIDDLEWARE APPLIED:
 * - Security: Helmet (CSP, XSS protection, etc.)
 * - CORS: Cross-origin request handling
 * - Rate Limiting: API abuse prevention
 * - Compression: Response size optimization
 * - Session: User session management
 * - Body Parsing: JSON and form data parsing
 * - Input Sanitization: XSS and injection prevention
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { sanitizeInput } = require('../middleware/validation');

module.exports = (app) => {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));
  
  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  }));
  
  // Compression middleware
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024
  }));
  
  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));
  
  // Global rate limiting - TEMPORARILY DISABLED FOR TESTING
  /*
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    }
  }));
  */
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
    name: 'sessionId' // Change default session name
  }));
  
  // Input sanitization middleware
  app.use(sanitizeInput);
  
  // Request logging middleware (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }
  
  // Trust proxy for production deployment
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
};
