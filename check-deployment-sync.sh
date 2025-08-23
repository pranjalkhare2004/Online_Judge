#!/bin/bash

echo "🔍 DEPLOYMENT SYNC CHECK"
echo "========================="
echo "Time: $(date)"
echo ""

# 1. Railway Backend Health Check
echo "🚂 1. RAILWAY BACKEND STATUS:"
echo "URL: https://online-judge-platform-2024-production.up.railway.app"
RAILWAY_HEALTH=$(curl -s -w "%{http_code}" https://online-judge-platform-2024-production.up.railway.app/api/health -o /tmp/railway_health.json)
if [ "$RAILWAY_HEALTH" = "200" ]; then
    echo "✅ Railway backend is healthy"
    echo "   Response: $(cat /tmp/railway_health.json)"
else
    echo "❌ Railway backend failed (HTTP $RAILWAY_HEALTH)"
fi
echo ""

# 2. Enhanced API Check
echo "🔧 2. ENHANCED API STATUS:"
ENHANCED_API=$(curl -s -w "%{http_code}" "https://online-judge-platform-2024-production.up.railway.app/api/enhanced/problems?limit=1" -o /tmp/enhanced_api.json)
if [ "$ENHANCED_API" = "200" ]; then
    echo "✅ Enhanced API is working"
    echo "   Found problems: $(cat /tmp/enhanced_api.json | grep -o '"totalCount":[0-9]*' | cut -d':' -f2)"
else
    echo "❌ Enhanced API failed (HTTP $ENHANCED_API)"
fi
echo ""

# 3. Vercel Frontend Check
echo "🌐 3. VERCEL FRONTEND STATUS:"
echo "Custom Domain: https://codeopedia.vercel.app"
echo "Direct URL: https://online-judge-frontend-r56hoj3jr-pranjalkhare2004-8180s-projects.vercel.app"
VERCEL_STATUS=$(curl -s -w "%{http_code}" https://codeopedia.vercel.app -o /tmp/vercel_response.html)
if [ "$VERCEL_STATUS" = "200" ]; then
    echo "✅ Vercel frontend is live and accessible"
elif [ "$VERCEL_STATUS" = "404" ]; then
    echo "⚠️  Vercel deployment not found - needs redeployment"
    echo "   Error: DEPLOYMENT_NOT_FOUND"
else
    echo "❌ Vercel frontend failed (HTTP $VERCEL_STATUS)"
fi
echo ""

# 4. CORS Test
echo "🌍 4. CORS CONFIGURATION TEST:"
CORS_TEST=$(curl -s -w "%{http_code}" \
  -H "Origin: https://codeopedia.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -X OPTIONS \
  https://online-judge-platform-2024-production.up.railway.app/api/enhanced/problems \
  -o /tmp/cors_test.txt)

if [ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]; then
    echo "✅ CORS is properly configured"
else
    echo "⚠️  CORS test returned HTTP $CORS_TEST"
fi
echo ""

# 5. AWS Compiler Service Check
echo "🐳 5. AWS COMPILER SERVICE STATUS:"
if [ -n "$COMPILER_IP" ]; then
    COMPILER_STATUS=$(curl -s -w "%{http_code}" http://$COMPILER_IP:3001/health -o /tmp/compiler_health.json)
    if [ "$COMPILER_STATUS" = "200" ]; then
        echo "✅ AWS Compiler service is healthy"
        echo "   Response: $(cat /tmp/compiler_health.json)"
    else
        echo "❌ AWS Compiler service failed (HTTP $COMPILER_STATUS)"
    fi
else
    echo "⏳ AWS Compiler service not yet deployed"
    echo "   Will be available at: http://NEW_EC2_IP:3001/health"
fi
echo ""

# Summary
echo "📋 DEPLOYMENT SUMMARY:"
echo "====================="
echo "Railway Backend:    $([ "$RAILWAY_HEALTH" = "200" ] && echo "✅ HEALTHY" || echo "❌ FAILED")"
echo "Enhanced API:       $([ "$ENHANCED_API" = "200" ] && echo "✅ WORKING" || echo "❌ FAILED")"
echo "Vercel Frontend:    $([ "$VERCEL_STATUS" = "200" ] && echo "✅ LIVE" || echo "⚠️  NEEDS REDEPLOY")"
echo "CORS Config:        $([ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ] && echo "✅ CONFIGURED" || echo "⚠️  CHECK NEEDED")"
echo "AWS Compiler:       $([ -n "$COMPILER_IP" ] && [ "$COMPILER_STATUS" = "200" ] && echo "✅ READY" || echo "⏳ PENDING")"
echo ""

if [ "$RAILWAY_HEALTH" = "200" ] && [ "$ENHANCED_API" = "200" ] && ([ "$CORS_TEST" = "200" ] || [ "$CORS_TEST" = "204" ]); then
    echo "🎉 BACKEND IS FULLY OPERATIONAL!"
    if [ "$VERCEL_STATUS" = "200" ]; then
        echo "🎉 FRONTEND IS FULLY OPERATIONAL!"
        echo "🚀 SYSTEM IS READY FOR USERS!"
    else
        echo "⚠️  FRONTEND NEEDS REDEPLOYMENT TO VERCEL"
    fi
else
    echo "⚠️  SOME COMPONENTS NEED ATTENTION"
fi

# Cleanup
rm -f /tmp/railway_health.json /tmp/enhanced_api.json /tmp/vercel_response.html /tmp/cors_test.txt /tmp/compiler_health.json
