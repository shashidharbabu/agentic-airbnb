#!/bin/bash

echo "🛑 Stopping all frontend servers..."
pkill -f "node.*vite" || true
sleep 2

echo ""
echo "✅ Port configuration fixed:"
echo "   - Host frontend: Port 5174"
echo "   - Traveller frontend: Port 5173"
echo ""
echo "📋 To start the servers, open TWO separate terminals:"
echo ""
echo "Terminal 1 - Start HOST frontend:"
echo "cd \"/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/host\""
echo "npm run dev"
echo ""
echo "Terminal 2 - Start TRAVELLER frontend:"
echo "cd \"/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/traveller\""
echo "npm run dev"
echo ""
echo "After both are running:"
echo "   🏠 Host: http://localhost:5174"
echo "   🧳 Traveller: http://localhost:5173"
echo ""

