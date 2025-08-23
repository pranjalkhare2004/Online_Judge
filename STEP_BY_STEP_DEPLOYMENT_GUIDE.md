# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

## 📋 PREREQUISITES

Before we start, make sure you have:
- [ ] Git installed
- [ ] Node.js 18+ installed
- [ ] A GitHub account (for code hosting)
- [ ] Email address for service signups

---

## 🗄️ STEP 1: SET UP MONGODB ATLAS (DATABASE)

### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Sign up with email or Google account
4. Verify your email

### 1.2 Create a Cluster
1. Choose "Build a Database"
2. Select **"M0 Sandbox"** (FREE forever)
3. Choose **AWS** as cloud provider
4. Select region closest to you
5. Name your cluster: `online-judge-cluster`
6. Click "Create"

### 1.3 Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `judgeuser`
5. Password: Generate a secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.4 Setup Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `online-judge`

**Save this connection string - you'll need it later!**

---

## 🔧 STEP 2: PREPARE YOUR CODE

### 2.1 Update Environment Files

Open your project in VS Code and update the environment files:

#### Backend Environment (.env)
```bash
# Copy the example file
cp Backend/.env.example Backend/.env
```

Edit `Backend/.env` with these values:
```bash
NODE_ENV=production
PORT=5000

# Replace with your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://judgeuser:YOUR_PASSWORD@online-judge-cluster.xxxxx.mongodb.net/online-judge

# Generate a secure JWT secret (random string)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long

# We'll update this after deploying frontend
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Docker Configuration
DOCKER_TIMEOUT=30000

# OAuth (Optional - can skip for now)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
```

#### Frontend Environment (.env.local)
```bash
# Copy the example file
cp ONLINE-JUDGE-FRONTEND/.env.example ONLINE-JUDGE-FRONTEND/.env.local
```

Edit `ONLINE-JUDGE-FRONTEND/.env.local`:
```bash
# We'll update this after deploying backend
NEXT_PUBLIC_API_URL=http://localhost:5000

# Generate a random secret for NextAuth
NEXTAUTH_SECRET=another-super-secure-secret-key

# We'll update this after deploying frontend
NEXTAUTH_URL=http://localhost:3000

# OAuth (Optional - same as backend)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 2.2 Push Code to GitHub
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Ready for deployment"

# Create repository on GitHub and push
# Follow GitHub's instructions to push your code
```

---

## 🚂 STEP 3: DEPLOY BACKEND TO RAILWAY

### 3.1 Create Railway Account
1. Go to [https://railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub account
4. Authorize Railway to access your repositories

### 3.2 Deploy Backend
1. Click "Deploy from GitHub repo"
2. Select your Online Judge repository
3. Railway will detect it's a Node.js app
4. Click "Deploy Now"

### 3.3 Configure Backend Service
1. Click on your deployed service
2. Go to "Settings" tab
3. Change "Root Directory" to: `Backend`
4. Set "Build Command": `npm install --production`
5. Set "Start Command": `npm start`

### 3.4 Set Environment Variables
1. Go to "Variables" tab
2. Add these variables one by one:

```bash
NODE_ENV = production
MONGODB_URI = your-mongodb-atlas-connection-string
JWT_SECRET = your-jwt-secret-from-step-2
CORS_ORIGIN = http://localhost:3000
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
DOCKER_TIMEOUT = 30000
```

### 3.5 Get Backend URL
1. Go to "Settings" tab
2. Find "Public Networking"
3. Copy the generated domain (e.g., `https://your-app-name.railway.app`)
4. **Save this URL - you'll need it for the frontend!**

---

## 🌐 STEP 4: DEPLOY FRONTEND TO VERCEL

### 4.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub account
4. Authorize Vercel to access your repositories

### 4.2 Deploy Frontend
1. Click "New Project"
2. Import your GitHub repository
3. Vercel will detect it's a Next.js app
4. Set "Root Directory" to: `ONLINE-JUDGE-FRONTEND`
5. Click "Deploy"

### 4.3 Set Environment Variables
1. Go to your project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add these variables:

```bash
NEXT_PUBLIC_API_URL = https://your-railway-backend-url.railway.app
NEXTAUTH_SECRET = your-nextauth-secret-from-step-2
NEXTAUTH_URL = https://your-vercel-app.vercel.app
```

### 4.4 Get Frontend URL
1. After deployment, Vercel will show your app URL
2. Copy it (e.g., `https://your-app-name.vercel.app`)

---

## 🔄 STEP 5: UPDATE CORS SETTINGS

### 5.1 Update Backend CORS
1. Go back to Railway dashboard
2. Go to your backend service
3. Go to "Variables" tab
4. Update `CORS_ORIGIN` to your Vercel frontend URL:
```bash
CORS_ORIGIN = https://your-vercel-app.vercel.app
```

### 5.2 Redeploy Backend
1. The service will automatically redeploy with new environment variables
2. Wait for deployment to complete

---

## 🌱 STEP 6: INITIALIZE DATABASE

### 6.1 Seed the Database
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Deploy" tab
4. Click on the latest deployment
5. Open the deployment logs
6. You should see the service running

### 6.2 Run Database Seeder
1. In Railway, go to your service
2. Click "Settings" → "Deploy"
3. Add a "Build Command": `npm install --production && node seedDatabase.js && node seedAdmin.js`
4. Or use Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seeders
railway run node seedDatabase.js
railway run node seedAdmin.js
```

---

## 🧪 STEP 7: TEST YOUR DEPLOYMENT

### 7.1 Test Frontend
1. Open your Vercel app URL
2. You should see the Online Judge homepage
3. Try navigating to different pages

### 7.2 Test Backend API
1. Open `https://your-railway-backend-url.railway.app/api/health`
2. You should see a health check response

### 7.3 Test Full Flow
1. Register a new user account
2. Login to the platform
3. Browse problems
4. Try submitting code
5. Check if submissions are saved

---

## 🎉 STEP 8: YOU'RE LIVE!

### 8.1 Admin Access
Default admin credentials (change these immediately):
- Email: `admin@judge.com`
- Password: `admin123`

### 8.2 Share Your Platform
Your Online Judge is now live at:
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend API**: `https://your-backend-name.railway.app`

---

## 🐛 TROUBLESHOOTING

### Common Issues:

#### 1. Database Connection Error
- Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0)
- Verify connection string format
- Ensure password doesn't contain special characters

#### 2. Frontend Can't Connect to Backend
- Check CORS_ORIGIN in Railway environment variables
- Verify NEXT_PUBLIC_API_URL in Vercel environment variables
- Ensure both URLs are HTTPS

#### 3. Build Failures
- Check Node.js version (should be 18+)
- Verify package.json dependencies
- Check build logs for specific errors

#### 4. Railway Deployment Issues
- Ensure Root Directory is set to "Backend"
- Check start command is "npm start"
- Verify environment variables are set

#### 5. Vercel Deployment Issues
- Ensure Root Directory is set to "ONLINE-JUDGE-FRONTEND"
- Check that Next.js build completes successfully
- Verify environment variables are set

---

## 📞 NEED HELP?

If you encounter issues:
1. Check the deployment logs in Railway/Vercel dashboards
2. Verify all environment variables are set correctly
3. Test API endpoints directly
4. Check MongoDB Atlas connectivity

**Your Online Judge Platform should now be fully deployed and running! 🎉**

## 💰 COSTS
- **MongoDB Atlas**: Free (512MB)
- **Railway**: Free ($5 credit)
- **Vercel**: Free (100GB bandwidth)
- **Total**: $0/month for moderate usage
