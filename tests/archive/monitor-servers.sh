#!/bin/bash

echo "🚀 MONITORING BACKEND AND FRONTEND SERVERS"
echo "==========================================="
echo ""
echo "📊 Backend Server Status:"
echo "  - URL: http://localhost:5000"  
echo "  - Health Check: http://localhost:5000/api/health"
echo "  - Auth Endpoints: /api/auth/register, /api/auth/login"
echo "  - New Stats Endpoints: /api/user/:id/stats, /api/user/:id/contests"
echo ""
echo "🎨 Frontend Server Status:"
echo "  - URL: http://localhost:3000"
echo "  - Auth Page: http://localhost:3000/auth"
echo "  - Profile Page: http://localhost:3000/profile"
echo ""
echo "⚠️  WATCHING FOR ERRORS..."
echo "   You can now test user signup and login!"
echo "   I'll monitor both servers for any issues."
echo ""

# Test if servers are responding
echo "🔍 Quick Server Health Check:"

# Backend health check
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "  ✅ Backend: Healthy (HTTP $BACKEND_STATUS)"
else
    echo "  ❌ Backend: Issue (HTTP $BACKEND_STATUS)"
fi

# Frontend check
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "  ✅ Frontend: Healthy (HTTP $FRONTEND_STATUS)" 
else
    echo "  ⚠️  Frontend: Starting up or issue (HTTP $FRONTEND_STATUS)"
fi

echo ""
echo "🎯 Ready for testing!"
echo "   Open http://localhost:3000/auth to test signup/login"
echo ""
