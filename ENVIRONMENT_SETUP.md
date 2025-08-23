# 🔐 ENVIRONMENT CONFIGURATION TEMPLATE

This file contains the environment variables template for the Online Judge Platform.

## 📋 Backend Environment (.env)

Create `Backend/.env` with these variables:

```bash
# Environment Configuration
NODE_ENV=production
PORT=5000

# Database - MongoDB Atlas Configuration
MONGODB_URI=your-mongodb-atlas-connection-string

# Authentication (Required)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
JWT_EXPIRE=7d
SESSION_SECRET=your-super-secure-session-secret-at-least-32-characters-long

# CORS Configuration (Update after deployment)
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Docker Configuration
DOCKER_TIMEOUT=30000

# Logging
LOG_LEVEL=info

# Security Configuration
BCRYPT_ROUNDS=12

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Debug Configuration
DEBUG_OAUTH=false
DEBUG_COMPILER=false
```

## 🌐 Frontend Environment (.env.local)

Create `ONLINE-JUDGE-FRONTEND/.env.local` with these variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-at-least-32-characters-long

# OAuth Configuration (Same as backend)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (Same as backend)
MONGODB_URI=your-mongodb-atlas-connection-string

# Development Configuration
NODE_ENV=development

# Optional: Analytics
# NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id

# Optional: Error Monitoring
# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 🔒 Security Notes

1. **NEVER commit .env files to version control**
2. Generate strong secrets using: `openssl rand -hex 32`
3. Use different secrets for production and development
4. MongoDB Atlas connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database-name
   ```

## 🚀 Quick Setup

Use the provided `quick-setup.bat` script to create environment files from examples.

## 📖 Deployment

Follow `STEP_BY_STEP_DEPLOYMENT_GUIDE.md` for complete deployment instructions.
