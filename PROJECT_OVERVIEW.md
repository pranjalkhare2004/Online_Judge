# 🏆 Online Judge Platform - Complete Project Overview

## 📋 Project Purpose
This is a comprehensive Online Judge platform designed for competitive programming and coding assessments. It allows users to solve coding problems, submit solutions, and get automated feedback on their code execution.

## 🏗️ System Architecture

### Core Components
1. **Backend API** (`/backend/`) - Node.js/Express REST API with MongoDB
2. **Frontend Web App** (`/frontend/`) - React.js user interface
3. **Auth Service** (`/Auth/`) - Legacy authentication utilities (to be consolidated)
4. **Code Execution Service** (`/code-execution-service/`) - Isolated code execution environment

### Key Features
- User authentication and authorization
- Problem management and browsing
- Code submission and automated testing
- Admin dashboard for platform management
- Real-time submission feedback
- Contest management system

## 📁 Project Structure

```
Online_Judge/
├── backend/                 # Main API server
│   ├── src/
│   │   ├── controllers/     # Business logic handlers
│   │   ├── models/         # Database schemas
│   │   ├── routes/         # API endpoint definitions
│   │   ├── middleware/     # Authentication & validation
│   │   ├── config/         # Database & app configuration
│   │   ├── utils/          # Helper functions & utilities
│   │   ├── services/       # External service integrations
│   │   └── scripts/        # Database setup & maintenance
│   ├── package.json        # Dependencies & scripts
│   └── .env.example        # Environment variables template
│
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-specific page components
│   │   ├── services/       # API communication layer
│   │   ├── context/        # React context for state management
│   │   └── App.js          # Main application component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── Auth/                   # Legacy auth utilities (consolidating)
├── code-execution-service/ # Isolated code runner
├── docs/                   # Project documentation
└── infrastructure/         # Deployment configurations
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB Atlas account or local MongoDB
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Online_Judge
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your MongoDB connection in .env
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Access the Platform**
   - Frontend: http://localhost:3002
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/health

### Default Credentials
- Admin: `admin@algouniversity.com` / `admin123`
- Demo User: `demo@algouniversity.com` / `demo123`

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Express-validator
- **Logging**: Winston logger
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React.js (Hooks-based)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Build Tool**: Create React App

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (configured)
- **CI/CD**: Ready for deployment pipelines

## 📊 Current Status

### ✅ Completed Features
- User authentication & authorization
- Problem management (CRUD operations)
- User dashboard & admin panel
- Basic submission system
- Database models & relationships
- API documentation structure

### 🔄 In Progress
- Code execution engine integration
- Real-time submission feedback
- Contest management features

### 📋 Planned Features
- Advanced problem filtering
- Leaderboards & rankings
- Discussion forums
- Email notifications
- Performance analytics

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation & sanitization
- CORS configuration
- Security headers with Helmet

## 📈 Scalability Considerations
- Microservices-ready architecture
- Database indexing for performance
- Containerized services
- Load balancer ready
- Horizontal scaling support

## 🤝 Contributing
Please refer to individual component README files for specific development guidelines and coding standards.

## 📞 Support
For issues or questions, please check the documentation in the `/docs/` directory or create an issue in the repository.
