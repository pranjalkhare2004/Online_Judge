# 🏆 AlgoUniversity Online Judge Platform

A comprehensive, scalable online judge platform for coding competitions, practice problems, and educational programming challenges.

## 🌟 Features

### **Core Features**
- 👤 **User Management**: Registration, authentication, profile management
- 📝 **Problem Management**: Create, edit, organize coding problems
- 💻 **Code Execution**: Support for multiple programming languages
- 🏁 **Submission System**: Real-time code evaluation and feedback
- 🏆 **Contest System**: Organize and participate in coding contests
- 📊 **Analytics Dashboard**: Comprehensive statistics and insights
- 🛡️ **Admin Panel**: Complete platform administration

### **Technical Features**
- 🔐 **JWT Authentication**: Secure user authentication
- 🚀 **RESTful API**: Well-structured API endpoints
- 📱 **Responsive Design**: Works on all devices
- 🐳 **Docker Support**: Easy deployment and scaling
- 📝 **Comprehensive Logging**: Detailed system monitoring
- ⚡ **High Performance**: Optimized for speed and reliability

## 📁 Project Structure

```
Online_Judge/
├── 📂 backend/                 # Main API Server
├── 📂 code-execution-service/  # Isolated code execution
├── 📂 frontend/               # React frontend
├── 📂 shared/                 # Shared utilities
├── 📂 docs/                   # Documentation
└── 📂 scripts/               # Utility scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (v4.4+)
- Docker (optional, for code execution)

### 1. Clone Repository
```bash
git clone https://github.com/pranjalkhare2004/Online_Judge.git
cd Online_Judge
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configurations
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Code Execution Service
```bash
cd code-execution-service
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=8080
MONGODB_URL=mongodb://localhost:27017/online-judge
JWT_SECRET=your-super-secret-jwt-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

#### Frontend
The frontend runs on port 3002 by default and connects to the backend API.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Problem Endpoints
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get problem by ID
- `POST /api/problems` - Create problem (admin)
- `PUT /api/problems/:id` - Update problem (admin)

### Submission Endpoints
- `POST /api/submissions` - Submit solution
- `GET /api/submissions/user/me` - Get user submissions
- `GET /api/submissions/:id` - Get submission details

### Contest Endpoints
- `GET /api/contests` - Get all contests
- `POST /api/contests` - Create contest (admin)
- `POST /api/contests/:id/register` - Register for contest

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🏗️ Architecture

### Backend Architecture
- **MVC Pattern**: Clear separation of concerns
- **Microservices**: Isolated code execution service
- **RESTful API**: Standard REST endpoints
- **Middleware Stack**: Authentication, validation, error handling

### Frontend Architecture
- **React.js**: Component-based UI
- **Context API**: State management
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling

### Database Schema
- **Users**: User profiles and authentication
- **Problems**: Coding problems and test cases
- **Submissions**: Code submissions and results
- **Contests**: Contest information and participants

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin request security
- **Code Sandboxing**: Safe code execution environment

## 📊 Admin Features

### Dashboard Analytics
- User registration trends
- Submission statistics
- Problem difficulty distribution
- Contest participation metrics

### User Management
- View all users
- Update user roles
- Activate/deactivate accounts
- Monitor user activity

### Problem Management
- Create and edit problems
- Manage test cases
- Set difficulty levels
- Organize problem categories

### Contest Management
- Create contests
- Set contest schedules
- Manage participants
- View leaderboards

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Deploy backend service
4. Deploy frontend to static hosting
5. Configure reverse proxy (nginx)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 Development Guidelines

### Code Style
- Use ESLint and Prettier
- Follow REST API conventions
- Write meaningful commit messages
- Add JSDoc comments for functions

### Database Guidelines
- Use proper MongoDB indexes
- Implement data validation
- Follow schema naming conventions
- Use aggregation for complex queries

## 📈 Performance Optimization

### Backend
- Database connection pooling
- Efficient pagination
- Response compression
- Caching strategies

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

## 🔍 Monitoring & Logging

- **Winston Logger**: Structured logging
- **Request Tracking**: HTTP request monitoring
- **Error Tracking**: Comprehensive error logs
- **Performance Metrics**: Response time monitoring

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the coding community
- Inspired by platforms like Codeforces and LeetCode
- Thanks to all contributors and users

---

**Happy Coding! 🚀** Platform

A comprehensive online coding platform with role-based authentication, problem management, and contest organization capabilities.

## Features

### For Users
- User registration and authentication
- Browse and solve coding problems
- View problem statistics and leaderboards
- Track personal progress and submissions

### For Admins
- Upload and manage coding problems
- Create and organize contests
- Manage user accounts
- Access comprehensive admin dashboard
- Monitor platform statistics

## Technology Stack

### Backend
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT tokens with bcrypt password hashing
- **Security:** Role-based access control middleware

### Frontend
- **Framework:** React 19.1.0
- **Routing:** React Router DOM 7.7.0
- **Styling:** Tailwind CSS v3
- **State Management:** React Context API

## Quick Start

### Backend Setup
```bash
cd Auth
npm install
npm start
```
Backend runs on: http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on: http://localhost:3003

## Authentication System

### User Registration
- All new registrations automatically receive "user" role
- No self-admin role selection available for security
- Required fields: firstname, lastname, email, password

### Admin Access
The system uses predefined admin accounts for security:
- **Admin 1:** admin1@algouniversity.com / Admin123!@#
- **Admin 2:** admin2@algouniversity.com / Admin456!@#

See `ADMIN_CREDENTIALS.md` for detailed admin information.

## Security Features
- Role-based authentication with JWT
- Protected admin routes
- Secure password hashing with bcrypt
- No self-admin registration vulnerability
- Environment-based configuration

## Development

### Project Structure
```
Online_Judge/
├── Auth/                 # Backend server
│   ├── model/           # Database models
│   ├── database/        # Database configuration
│   └── setup-admins.js  # Admin account setup utility
├── frontend/            # React frontend
│   └── src/
│       ├── context/     # React context providers
│       ├── pages/       # Application pages
│       └── services/    # API service layers
└── DOCS/               # Documentation and blueprints
```

### Environment Configuration
Create `.env` file in the Auth directory with:
```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
NODE_ENV=development
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Submit a pull request

## License
This project is part of AlgoUniversity's educational platform.