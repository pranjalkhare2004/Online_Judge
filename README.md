# 🏆 Online Judge Platform

A modern, full-stack competitive programming platform built with Next.js, Node.js, and MongoDB. Features real-time code execution, secure authentication, and a beautiful responsive interface.

![Platform Preview](https://via.placeholder.com/800x400/2563eb/ffffff?text=Online+Judge+Platform)

## ✨ Features

- 🚀 **Real-time Code Execution**: Docker-based sandboxed execution for multiple languages
- 🔐 **Secure Authentication**: JWT-based auth with role management
- 💻 **Monaco Code Editor**: VS Code-style editor with syntax highlighting
- 📊 **Problem Management**: CRUD operations for problems and test cases
- 🏆 **Submission System**: Real-time evaluation with detailed feedback
- 🌙 **Dark/Light Mode**: Beautiful UI with theme switching
- 📱 **Responsive Design**: Mobile-first approach
- ⚡ **High Performance**: Optimized for speed and scalability

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Editor**: Monaco Editor
- **Authentication**: NextAuth.js

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB
- **Code Execution**: Docker
- **Authentication**: JWT

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (EC2, ECR)
- **Process Management**: PM2

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0+
- MongoDB 5.0+
- Docker
- Git

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/pranjalkhare2004/Online_Judge.git
cd online-judge
```

2. **Setup Backend**
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend**
```bash
cd ../ONLINE-JUDGE-FRONTEND
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🌐 Deployment

### AWS Free Tier Deployment

Deploy the entire platform to AWS Free Tier with one command:

```bash
cd deployment/aws
chmod +x deploy.sh
./deploy.sh
```

This will create:
- VPC with public subnet
- EC2 t2.micro instance
- Security groups
- ECR repositories
- Complete application setup

### Manual Deployment

#### Using Docker
```bash
# Build and run backend
cd Backend
docker build -t online-judge-backend .
docker run -p 5000:5000 online-judge-backend

# Build and run frontend
cd ../ONLINE-JUDGE-FRONTEND
docker build -t online-judge-frontend .
docker run -p 3000:3000 online-judge-frontend
```

#### Using PM2
```bash
# Backend
cd Backend
npm ci --only=production
pm2 start ecosystem.config.js

# Frontend
cd ../ONLINE-JUDGE-FRONTEND
npm ci --only=production
npm run build
pm2 start npm --name "frontend" -- start
```

## 📁 Project Structure

```
online-judge/
├── Backend/                    # Node.js API server
│   ├── controllers/           # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── models/              # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/             # Utility functions
│   └── server.js         # Entry point
├── ONLINE-JUDGE-FRONTEND/    # Next.js frontend
│   ├── app/                 # App Router pages
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── hooks/            # Custom hooks
│   └── lib/             # Utility functions
├── deployment/           # Deployment configurations
│   └── aws/            # AWS deployment scripts
└── docs/              # Documentation
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/online-judge
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api
MONGODB_URI=mongodb://localhost:27017/online-judge
```

## 🧪 Testing

### Backend Tests
```bash
cd Backend
npm test
```

### Frontend Tests
```bash
cd ONLINE-JUDGE-FRONTEND
npm test
```

## 📖 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Problems
- `GET /api/problems` - List problems
- `GET /api/problems/:id` - Get problem details
- `POST /api/problems` - Create problem (admin)
- `PUT /api/problems/:id` - Update problem (admin)

### Submissions
- `POST /api/submissions` - Submit solution
- `GET /api/submissions` - Get user submissions
- `GET /api/submissions/:id` - Get submission details

### Admin
- `GET /api/admin/users` - List users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/stats` - Platform statistics

## 🛡️ Security Features

- JWT authentication with refresh tokens
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Security headers (Helmet.js)
- Docker sandboxing for code execution
- SQL/NoSQL injection prevention

## 📊 Supported Languages

- ✅ Python 3.9+
- ✅ JavaScript (Node.js)
- ✅ C++ (GCC)
- ✅ Java (OpenJDK)
- 🔄 More languages coming soon...

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Express.js](https://expressjs.com/) - Web framework
- [MongoDB](https://mongodb.com/) - Database
- [Docker](https://docker.com/) - Containerization
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://radix-ui.com/) - UI primitives

## 📞 Support

- 📧 Email: support@onlinejudge.com
- 🐛 Issues: [GitHub Issues](https://github.com/pranjalkhare2004/Online_Judge/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/pranjalkhare2004/Online_Judge/discussions)
- 📖 Documentation: [Wiki](https://github.com/pranjalkhare2004/Online_Judge/wiki)

## 🗺️ Roadmap

- [ ] Contest management system
- [ ] Real-time leaderboards
- [ ] Code plagiarism detection
- [ ] Mobile application
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Video tutorials integration

---

<p align="center">
  Made with ❤️ by the Online Judge Team
</p>
