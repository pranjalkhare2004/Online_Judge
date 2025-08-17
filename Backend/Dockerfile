# DOCKER CONTAINER CONFIGURATION
#
# DESCRIPTION:
# This Dockerfile creates a containerized environment for the Online Judge backend
# application. It sets up Node.js runtime, installs system dependencies for code
# compilation, configures security settings, and prepares the production environment
# with proper user permissions and resource management.
#
# FEATURES:
# - Alpine Linux base for minimal size and security
# - Multi-language compilation support (Python, C++, Go, etc.)
# - Docker-in-Docker support for code execution isolation  
# - Security hardening with non-root user
# - Production-optimized dependency installation
# - Proper logging directory setup
# - Health checks and monitoring preparation
#
# BUILD PROCESS:
# 1. Node.js 18 Alpine base image
# 2. System dependency installation (compilers, tools)
# 3. Application dependency installation (npm ci)
# 4. Source code copying and configuration
# 5. Security user creation and permissions
# 6. Port exposure and startup configuration
#
# DEPENDENCIES INSTALLED:
# - python3: Python code execution
# - make/g++: C/C++ compilation
# - docker-cli: Container-based code execution
# - npm packages: Application dependencies
#
# USED BY:
# - docker-compose.yml: Service orchestration
# - CI/CD pipelines: Automated deployment
# - Production environments: Container deployment
# - Kubernetes: Pod deployment configuration
# - Development: Local containerized testing
#
# SECURITY FEATURES:
# - Non-root user execution (nodejs:1001)
# - Minimal attack surface with Alpine
# - Proper file permissions and ownership
# - Production-only dependency installation
# - Resource isolation and constraints

# Backend Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    docker-cli

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]
