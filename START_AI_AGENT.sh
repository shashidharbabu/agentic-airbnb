#!/bin/bash

# AI Agent Quick Start Script
# This script starts the AI Agent backend server

echo "🚀 Starting AI Agent Backend..."
echo ""

# Navigate to agent directory
cd "$(dirname "$0")/agent"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create /agent/.env with your OpenAI API key"
    exit 1
fi

# Check if OpenAI key is configured
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  WARNING: OpenAI API key may not be configured correctly"
    echo "Please check /agent/.env file"
fi

echo "✅ Configuration file found"
echo "📍 Starting server on http://localhost:8000"
echo ""
echo "Press CTRL+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
python3 run_server_sqlite.py

