const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * Security Configuration Checker
 * Validates security settings across the authentication system
 */

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(level, category, message, fix = null) {
    const entry = { level, category, message, fix };
    
    switch (level) {
      case 'error':
        this.issues.push(entry);
        break;
      case 'warning':
        this.warnings.push(entry);
        break;
      case 'pass':
        this.passed.push(entry);
        break;
    }
  }

  checkEnvironmentVariables() {
    console.log('🔍 Checking Environment Variables...');
    
    const requiredEnvVars = [
      'JWT_SECRET',
      'MONGODB_URI',
      'SESSION_SECRET',
      'NODE_ENV'
    ];

    const sensitiveEnvVars = [
      'JWT_SECRET',
      'SESSION_SECRET',
      'MONGODB_URI',
      'REDIS_URL'
    ];

    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        this.log('error', 'Environment', `Missing required environment variable: ${varName}`, 
          'Set this variable in your .env file');
      } else {
        this.log('pass', 'Environment', `Required variable ${varName} is set`);
      }
    });

    // Check JWT_SECRET strength
    if (process.env.JWT_SECRET) {
      if (process.env.JWT_SECRET.length < 32) {
        this.log('warning', 'Environment', 'JWT_SECRET should be at least 32 characters long',
          'Generate a longer, more secure secret');
      } else {
        this.log('pass', 'Environment', 'JWT_SECRET has adequate length');
      }

      if (process.env.JWT_SECRET === 'your-secret-key' || 
          process.env.JWT_SECRET === 'secret' || 
          process.env.JWT_SECRET === '123456') {
        this.log('error', 'Environment', 'JWT_SECRET is using a default/weak value',
          'Use a cryptographically secure random string');
      }
    }

    // Check NODE_ENV
    if (process.env.NODE_ENV === 'production') {
      this.log('pass', 'Environment', 'NODE_ENV is set to production');
      
      // Production-specific checks
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.includes('dev')) {
        this.log('error', 'Environment', 'Development JWT_SECRET detected in production',
          'Use a production-specific JWT_SECRET');
      }
    } else {
      this.log('warning', 'Environment', 'NODE_ENV is not set to production');
    }
  }

  checkPackageVulnerabilities() {
    console.log('🔍 Checking Package Security...');
    
    const packageJsonPath = path.join(__dirname, '../package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.log('warning', 'Dependencies', 'package.json not found');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check for known vulnerable packages (this would typically use npm audit)
    const knownVulnerablePackages = [
      'lodash@4.17.15',
      'mongoose@5.9.0',
      'express@4.16.0'
    ];

    if (packageJson.dependencies) {
      Object.entries(packageJson.dependencies).forEach(([pkg, version]) => {
        const fullPackage = `${pkg}@${version}`;
        if (knownVulnerablePackages.includes(fullPackage)) {
          this.log('error', 'Dependencies', `Vulnerable package detected: ${fullPackage}`,
            'Update to a secure version');
        }
      });
    }

    // Check for security-related packages
    const securityPackages = ['helmet', 'express-rate-limit', 'cors', 'express-validator'];
    securityPackages.forEach(pkg => {
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        this.log('pass', 'Dependencies', `Security package ${pkg} is installed`);
      } else {
        this.log('warning', 'Dependencies', `Security package ${pkg} not found`,
          `Install ${pkg} for enhanced security`);
      }
    });
  }

  checkServerConfiguration() {
    console.log('🔍 Checking Server Configuration...');
    
    const serverJsPath = path.join(__dirname, '../server.js');
    if (!fs.existsSync(serverJsPath)) {
      this.log('warning', 'Server', 'server.js not found');
      return;
    }

    const serverContent = fs.readFileSync(serverJsPath, 'utf8');

    // Check for helmet usage
    if (serverContent.includes('helmet')) {
      this.log('pass', 'Server', 'Helmet security middleware detected');
    } else {
      this.log('warning', 'Server', 'Helmet security middleware not detected',
        'Add helmet middleware for security headers');
    }

    // Check for rate limiting
    if (serverContent.includes('express-rate-limit') || serverContent.includes('rateLimit')) {
      this.log('pass', 'Server', 'Rate limiting middleware detected');
    } else {
      this.log('warning', 'Server', 'Rate limiting not detected',
        'Add express-rate-limit for DoS protection');
    }

    // Check for CORS configuration
    if (serverContent.includes('cors')) {
      this.log('pass', 'Server', 'CORS middleware detected');
    } else {
      this.log('warning', 'Server', 'CORS middleware not detected',
        'Configure CORS for secure cross-origin requests');
    }

    // Check for express.json() with size limits
    if (serverContent.includes('limit:')) {
      this.log('pass', 'Server', 'Request size limits detected');
    } else {
      this.log('warning', 'Server', 'Request size limits not detected',
        'Add size limits to express.json() and express.urlencoded()');
    }
  }

  checkAuthenticationConfiguration() {
    console.log('🔍 Checking Authentication Configuration...');
    
    const authMiddlewarePath = path.join(__dirname, '../middleware/auth.js');
    if (!fs.existsSync(authMiddlewarePath)) {
      this.log('error', 'Auth', 'Authentication middleware not found');
      return;
    }

    const authContent = fs.readFileSync(authMiddlewarePath, 'utf8');

    // Check JWT verification with issuer/audience
    if (authContent.includes('issuer') && authContent.includes('audience')) {
      this.log('pass', 'Auth', 'JWT verification includes issuer/audience validation');
    } else {
      this.log('warning', 'Auth', 'JWT verification missing issuer/audience validation',
        'Add issuer and audience validation to JWT verification');
    }

    // Check for user existence validation
    if (authContent.includes('findById') && authContent.includes('user not found')) {
      this.log('pass', 'Auth', 'Token validation includes user existence check');
    } else {
      this.log('warning', 'Auth', 'Token validation missing user existence check',
        'Validate that the user still exists when verifying tokens');
    }

    // Check for account status validation
    if (authContent.includes('isActive')) {
      this.log('pass', 'Auth', 'Token validation includes account status check');
    } else {
      this.log('warning', 'Auth', 'Token validation missing account status check',
        'Check if user account is still active during token validation');
    }
  }

  checkPasswordSecurity() {
    console.log('🔍 Checking Password Security...');
    
    const userModelPath = path.join(__dirname, '../models/User.js');
    if (!fs.existsSync(userModelPath)) {
      this.log('error', 'Password', 'User model not found');
      return;
    }

    const userModelContent = fs.readFileSync(userModelPath, 'utf8');

    // Check for bcrypt usage
    if (userModelContent.includes('bcrypt')) {
      this.log('pass', 'Password', 'bcrypt password hashing detected');
      
      // Check for sufficient salt rounds
      if (userModelContent.includes('10') || userModelContent.includes('12') || userModelContent.includes('14')) {
        this.log('pass', 'Password', 'Adequate bcrypt salt rounds detected');
      } else {
        this.log('warning', 'Password', 'bcrypt salt rounds might be insufficient',
          'Use at least 10 salt rounds for bcrypt');
      }
    } else {
      this.log('error', 'Password', 'bcrypt password hashing not detected',
        'Use bcrypt for password hashing');
    }

    // Check for password comparison method
    if (userModelContent.includes('comparePassword')) {
      this.log('pass', 'Password', 'Password comparison method detected');
    } else {
      this.log('warning', 'Password', 'Password comparison method not detected',
        'Implement a secure password comparison method');
    }
  }

  checkInputValidation() {
    console.log('🔍 Checking Input Validation...');
    
    const validationPath = path.join(__dirname, '../middleware/validation.js');
    if (!fs.existsSync(validationPath)) {
      this.log('warning', 'Validation', 'Validation middleware not found',
        'Implement input validation middleware');
      return;
    }

    const validationContent = fs.readFileSync(validationPath, 'utf8');

    // Check for various validation rules
    const validationChecks = [
      { pattern: 'email', name: 'Email validation' },
      { pattern: 'password', name: 'Password validation' },
      { pattern: 'sanitize', name: 'Input sanitization' },
      { pattern: 'length', name: 'Length validation' },
      { pattern: 'escape', name: 'HTML escaping' }
    ];

    validationChecks.forEach(check => {
      if (validationContent.includes(check.pattern)) {
        this.log('pass', 'Validation', `${check.name} detected`);
      } else {
        this.log('warning', 'Validation', `${check.name} not detected`,
          `Implement ${check.name.toLowerCase()} in validation middleware`);
      }
    });
  }

  checkRateLimiting() {
    console.log('🔍 Checking Rate Limiting Configuration...');
    
    const authRoutesPath = path.join(__dirname, '../routes/auth');
    if (!fs.existsSync(authRoutesPath)) {
      this.log('warning', 'Rate Limiting', 'Auth routes directory not found');
      return;
    }

    const files = fs.readdirSync(authRoutesPath);
    let rateLimitingFound = false;

    files.forEach(file => {
      if (file.endsWith('.js')) {
        const filePath = path.join(authRoutesPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('rateLimit') || content.includes('rate-limit')) {
          rateLimitingFound = true;
          this.log('pass', 'Rate Limiting', `Rate limiting found in ${file}`);
        }
      }
    });

    if (!rateLimitingFound) {
      this.log('warning', 'Rate Limiting', 'Rate limiting not found in auth routes',
        'Implement rate limiting on authentication endpoints');
    }
  }

  checkDatabaseSecurity() {
    console.log('🔍 Checking Database Security...');
    
    const dbConfigPath = path.join(__dirname, '../config/db.js');
    if (!fs.existsSync(dbConfigPath)) {
      this.log('warning', 'Database', 'Database configuration not found');
      return;
    }

    const dbContent = fs.readFileSync(dbConfigPath, 'utf8');

    // Check for connection options
    if (dbContent.includes('useNewUrlParser') && dbContent.includes('useUnifiedTopology')) {
      this.log('pass', 'Database', 'Modern MongoDB connection options detected');
    } else {
      this.log('warning', 'Database', 'Missing modern MongoDB connection options',
        'Use useNewUrlParser and useUnifiedTopology options');
    }

    // Check for connection timeout
    if (dbContent.includes('serverSelectionTimeoutMS')) {
      this.log('pass', 'Database', 'Connection timeout configured');
    } else {
      this.log('warning', 'Database', 'Connection timeout not configured',
        'Set serverSelectionTimeoutMS for better error handling');
    }
  }

  checkLoggingSecurity() {
    console.log('🔍 Checking Logging Configuration...');
    
    // Check if sensitive data logging is avoided
    const sensitivePatterns = ['password', 'JWT_SECRET', 'token'];
    const logFiles = ['../logs/combined.log', '../logs/error.log'];
    
    logFiles.forEach(logFile => {
      const logPath = path.join(__dirname, logFile);
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        
        sensitivePatterns.forEach(pattern => {
          if (logContent.toLowerCase().includes(pattern.toLowerCase())) {
            this.log('warning', 'Logging', `Potential sensitive data in logs: ${pattern}`,
              'Ensure sensitive data is not logged');
          }
        });
        
        this.log('pass', 'Logging', `Log file ${path.basename(logFile)} exists`);
      } else {
        this.log('warning', 'Logging', `Log file ${path.basename(logFile)} not found`,
          'Ensure proper logging is configured');
      }
    });
  }

  generateReport() {
    console.log('\n📊 Security Audit Report');
    console.log('========================\n');

    console.log(`✅ Passed: ${this.passed.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Issues: ${this.issues.length}\n`);

    if (this.issues.length > 0) {
      console.log('🚨 Critical Issues:');
      console.log('==================');
      this.issues.forEach(issue => {
        console.log(`❌ [${issue.category}] ${issue.message}`);
        if (issue.fix) {
          console.log(`   Fix: ${issue.fix}`);
        }
        console.log('');
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      console.log('=============');
      this.warnings.forEach(warning => {
        console.log(`⚠️  [${warning.category}] ${warning.message}`);
        if (warning.fix) {
          console.log(`   Fix: ${warning.fix}`);
        }
        console.log('');
      });
    }

    if (this.passed.length > 0 && process.env.VERBOSE === 'true') {
      console.log('✅ Passed Checks:');
      console.log('=================');
      this.passed.forEach(pass => {
        console.log(`✅ [${pass.category}] ${pass.message}`);
      });
      console.log('');
    }

    // Overall security score
    const totalChecks = this.passed.length + this.warnings.length + this.issues.length;
    const score = totalChecks > 0 ? Math.round((this.passed.length / totalChecks) * 100) : 0;
    
    console.log(`🎯 Overall Security Score: ${score}%`);
    
    if (score >= 90) {
      console.log('🎉 Excellent security posture!');
    } else if (score >= 75) {
      console.log('👍 Good security posture, minor improvements needed');
    } else if (score >= 60) {
      console.log('⚠️  Moderate security posture, several improvements needed');
    } else {
      console.log('🚨 Poor security posture, immediate attention required');
    }

    return {
      score,
      issues: this.issues.length,
      warnings: this.warnings.length,
      passed: this.passed.length
    };
  }

  runAudit() {
    console.log('🔐 Starting Security Audit...\n');
    
    this.checkEnvironmentVariables();
    this.checkPackageVulnerabilities();
    this.checkServerConfiguration();
    this.checkAuthenticationConfiguration();
    this.checkPasswordSecurity();
    this.checkInputValidation();
    this.checkRateLimiting();
    this.checkDatabaseSecurity();
    this.checkLoggingSecurity();
    
    return this.generateReport();
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  const results = auditor.runAudit();
  
  // Exit with error code if critical issues found
  process.exit(results.issues > 0 ? 1 : 0);
}

module.exports = SecurityAuditor;
