#!/bin/bash

# Complete project cleanup script
# This script prepares the project for GitHub open source release

echo "🧹 Starting complete project cleanup..."

# Remove development artifacts
echo "📁 Cleaning development artifacts..."

# Backend cleanup
cd Backend
rm -rf node_modules/ .next/ build/ dist/ coverage/
rm -f *.log npm-debug.log* yarn-debug.log* yarn-error.log*
rm -rf logs/ temp/
rm -f test-*.js debug-*.js *-test.js

# Frontend cleanup
cd ../ONLINE-JUDGE-FRONTEND
rm -rf node_modules/ .next/ build/ dist/ coverage/
rm -f *.log npm-debug.log* yarn-debug.log* yarn-error.log*

# Root cleanup
cd ..
rm -rf node_modules/ .next/ build/ dist/ coverage/
rm -f *.log npm-debug.log* yarn-debug.log* yarn-error.log*

# Remove backup directory
rm -rf backup/

# Remove test files
find . -name "*test*" -type f -not -path "./node_modules/*" -not -path "./.git/*" -not -name "*.test.js" -not -name "*.spec.js" | grep -E "\.(js|ts|json)$" | head -10

# Remove temporary files
find . -name "tmp" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "temp" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true

# Clean git history (optional - uncomment if needed)
# echo "🗂️ Cleaning git history..."
# git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch *.log' --prune-empty --tag-name-filter cat -- --all

echo "✅ Project cleanup completed!"
echo ""
echo "📋 Next steps for GitHub release:"
echo "1. Review all files for sensitive information"
echo "2. Update repository URLs in README and package.json files"
echo "3. Test the deployment scripts"
echo "4. Create initial release tag"
echo "5. Set up GitHub secrets for CI/CD"
echo ""
echo "🔐 Required GitHub Secrets:"
echo "- AWS_ACCESS_KEY_ID"
echo "- AWS_SECRET_ACCESS_KEY"
echo "- EC2_HOST"
echo "- EC2_USERNAME"
echo "- EC2_SSH_KEY"
echo "- ECR_REGISTRY"
echo "- NEXTAUTH_URL"
echo "- NEXTAUTH_SECRET"
echo "- NEXT_PUBLIC_API_URL"
echo "- MONGODB_URI"
echo "- JWT_SECRET"
echo "- CORS_ORIGIN"
