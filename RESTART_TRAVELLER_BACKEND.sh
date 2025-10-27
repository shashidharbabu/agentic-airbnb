#!/bin/bash

# Kill any existing process on port 5001
echo "🔴 Stopping any existing traveller backend..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "No process found on port 5001"

sleep 2

# Navigate to traveller backend
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/backend/traveller"

echo ""
echo "🚀 Starting traveller backend..."
echo "⏳ Please wait for 'Database connected successfully' message..."
echo ""

# Start the server
npm run dev

