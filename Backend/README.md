# Online Judge Backend

A robust backend API for an online competitive programming platform built with Node.js, Express, and MongoDB.

## Features

- 🚀 **RESTful API**: Express.js with comprehensive endpoints
- 🔐 **Authentication**: JWT-based auth with role management
- 💾 **Database**: MongoDB with Mongoose ODM
- 🐳 **Code Execution**: Docker-based sandboxed execution
- 📊 **Problem Management**: CRUD operations for problems and test cases
- 🏆 **Submission System**: Real-time code evaluation
- 🔒 **Security**: Rate limiting, CORS, input validation
- 📝 **Logging**: Comprehensive request and error logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Code Execution**: Docker
- **Validation**: Joi
- **Testing**: Jest
- **Documentation**: OpenAPI/Swagger

## Prerequisites

- Node.js 18.0 or later
- MongoDB 5.0 or later
- Docker (for code execution)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/online-judge.git
cd online-judge/Backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/online-judge
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

4. Start MongoDB and Docker services

5. Run the development server:
```bash
npm run dev
```

The API will be available at [http://localhost:5000](http://localhost:5000).

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run start` - Start production server
- `npm run test` - Run tests with Jest
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Problems
- `GET /api/problems` - List all problems
- `GET /api/problems/:id` - Get problem by ID
- `POST /api/problems` - Create new problem (admin)
- `PUT /api/problems/:id` - Update problem (admin)
- `DELETE /api/problems/:id` - Delete problem (admin)

### Submissions
- `POST /api/submissions` - Submit solution
- `GET /api/submissions` - Get user submissions
- `GET /api/submissions/:id` - Get submission details

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user role
- `GET /api/admin/stats` - Get platform statistics

## Project Structure

```
├── controllers/         # Route controllers
├── middleware/         # Custom middleware
├── models/            # MongoDB models
├── routes/           # API routes
├── services/        # Business logic
├── utils/          # Utility functions
├── tests/         # Test files
└── server.js     # Application entry point
```

## Docker Support

### Development
```bash
docker-compose up -d
```

### Production Build
```bash
docker build -t online-judge-backend .
docker run -p 5000:5000 online-judge-backend
```

## Deployment

### AWS EC2 Deployment

1. **Launch EC2 Instance**:
   - Ubuntu 22.04 LTS
   - t3.micro (free tier eligible)
   - Configure security groups for ports 80, 443, 22

2. **Install Dependencies**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
sudo apt-get install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

3. **Deploy Application**:
```bash
# Clone repository
git clone https://github.com/your-username/online-judge.git
cd online-judge/Backend

# Install dependencies
npm ci --only=production

# Set up environment
sudo cp .env.example .env
sudo nano .env  # Configure your environment

# Install PM2 for process management
sudo npm install -g pm2

# Start application
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |

## Security

- JWT token authentication
- Request rate limiting
- Input validation and sanitization
- CORS configuration
- Security headers (helmet)
- MongoDB injection prevention

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
