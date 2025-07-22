# 🚀 Online Judge Platform

A modern coding platform where developers can practice algorithms, participate in contests, and improve their programming skills.

## ✨ What You Can Do

**For Everyone:**
- Solve coding problems and challenges
- Track your progress and submissions
- Browse problems by difficulty and topic
- View detailed problem statistics

**For Admins:**
- Create and manage coding problems
- Organize programming contests
- Monitor user activity and platform stats
- Manage user accounts and permissions

## �️ Built With

**Backend:**
- Node.js & Express.js for the API
- MongoDB for data storage
- JWT for secure authentication
- bcrypt for password protection

**Frontend:**
- React.js for the user interface
- Tailwind CSS for styling
- React Router for navigation
- Context API for state management

## 📁 Project Structure

```
Online_Judge/
├── backend/     # API server and database logic
├── frontend/    # React user interface
└── docs/        # Documentation and guides
```

## 🚀 Getting Started

### What You'll Need
- Node.js (version 16 or higher)
- MongoDB database
- A code editor (VS Code recommended)

### Running the Project

**1. Get the code:**
```bash
git clone https://github.com/pranjalkhare2004/Online_Judge.git
cd Online_Judge
```

**2. Start the backend:**
```bash
cd backend
npm install
cp .env.example .env
# Add your MongoDB URL and JWT secret to .env
npm run dev
```
Your API will be running at `http://localhost:8080`

**3. Start the frontend:**
```bash
cd frontend
npm install
npm start
```
Your app will open at `http://localhost:3002`

### Quick Test
- Open `http://localhost:3002` in your browser
- Register a new account or login with demo credentials
- Start exploring problems and submitting solutions!

## 🔑 Default Login Credentials

**Demo User:**
- Email: `demo@example.com`
- Password: `demo123`

**Admin Access:**
- Email: `admin@algouniversity.com` 
- Password: `Admin123!@#`

## 📖 Main Features Explained

### For Problem Solvers
- **Browse Problems**: Find challenges by difficulty level
- **Submit Solutions**: Write code and get instant feedback
- **Track Progress**: See your submission history and stats
- **Join Contests**: Participate in timed coding competitions

### For Administrators
- **Problem Management**: Add new coding challenges with test cases
- **User Management**: View and manage user accounts
- **Contest Creation**: Set up programming competitions
- **Analytics**: Monitor platform usage and statistics

## 🔒 Security & Authentication

The platform uses modern security practices:
- **JWT Tokens**: Secure user sessions
- **Password Hashing**: bcrypt encryption for passwords
- **Role-Based Access**: Different permissions for users and admins
- **Input Validation**: Protection against malicious data

## � Key Files & Folders

```
backend/src/
├── models/          # Database schemas (User, Problem, Contest)
├── controllers/     # API logic and request handling
├── routes/          # API endpoint definitions
├── middleware/      # Authentication and validation
└── config/          # Database and app configuration

frontend/src/
├── pages/           # Main app screens (Login, Problems, etc.)
├── components/      # Reusable UI elements
├── services/        # API communication
└── context/         # Global state management
```

## 🛠️ Development & Contributing

### Want to Add Features?
1. Fork this repository
2. Create a new branch for your feature
3. Make your changes and test them
4. Submit a pull request with a clear description

### Code Guidelines
- Follow the existing code style and structure
- Add comments for complex logic
- Test your changes before submitting
- Update documentation if needed

### Common Tasks
- **Adding new problems**: Use the admin dashboard or API endpoints
- **Styling changes**: Modify Tailwind CSS classes in components
- **Database changes**: Update models in `backend/src/models/`
- **New API endpoints**: Add routes in `backend/src/routes/`

## 📋 Project Status

**Current Features:**
- ✅ User registration and authentication
- ✅ Problem browsing and submission
- ✅ Admin dashboard for management
- ✅ Responsive design for all devices

**Coming Soon:**
- 🔄 Code execution and testing
- 🔄 Contest leaderboards
- 🔄 Advanced problem filtering
- 🔄 User profile improvements

## 🆘 Need Help?

**Common Issues:**
- **Can't connect to database**: Check your MongoDB URL in `.env`
- **Login not working**: Verify JWT secret is set in backend `.env`
- **Frontend not loading**: Make sure backend is running on port 8080

**Getting Support:**
- Check the [Setup Guide](SETUP_GUIDE.md) for detailed instructions
- Look at existing GitHub issues for similar problems
- Create a new issue with details about your problem

## 📄 Documentation

- **[Setup Guide](SETUP_GUIDE.md)** - Detailed installation instructions
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Coding standards and best practices
- **[Project Overview](PROJECT_OVERVIEW.md)** - Complete technical documentation

---

**Made with ❤️ for the coding community**

Happy coding! 🎉