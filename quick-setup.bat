@echo off
echo 🚀 ONLINE JUDGE PLATFORM - QUICK SETUP
echo =====================================
echo.

echo 📋 Setting up environment files...

REM Create Backend .env file
if not exist "Backend\.env" (
    copy "Backend\.env.example" "Backend\.env"
    echo ✅ Created Backend\.env
) else (
    echo ⚠️  Backend\.env already exists
)

REM Create Frontend .env.local file
if not exist "ONLINE-JUDGE-FRONTEND\.env.local" (
    copy "ONLINE-JUDGE-FRONTEND\.env.example" "ONLINE-JUDGE-FRONTEND\.env.local"
    echo ✅ Created ONLINE-JUDGE-FRONTEND\.env.local
) else (
    echo ⚠️  ONLINE-JUDGE-FRONTEND\.env.local already exists
)

echo.
echo 🎯 NEXT STEPS:
echo ==============
echo 1. Update Backend\.env with your MongoDB Atlas connection string
echo 2. Update Backend\.env with a secure JWT secret
echo 3. Update ONLINE-JUDGE-FRONTEND\.env.local with API URLs
echo 4. Follow the STEP_BY_STEP_DEPLOYMENT_GUIDE.md
echo.
echo 📖 Read STEP_BY_STEP_DEPLOYMENT_GUIDE.md for detailed instructions
echo.
echo ✅ Setup complete! Ready for deployment configuration.
pause
