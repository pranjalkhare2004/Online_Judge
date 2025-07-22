# Online Judge Platform - Setup & Usage Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation OR MongoDB Atlas account)
- Git

### Option 1: Using MongoDB Atlas (Recommended for Development)

1. **Create MongoDB Atlas Account**
   - Go to https://cloud.mongodb.com/
   - Create a free account
   - Create a new cluster (free tier is sufficient)
   - Create a database user with read/write permissions
   - Get your connection string

2. **Update Database Configuration**
   - Copy your MongoDB Atlas connection string
   - Replace the MONGODB_URL in `backend/.env`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/online-judge?retryWrites=true&w=majority
   ```

### Option 2: Using Local MongoDB

1. **Install MongoDB locally**
   - Windows: Download from https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. **Start MongoDB service**
   ```bash
   # Windows (run as Administrator)
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   # or
   brew services start mongodb-community
   ```

## 🏃‍♂️ Running the Application

### 1. Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start
# or for development with auto-reload
npm run dev
```

### 2. Start the Frontend (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## 🧪 Testing the APIs

### Authentication Endpoints

1. **Register a new user**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
   -H "Content-Type: application/json" \
   -d '{
     "firstname": "John",
     "lastname": "Doe", 
     "email": "john@example.com",
     "password": "password123"
   }'
   ```

2. **Login**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{
     "email": "john@example.com",
     "password": "password123"
   }'
   ```

### Problem Management

3. **Get all problems**
   ```bash
   curl http://localhost:8080/api/problems
   ```

4. **Create a problem (admin only)**
   ```bash
   curl -X POST http://localhost:8080/api/problems \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer YOUR_JWT_TOKEN" \
   -d '{
     "title": "Two Sum",
     "description": "Find two numbers that add up to target",
     "difficulty": "Easy",
     "category": "Array",
     "tags": ["array", "hash-table"],
     "testCases": [
       {
         "input": "[2,7,11,15], 9",
         "expectedOutput": "[0,1]",
         "isHidden": false
       }
     ]
   }'
   ```

## 🔧 Initial Setup Scripts

### Create Admin User

```bash
cd backend
node src/scripts/setupAdmins.js
```

### Seed Sample Data

```bash
cd backend
node src/scripts/seedDatabase.js
```

## 📁 Project Structure

```
online-judge/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Database, environment config
│   └── .env               # Environment variables
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   └── context/        # React context
└── README.md
```

## 🌐 Available Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Problems
- `GET /api/problems` - List all problems
- `GET /api/problems/:id` - Get specific problem
- `POST /api/problems` - Create problem (admin)
- `PUT /api/problems/:id` - Update problem (admin)
- `DELETE /api/problems/:id` - Delete problem (admin)

### Submissions
- `POST /api/submissions` - Submit solution
- `GET /api/submissions` - Get submissions (admin)
- `GET /api/submissions/:id` - Get specific submission
- `GET /api/submissions/user/me` - Get user's submissions

### Users
- `GET /api/users` - List users (with pagination)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/stats` - Get user statistics

### Admin
- `GET /api/admin/dashboard/stats` - Admin dashboard
- `GET /api/admin/users` - Manage users
- `GET /api/admin/system/health` - System health check

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for Atlas

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing processes: `kill -9 $(lsof -ti:8080)`

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in `.env`
   - Check token expiration

### Environment Variables

Make sure these are set in `backend/.env`:
```
NODE_ENV=development
PORT=8080
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

## 📚 Usage Examples

### For Students
1. Register/Login to the platform
2. Browse available problems
3. Submit solutions in various languages
4. View submission history and results
5. Track progress and statistics

### For Admins
1. Login with admin credentials
2. Create and manage problems
3. Monitor user submissions
4. View system analytics
5. Manage user accounts

## 🔄 Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   npm run dev  # Auto-reload on changes
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm start    # Hot reload enabled
   ```

3. **Testing APIs**
   - Use Postman or curl
   - Check logs in terminal
   - Monitor database changes

## 🏗️ Next Steps

1. Set up MongoDB (Atlas or local)
2. Run the backend server
3. Start the frontend application
4. Create admin user
5. Add sample problems
6. Test the complete workflow

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

For detailed technical documentation, see the API documentation and code comments.
