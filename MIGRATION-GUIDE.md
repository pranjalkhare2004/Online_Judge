# 🔄 Repository Migration Guide

This guide helps you migrate your cleaned Online Judge Platform to your existing GitHub repository: https://github.com/pranjalkhare2004/Online_Judge

## 🚀 Option 1: Automated Migration (Recommended)

Run the automated migration script:

```bash
# From your Online-Judge directory
./migrate-to-existing-repo.sh
```

This script will:
- ✅ Clone your existing repository
- ✅ Backup existing content to a new branch
- ✅ Replace all content with the new platform
- ✅ Update all repository URLs
- ✅ Commit and push everything

## 🛠️ Option 2: Manual Migration

If you prefer manual control:

### Step 1: Backup Current Repository
```bash
# Clone your existing repo
git clone https://github.com/pranjalkhare2004/Online_Judge.git
cd Online_Judge

# Create backup branch
git checkout -b backup-old-content
git push origin backup-old-content
git checkout main
```

### Step 2: Clean Existing Content
```bash
# Remove all files except .git
find . -type f -not -path "./.git/*" -delete
find . -type d -not -path "./.git/*" -not -path "./.git" -empty -delete
```

### Step 3: Copy New Project
```bash
# Copy all files from your cleaned project
cp -r /path/to/your/Online-Judge/* .
cp -r /path/to/your/Online-Judge/.* . 2>/dev/null || true
```

### Step 4: Update Repository URLs
```bash
# Update README.md
sed -i 's|your-username|pranjalkhare2004|g' README.md
sed -i 's|online-judge|Online_Judge|g' README.md

# Update package.json
sed -i 's|your-username|pranjalkhare2004|g' ONLINE-JUDGE-FRONTEND/package.json
sed -i 's|online-judge|Online_Judge|g' ONLINE-JUDGE-FRONTEND/package.json

# Update other files
sed -i 's|your-username|pranjalkhare2004|g' CONTRIBUTING.md
sed -i 's|online-judge|Online_Judge|g' CONTRIBUTING.md
```

### Step 5: Commit and Push
```bash
git add .
git commit -m "🚀 Complete Online Judge Platform Implementation

✨ New Features:
- Modern Next.js frontend with TypeScript
- Robust Node.js backend with Express  
- Docker-based code execution
- MongoDB integration
- Real-time submission processing
- AWS deployment ready

📚 Includes complete documentation and deployment scripts"

git push origin main
```

## 🔧 Required GitHub Secrets

After migration, set up these GitHub Secrets for CI/CD:

Go to: Repository Settings → Secrets and Variables → Actions

Add these secrets:
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
EC2_HOST=your-ec2-public-ip
EC2_USERNAME=ubuntu
EC2_SSH_KEY=contents-of-your-pem-file
ECR_REGISTRY=your-ecr-registry-url
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
NEXT_PUBLIC_API_URL=http://your-domain.com/api
MONGODB_URI=mongodb://localhost:27017/online-judge
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://your-domain.com
```

## 🌐 Post-Migration Steps

### 1. Test Local Development
```bash
# Backend
cd Backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev

# Frontend (new terminal)
cd ../ONLINE-JUDGE-FRONTEND
npm install  
cp .env.example .env.local
# Edit .env.local with your settings
npm run dev
```

### 2. Deploy to AWS Free Tier
```bash
cd deployment/aws
./deploy.sh
```

### 3. Update Repository Description
Go to your GitHub repository and update:
- **Description**: "Modern online judge platform for competitive programming with Next.js frontend and Node.js backend"
- **Topics**: `online-judge`, `competitive-programming`, `nextjs`, `nodejs`, `mongodb`, `docker`, `aws`
- **Website**: Your deployed URL

### 4. Create Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

Then create a release on GitHub with release notes.

## 🎯 Verification Checklist

After migration, verify:

- [ ] Repository contains all project files
- [ ] README displays correctly with updated URLs
- [ ] GitHub Actions workflows are present
- [ ] Environment template files exist
- [ ] Deployment scripts are executable
- [ ] License file is present
- [ ] Contributing guidelines are clear

## 🆘 Troubleshooting

### If Migration Script Fails
```bash
# Reset to clean state
git reset --hard HEAD~1
git clean -fd

# Try manual migration instead
```

### If URLs are Wrong
```bash
# Fix repository URLs globally
find . -name "*.md" -o -name "*.json" -o -name "*.sh" | xargs sed -i 's|old-url|new-url|g'
```

### If CI/CD Doesn't Work
1. Check GitHub Secrets are set correctly
2. Verify workflow files are in `.github/workflows/`
3. Test locally first: `npm run build`

## 📞 Support

If you encounter issues:
1. Check the automated script output for errors
2. Verify your Git configuration
3. Ensure you have push permissions to the repository
4. Create an issue in the repository if needed

---

Your Online Judge Platform will be ready for development and deployment! 🎉
