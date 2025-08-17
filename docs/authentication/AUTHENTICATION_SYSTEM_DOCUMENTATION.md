# Online Judge Authentication System Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Authentication Architecture](#authentication-architecture)
3. [API Endpoints](#api-endpoints)
4. [Token Management](#token-management)
5. [Admin System](#admin-system)
6. [Security Features](#security-features)
7. [Frontend Integration](#frontend-integration)
8. [Production Configuration](#production-configuration)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Overview

The Online Judge platform implements a modern, secure authentication system using JWT tokens with refresh token rotation. The system supports user registration, login, session management, and role-based access control.

### Key Features
- **Modern Token Pairs**: 15-minute access tokens + 30-day refresh tokens
- **Automatic Token Refresh**: Seamless background token renewal
- **Role-Based Access**: User, Admin, and Super Admin roles
- **Security Hardened**: Rate limiting, account locking, password policies
- **Production Ready**: Comprehensive logging, monitoring, and error handling

### Technology Stack
- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Authentication**: JWT + bcrypt + Refresh Token Rotation
- **Security**: Helmet, CORS, Rate Limiting, Input Validation

---

## 🔧 Authentication Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │    │   (Express)     │    │   (MongoDB)     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Auth Context    │◄──►│ Auth Routes     │◄──►│ Users           │
│ API Client      │    │ JWT Middleware  │    │ Refresh Tokens  │
│ Token Storage   │    │ Rate Limiting   │    │ Sessions        │
│ Auto Refresh    │    │ Validation      │    │ Audit Logs      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Authentication Flow
1. **User Registration/Login** → Credentials validation
2. **Token Generation** → Access token (15min) + Refresh token (30 days)
3. **Request Authentication** → Access token validation
4. **Token Refresh** → Automatic renewal using refresh token
5. **Session Management** → Persistent user sessions
6. **Logout** → Token invalidation and cleanup

---

## 🚀 API Endpoints

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

### Authentication Endpoints

#### 1. User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "dateOfBirth": "1995-01-01"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "abc123def456...",
    "expiresIn": 900,
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true
    }
  }
}
```

#### 2. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "xyz789uvw012...",
    "expiresIn": 900,
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "lastLogin": "2025-08-17T10:30:00.000Z"
    }
  }
}
```

#### 3. Token Refresh
```http
POST /auth/tokens/refresh
Content-Type: application/json

{
  "refreshToken": "xyz789uvw012..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "new123refresh456...",
    "expiresIn": 900
  }
}
```

#### 4. Token Verification
```http
POST /auth/tokens/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

#### 5. User Logout
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "xyz789uvw012...",
  "revokeAll": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Protected User Endpoints

#### 1. Get User Profile
```http
GET /user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "name": "John Doe",
      "email": "john@example.com",
      "rating": 1200,
      "isVerified": false,
      "lastLogin": "2025-08-17T10:30:00.000Z",
      "statistics": {
        "problemsSolved": 25,
        "submissionCount": 150,
        "rating": 1200,
        "joinDate": "2025-01-15T08:00:00.000Z"
      }
    }
  }
}
```

#### 2. Update User Profile
```http
PUT /user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "John Smith",
  "dateOfBirth": "1995-01-01"
}
```

#### 3. Change Password
```http
POST /user/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword456!"
}
```

---

## 🔑 Token Management

### Token Types

#### Access Token
- **Purpose**: API authentication
- **Expiry**: 15 minutes
- **Storage**: Memory/HTTP headers
- **Format**: JWT with user claims

```javascript
// Access Token Payload
{
  "id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "userId": "USR_1755419480307_g5mrigznh",
  "Email": "john@example.com",
  "FullName": "John Doe",
  "role": "user",
  "iat": 1755419563790,
  "exp": 1755420468590,
  "aud": "online-judge-frontend",
  "iss": "online-judge-backend"
}
```

#### Refresh Token
- **Purpose**: Access token renewal
- **Expiry**: 30 days
- **Storage**: Database + HTTP-only cookies
- **Format**: Cryptographically secure random string

### Token Security Features
- **Token Rotation**: New refresh token on each refresh
- **Secure Storage**: HTTP-only cookies with secure flags
- **Automatic Cleanup**: Expired tokens removed regularly
- **Rate Limiting**: Prevents token abuse
- **Device Tracking**: Links tokens to specific devices/sessions

---

## 👑 Admin System

### Admin Roles

#### 1. User (Default)
- View problems and contests
- Submit solutions
- View personal statistics
- Update profile

#### 2. Admin
- All user permissions
- Create/edit problems
- Manage contests
- View user statistics
- Moderate submissions

#### 3. Super Admin
- All admin permissions
- User management (activate/deactivate)
- System configuration
- Access logs and analytics
- Database management

### Admin Endpoints

#### 1. Get All Users (Admin+)
```http
GET /admin/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 2. Create Admin User (Super Admin)
```http
POST /admin/users/create-admin
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "email": "admin@example.com",
  "name": "Admin User",
  "password": "AdminPassword123!",
  "role": "admin"
}
```

