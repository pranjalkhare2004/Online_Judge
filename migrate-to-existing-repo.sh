#!/bin/bash

# Repository Migration Script
# This script will clean your existing repository and migrate the new Online Judge Platform

set -e

REPO_URL="https://github.com/pranjalkhare2004/Online_Judge.git"
REPO_NAME="Online_Judge"
CURRENT_DIR=$(pwd)

echo "🚀 Starting repository migration to $REPO_URL"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "Backend" ] || [ ! -d "ONLINE-JUDGE-FRONTEND" ]; then
    echo "❌ Please run this script from the Online-Judge root directory"
    exit 1
fi

# Create a backup directory
echo "📁 Creating backup directory..."
mkdir -p ../migration-backup
cp -r . ../migration-backup/online-judge-source

# Clone your existing repository
echo "📥 Cloning existing repository..."
cd ..
if [ -d "$REPO_NAME" ]; then
    echo "🗑️ Removing existing clone..."
    rm -rf "$REPO_NAME"
fi

git clone "$REPO_URL" "$REPO_NAME"
cd "$REPO_NAME"

# Check current repository status
echo "📊 Current repository status:"
git log --oneline -5 || echo "No commits found"
echo ""

# Create a backup branch of existing content
echo "🔄 Creating backup branch..."
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    git checkout -b backup-$(date +%Y%m%d-%H%M%S)
    git push origin backup-$(date +%Y%m%d-%H%M%S) || echo "Warning: Could not push backup branch"
    git checkout main || git checkout master
fi

# Remove all existing files (except .git)
echo "🧹 Cleaning existing repository content..."
find . -type f -not -path "./.git/*" -delete
find . -type d -not -path "./.git/*" -not -path "./.git" -empty -delete

# Copy new project files
echo "📂 Copying new project files..."
cp -r "$CURRENT_DIR"/* .
cp -r "$CURRENT_DIR"/.* . 2>/dev/null || true

# Remove any copied .git directory from source
rm -rf .git.bak 2>/dev/null || true

# Update README with correct repository URL
echo "🔧 Updating repository URLs..."
sed -i 's|https://github.com/your-username/online-judge|https://github.com/pranjalkhare2004/Online_Judge|g' README.md 2>/dev/null || true
sed -i 's|your-username/online-judge|pranjalkhare2004/Online_Judge|g' README.md 2>/dev/null || true

# Update package.json files
if [ -f "ONLINE-JUDGE-FRONTEND/package.json" ]; then
    sed -i 's|"homepage": "https://github.com/your-username/online-judge"|"homepage": "https://github.com/pranjalkhare2004/Online_Judge"|g' ONLINE-JUDGE-FRONTEND/package.json
    sed -i 's|"url": "https://github.com/your-username/online-judge.git"|"url": "https://github.com/pranjalkhare2004/Online_Judge.git"|g' ONLINE-JUDGE-FRONTEND/package.json
    sed -i 's|"url": "https://github.com/your-username/online-judge/issues"|"url": "https://github.com/pranjalkhare2004/Online_Judge/issues"|g' ONLINE-JUDGE-FRONTEND/package.json
fi

# Update CONTRIBUTING.md
if [ -f "CONTRIBUTING.md" ]; then
    sed -i 's|https://github.com/your-username/online-judge|https://github.com/pranjalkhare2004/Online_Judge|g' CONTRIBUTING.md
    sed -i 's|your-username/online-judge|pranjalkhare2004/Online_Judge|g' CONTRIBUTING.md
fi

# Update deployment scripts
if [ -f "deployment/aws/user-data.sh" ]; then
    sed -i 's|https://github.com/your-username/online-judge.git|https://github.com/pranjalkhare2004/Online_Judge.git|g' deployment/aws/user-data.sh
fi

# Set up git configuration
echo "⚙️ Configuring Git..."
git config user.name "Pranjal Khare" 2>/dev/null || true
git config user.email "pranjalkhare2004@gmail.com" 2>/dev/null || true

# Add all files
echo "📤 Staging all files..."
git add .

# Create comprehensive commit message
COMMIT_MESSAGE="🚀 Complete Online Judge Platform Implementation

✨ Features:
- Modern Next.js frontend with TypeScript
- Robust Node.js backend with Express
- Docker-based code execution engine
- MongoDB database integration
- JWT authentication system
- Real-time submission processing
- Beautiful responsive UI with dark/light mode
- Admin panel for problem management

🛠️ Tech Stack:
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- Backend: Node.js, Express.js, MongoDB, Docker
- DevOps: GitHub Actions, AWS EC2/ECR, PM2, Nginx

🚀 Deployment:
- One-click AWS Free Tier deployment
- Docker containerization
- CI/CD pipeline with GitHub Actions
- Production-ready configuration

📚 Documentation:
- Complete setup guides
- API documentation
- Contributing guidelines
- AWS deployment scripts

🔧 Production Ready:
- Security best practices
- Performance optimizations
- Error handling and logging
- Rate limiting and CORS
- Code execution sandboxing

Previous repository content backed up to backup branch."

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push to repository
echo "🌐 Pushing to GitHub..."
git push origin main || git push origin master

echo ""
echo "🎉 Repository migration completed successfully!"
echo ""
echo "📋 Summary:"
echo "  ✅ Existing content backed up to backup branch"
echo "  ✅ New Online Judge Platform committed"
echo "  ✅ Repository URLs updated"
echo "  ✅ All files pushed to GitHub"
echo ""
echo "🔗 Your repository: $REPO_URL"
echo "📁 Local copy: $(pwd)"
echo "💾 Source backup: ../migration-backup/online-judge-source"
echo ""
echo "🔧 Next steps:"
echo "1. Set up GitHub Secrets for CI/CD deployment"
echo "2. Test the AWS deployment script: cd deployment/aws && ./deploy.sh"
echo "3. Configure your domain (optional)"
echo "4. Set up monitoring and alerts"
echo ""
echo "💡 To deploy to AWS Free Tier:"
echo "   cd deployment/aws"
echo "   ./deploy.sh"
