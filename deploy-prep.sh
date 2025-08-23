#!/bin/bash

# 🚀 Online Judge Platform - Quick Deployment Script
# ==================================================
# This script automates the deployment preparation process

echo "🚀 ONLINE JUDGE PLATFORM - DEPLOYMENT PREPARATION"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_info "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed. Please install git"
        exit 1
    fi
    
    print_status "All requirements met"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    # Backend dependencies
    cd Backend
    print_info "Installing backend dependencies..."
    npm install --production
    
    # Frontend dependencies
    cd ../ONLINE-JUDGE-FRONTEND
    print_info "Installing frontend dependencies..."
    npm install
    
    cd ..
    print_status "Dependencies installed"
}

# Setup environment files
setup_environment() {
    print_info "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "Backend/.env" ]; then
        cp Backend/.env.example Backend/.env
        print_warning "Backend .env file created. Please update with your values."
    else
        print_status "Backend .env file already exists"
    fi
    
    # Frontend environment
    if [ ! -f "ONLINE-JUDGE-FRONTEND/.env.local" ]; then
        cp ONLINE-JUDGE-FRONTEND/.env.example ONLINE-JUDGE-FRONTEND/.env.local
        print_warning "Frontend .env.local file created. Please update with your values."
    else
        print_status "Frontend .env.local file already exists"
    fi
    
    print_status "Environment files ready"
}

# Build applications
build_applications() {
    print_info "Building applications..."
    
    # Build frontend
    cd ONLINE-JUDGE-FRONTEND
    print_info "Building frontend..."
    npm run build
    
    cd ..
    print_status "Applications built successfully"
}

# Create deployment package
create_deployment_package() {
    print_info "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment-package
    
    # Copy essential files
    cp -r Backend deployment-package/
    cp -r ONLINE-JUDGE-FRONTEND deployment-package/
    cp README.md deployment-package/
    cp DEPLOYMENT_ANALYSIS_REPORT.md deployment-package/
    
    # Remove unnecessary files from package
    rm -rf deployment-package/Backend/node_modules
    rm -rf deployment-package/ONLINE-JUDGE-FRONTEND/node_modules
    rm -rf deployment-package/ONLINE-JUDGE-FRONTEND/.next
    
    print_status "Deployment package created in deployment-package/"
}

# Main execution
main() {
    echo
    print_info "Starting deployment preparation..."
    echo
    
    check_requirements
    echo
    
    install_dependencies
    echo
    
    setup_environment
    echo
    
    build_applications
    echo
    
    create_deployment_package
    echo
    
    print_status "DEPLOYMENT PREPARATION COMPLETE!"
    echo
    print_info "Next steps:"
    echo "1. Update environment variables in Backend/.env and ONLINE-JUDGE-FRONTEND/.env.local"
    echo "2. Set up MongoDB Atlas database"
    echo "3. Deploy to your chosen platform (Railway, Render, Vercel, etc.)"
    echo "4. Read DEPLOYMENT_ANALYSIS_REPORT.md for detailed instructions"
    echo
    print_status "Good luck with your deployment! 🚀"
}

# Run main function
main