#### 3. User Management (Admin+)
```http
PUT /admin/users/:userId/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "isActive": true,
  "reason": "Account reactivated"
}
```

### Default Admin Account
```javascript
// Created during system initialization
{
  "email": "admin@codejudge.com",
  "password": "AdminSecure123!",
  "role": "admin",
  "name": "System Administrator"
}
```

---

## 🛡️ Security Features

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Policy**: Minimum 8 characters, uppercase, lowercase, number, special character
- **Validation**: Server-side strength validation
- **History**: Prevents password reuse (last 5 passwords)

### Rate Limiting
```javascript
// Authentication endpoints
{
  "windowMs": 900000,     // 15 minutes
  "max": 5,               // 5 attempts per window
  "message": "Too many login attempts"
}

// Token refresh endpoints
{
  "windowMs": 900000,     // 15 minutes
  "max": 20,              // 20 refreshes per window
  "message": "Too many token requests"
}
```

### Account Security
- **Account Locking**: 5 failed attempts = 30-minute lockout
- **Session Management**: Device-specific refresh tokens
- **Audit Logging**: All authentication events logged
- **IP Tracking**: Suspicious login detection

### CORS Configuration
```javascript
{
  "origin": ["http://localhost:3000", "https://your-domain.com"],
  "credentials": true,
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["Content-Type", "Authorization"]
}
```

---

## 💻 Frontend Integration

### Auth Context Usage
```typescript
import { useAuth } from '@/contexts/auth-context';

function LoginComponent() {
  const { login, loading, user } = useAuth();
  
  const handleLogin = async (credentials) => {
    try {
      const response = await login(credentials);
      if (response.success) {
        // User logged in successfully
        router.push('/dashboard');
      }
    } catch (error) {
      // Handle login error
    }
  };
}
```

### API Client Usage
```typescript
import { api } from '@/lib/api';

// Authenticated requests automatically include tokens
const getUserProfile = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    // Handles token refresh automatically
    console.error('Profile fetch error:', error);
  }
};
```

### Protected Route Implementation
```typescript
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading]);
  
  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  
  return <DashboardContent />;
}
```

---

## 🚀 Production Configuration

### Environment Variables
```bash
# Backend (.env)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-cluster/online-judge
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_REFRESH_SECRET=your-refresh-token-secret-512-bits
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_SALT_ROUNDS=12

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

### Database Indexes
```javascript
// Users Collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "UserId": 1 }, { unique: true })
db.users.createIndex({ "isActive": 1 })
db.users.createIndex({ "role": 1 })

// Refresh Tokens Collection
db.refreshtokens.createIndex({ "token": 1 }, { unique: true })
db.refreshtokens.createIndex({ "userId": 1 })
db.refreshtokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### Security Headers
```javascript
// Helmet configuration
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
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Token Refresh Failed
**Problem**: `Invalid or expired refresh token`
**Solution**: 
- Check refresh token expiry in database
- Verify token format and encoding
- Ensure user account is active

#### 2. CORS Errors
**Problem**: `Access blocked by CORS policy`
**Solution**:
- Verify CORS_ORIGIN environment variable
- Check frontend URL matches allowed origins
- Ensure credentials: true in requests

#### 3. Rate Limiting
**Problem**: `Too many requests`
**Solution**:
- Implement exponential backoff
- Check rate limit configuration
- Consider IP whitelisting for development

#### 4. Database Connection
**Problem**: `MongoDB connection failed`
**Solution**:
- Verify MONGODB_URI format
- Check network connectivity
- Ensure database credentials are correct

### Debugging Tools

#### Backend Logs
```bash
# View authentication logs
tail -f logs/auth.log

# Check error logs
tail -f logs/error.log

# Monitor database queries
tail -f logs/database.log
```

#### Frontend Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('auth_debug', 'true');

// Check auth state
console.log('Auth State:', useAuth());

// Monitor API calls
// Network tab in browser dev tools
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Monitor
- **Authentication Success Rate**: Login/registration success percentage
- **Token Refresh Rate**: Frequency of token refresh requests
- **Account Lockouts**: Number of accounts locked due to failed attempts
- **Session Duration**: Average user session length
- **API Response Times**: Authentication endpoint performance

### Health Check Endpoint
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-17T10:30:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "authentication": "operational"
  },
  "metrics": {
    "activeUsers": 1250,
    "tokensIssued": 5420,
    "uptime": "25 days, 14 hours"
  }
}
```

---

## 📝 API Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 🔄 Maintenance Tasks

### Daily
- Monitor error logs
- Check authentication metrics
- Verify system health

### Weekly
- Review failed login attempts
- Clean up expired tokens
- Update security patches

### Monthly
- Rotate JWT secrets
- Review user access logs
- Performance optimization
- Security audit

---

*Documentation Version: 1.0*  
*Last Updated: August 17, 2025*  
*System Version: Production Ready*
