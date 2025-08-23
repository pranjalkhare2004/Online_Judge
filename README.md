# 🏆 Online Judge Platform

A modern, full-stack competitive programming platform built with the MERN stack. Features real-time code compilation, secure user authentication, admin dashboard, and comprehensive testing system.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Security Score](https://img.shields.io/badge/security-95%25-brightgreen.svg)

## ✨ Features

### 🔥 Core Functionality
- **Multi-language Code Compilation**: Support for C++, Java, and Python
- **Real-time Code Execution**: Monaco Editor integration with live feedback
- **Secure Sandboxed Environment**: Safe code execution with resource limits
- **Problem Management**: Create, edit, and manage coding problems
- **Test Case Validation**: Comprehensive automated testing system
- **User Submissions**: Track progress and submission history

### 🔒 Security & Authentication  
- **JWT Authentication**: Secure token-based authentication system
- **OAuth Integration**: Google and GitHub social login
- **Role-based Access Control**: User, Admin, and Super Admin roles
- **Account Security**: Brute force protection and account lockout
- **Input Validation**: XSS and SQL injection prevention
- **Rate Limiting**: API abuse protection

### 👑 Admin Dashboard
- **User Management**: View, edit, and moderate user accounts
- **Problem Administration**: Create and manage coding problems
- **Analytics Dashboard**: Real-time platform statistics
- **Contest Management**: Organize and monitor competitions
- **System Monitoring**: Health checks and performance metrics

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme**: Automatic theme switching
- **Accessibility**: WCAG compliant interface
- **Real-time Updates**: WebSocket integration for live features
- **Performance Optimized**: Sub-2 second page load times

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **Redis** (v6.0 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/online-judge.git
   cd online-judge
   ```

2. **Install backend dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../ONLINE-JUDGE-FRONTEND
   npm install
   ```

### Configuration

4. **Backend Environment Setup**
   ```bash
   cd ../Backend
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/onlinejudge
   REDIS_URL=redis://localhost:6379
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   
   # Server
   PORT=5000
   NODE_ENV=development
   ```

5. **Frontend Environment Setup**
   ```bash
   cd ../ONLINE-JUDGE-FRONTEND
   cp .env.example .env.local
   ```
   
   Configure your `.env.local` file:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### Database Setup

6. **Start MongoDB and Redis**
   ```bash
   # Start MongoDB (varies by OS)
   sudo systemctl start mongod  # Linux
   brew services start mongodb-community  # macOS
   
   # Start Redis
   redis-server
   ```

7. **Seed the database**
   ```bash
   cd Backend
   npm run seed
   ```

### Launch the Application

8. **Start the backend server**
   ```bash
   cd Backend
   npm run dev
   ```

9. **Start the frontend (in a new terminal)**
   ```bash
   cd ONLINE-JUDGE-FRONTEND
   npm run dev
   ```

10. **Access the application**
    - **Frontend**: http://localhost:3000
    - **Backend API**: http://localhost:5000
    - **Admin Dashboard**: http://localhost:3000/admin

## 📚 Documentation

### Development Guides
- [**High-Level Design**](HIGH_LEVEL_DESIGN_DOCUMENTATION.md) - System architecture overview
- [**Authentication System**](AUTHENTICATION_SYSTEM_DOCUMENTATION.md) - Security implementation details
- [**API Documentation**](Backend/docs/) - Comprehensive API reference
- [**Contributing Guide**](CONTRIBUTING.md) - Development workflow and standards

### Testing & Quality
- [**Compiler Testing Guide**](COMPILER_TESTING_GUIDE.md) - Code execution system testing
- [**Security Analysis Report**](AUTHENTICATION_ANALYSIS_REPORT.md) - Security audit results
- [**UI/UX Testing Report**](UI_UX_TESTING_COMPLETION_REPORT.md) - Frontend testing coverage

### Deployment
- [**Production Deployment Guide**](PRODUCTION_DEPLOYMENT_GUIDE.md) - Production setup instructions
- [**Migration Guide**](MIGRATION-GUIDE.md) - Database migration procedures
- [**GitHub Setup**](GITHUB_SETUP.md) - CI/CD pipeline configuration

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd ONLINE-JUDGE-FRONTEND
npm test

# Security audit
cd Backend
node scripts/security-audit.js
```

### Test Coverage
- **Authentication**: 95% security score
- **API Endpoints**: Comprehensive integration testing
- **UI Components**: Automated browser testing
- **Performance**: Load testing and optimization

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB, Redis
- **Authentication**: JWT, OAuth 2.0, Passport.js
- **Code Execution**: Sandboxed compilation with Docker support
- **Testing**: Jest, Supertest, Playwright
- **Deployment**: Docker, PM2, Nginx

### System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • React UI      │    │ • REST API      │    │ • User Data     │
│ • Auth Context  │    │ • JWT Auth      │    │ • Problems      │
│ • Code Editor   │    │ • Compiler      │    │ • Submissions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Redis Cache   │
                       │                 │
                       │ • Sessions      │
                       │ • Job Queue     │
                       │ • Rate Limits   │
                       └─────────────────┘
```

## 🛡️ Security

### Security Features
- **95% Security Score** (Excellent rating)
- **bcrypt Password Hashing** (12 salt rounds)
- **JWT Token Security** with refresh token rotation
- **Input Validation & Sanitization** (XSS/SQL prevention)
- **Rate Limiting** (API abuse protection)
- **CORS Protection** (Domain-specific access)
- **Security Headers** (Helmet.js implementation)

### Vulnerability Management
- **Zero Critical Vulnerabilities** in dependencies
- **Automated Security Scans** in CI/CD pipeline
- **Regular Dependency Updates** with audit logs
- **Penetration Testing** ready environment

## 🔧 Development

### Project Structure
```
online-judge/
├── Backend/                 # Node.js/Express backend
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── utils/              # Helper functions
│   └── tests/              # Test suites
├── ONLINE-JUDGE-FRONTEND/  # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utility libraries
│   ├── contexts/           # React contexts
│   └── styles/             # CSS styles
└── docs/                   # Documentation
```

### Code Quality Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates
- **Jest**: Unit and integration testing
- **Test Coverage**: 85%+ target coverage

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**
   ```bash
   NODE_ENV=production
   DATABASE_URL=your-production-mongodb-url
   REDIS_URL=your-production-redis-url
   ```

2. **Build & Deploy**
   ```bash
   # Backend
   cd Backend
   npm run build:production
   npm start
   
   # Frontend
   cd ONLINE-JUDGE-FRONTEND
   npm run build
   npm start
   ```

3. **Process Management**
   ```bash
   # Using PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

## 📊 Performance

### Benchmarks
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 200ms average
- **Code Compilation**: < 5 seconds
- **Concurrent Users**: 1000+ supported
- **Uptime**: 99.9% availability target

### Optimization Features
- **Redis Caching**: Session and data caching
- **Database Indexing**: Optimized query performance
- **CDN Integration**: Static asset delivery
- **Lazy Loading**: Component-level code splitting
- **Compression**: Gzip/Brotli response compression

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- **Development Workflow**: Git branching strategy
- **Code Standards**: Linting and formatting rules
- **Testing Requirements**: Coverage expectations
- **Review Process**: Pull request guidelines

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development**: Node.js/Express/MongoDB specialists
- **Frontend Development**: React/Next.js/TypeScript experts
- **Security Engineering**: Authentication and vulnerability experts
- **DevOps**: Docker/CI-CD/Production deployment specialists

## 🙏 Acknowledgments

- **MongoDB**: For excellent database documentation
- **Next.js Team**: For the amazing React framework
- **Express.js**: For the robust backend framework
- **Monaco Editor**: For the incredible code editor component
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

### Getting Help
- **Documentation**: [Full documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/online-judge/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/online-judge/discussions)

### Contact
- **Email**: support@onlinejudge.com
- **Discord**: [Join our community](https://discord.gg/onlinejudge)
- **Twitter**: [@OnlineJudgeDev](https://twitter.com/OnlineJudgeDev)

---

<div align="center">

**[⭐ Star this project](https://github.com/your-username/online-judge)** if you find it helpful!

Made with ❤️ by the Online Judge Team

</div>
