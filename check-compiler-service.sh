#!/bin/bash

IP="35.154.126.162"
PORT="3001"

echo "🔍 Checking Compiler Service Status..."
echo "IP: $IP"
echo "Port: $PORT"
echo "Time: $(date)"
echo "=================================="

# Check if port is open
echo "1. Testing port connectivity..."
if timeout 5 bash -c "</dev/tcp/$IP/$PORT" 2>/dev/null; then
    echo "✅ Port $PORT is open"
    
    # Check health endpoint
    echo ""
    echo "2. Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s --connect-timeout 5 http://$IP:$PORT/health)
    
    if [ $? -eq 0 ] && [ ! -z "$HEALTH_RESPONSE" ]; then
        echo "✅ Health endpoint responding:"
        echo "$HEALTH_RESPONSE"
        
        # Test compile endpoint
        echo ""
        echo "3. Testing compile endpoint..."
        COMPILE_RESPONSE=$(curl -s --connect-timeout 10 -X POST \
            -H "Content-Type: application/json" \
            -d '{"code":"#include<iostream>\nint main(){std::cout<<\"Hello World\";return 0;}","language":"cpp"}' \
            http://$IP:$PORT/compile)
        
        if [ $? -eq 0 ]; then
            echo "✅ Compile endpoint responding:"
            echo "$COMPILE_RESPONSE"
            echo ""
            echo "🎉 Compiler service is fully operational!"
        else
            echo "⚠️  Compile endpoint not responding yet"
        fi
    else
        echo "⚠️  Health endpoint not responding yet"
    fi
else
    echo "❌ Port $PORT is not open yet"
    echo "💡 Service is probably still starting up (takes 5-10 minutes)"
fi

echo ""
echo "=================================="
echo "If service is not ready yet, wait 2-3 minutes and run this script again."
echo "Manual check: curl http://$IP:$PORT/health"
