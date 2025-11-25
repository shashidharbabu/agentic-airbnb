#!/bin/bash
# Quick script to check if frontend can access backend

echo "🔍 Checking Traveler Backend API..."
echo ""

# Check if port-forward is running
if ps -p $(cat /tmp/traveller-backend-pf.pid 2>/dev/null) > /dev/null 2>&1; then
    echo "✅ Port-forward is running (PID: $(cat /tmp/traveller-backend-pf.pid))"
else
    echo "❌ Port-forward is NOT running. Starting it..."
    kubectl port-forward -n airbnb-system svc/traveller-backend-service 5001:5001 > /tmp/traveller-backend-pf.log 2>&1 &
    echo $! > /tmp/traveller-backend-pf.pid
    sleep 3
    echo "✅ Port-forward started (PID: $(cat /tmp/traveller-backend-pf.pid))"
fi

echo ""
echo "📡 Testing API endpoint..."
RESPONSE=$(curl -s "http://localhost:5001/api/properties/search?page=1&limit=5")
PROP_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('properties', [])))" 2>/dev/null || echo "0")

if [ "$PROP_COUNT" -gt "0" ]; then
    echo "✅ API is working! Found $PROP_COUNT properties"
    echo ""
    echo "🌐 Frontend should use: http://localhost:5001"
    echo "📱 Make sure your browser can access: http://localhost:5001/api/properties/search"
else
    echo "❌ API is not returning properties"
    echo "Response: $RESPONSE"
fi

echo ""
echo "💡 If properties still don't show:"
echo "   1. Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)"
echo "   2. Check browser console for errors"
echo "   3. Check Network tab for failed requests"




