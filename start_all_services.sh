#!/bin/bash

# Start All Services Script for Agentic Airbnb
# This script starts all 5 services in separate terminal windows/tabs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🚀 Starting Agentic Airbnb Services..."
echo "======================================"
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB might not be running. Please start MongoDB first:"
        echo "   brew services start mongodb-community  # macOS"
        echo "   sudo systemctl start mongod            # Linux"
        echo ""
    fi
else
    echo "⚠️  mongosh not found. Please ensure MongoDB is installed and running."
    echo ""
fi

# Function to start service in new terminal
start_service() {
    local service_name=$1
    local service_dir=$2
    local start_command=$3
    local port=$4
    
    echo "Starting $service_name..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - use osascript to open new terminal
        osascript -e "tell application \"Terminal\" to do script \"cd '$service_dir' && echo '🚀 Starting $service_name on port $port...' && $start_command\""
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - use gnome-terminal or xterm
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --tab --title="$service_name" -- bash -c "cd '$service_dir' && echo '🚀 Starting $service_name on port $port...' && $start_command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -T "$service_name" -e "cd '$service_dir' && echo '🚀 Starting $service_name on port $port...' && $start_command; bash" &
        else
            echo "⚠️  Please start $service_name manually:"
            echo "   cd $service_dir"
            echo "   $start_command"
        fi
    else
        echo "⚠️  Please start $service_name manually:"
        echo "   cd $service_dir"
        echo "   $start_command"
    fi
    
    sleep 2
}

# Start services
echo "📦 Starting services..."
echo ""

# 1. Host Backend (Port 4000)
start_service "Host Backend" "$PROJECT_ROOT/backend/host" "npm run dev" "4000"

# 2. Traveler Backend (Port 5001)
start_service "Traveler Backend" "$PROJECT_ROOT/backend/traveller" "npm run dev" "5001"

# 3. Host Frontend (Port 5174)
start_service "Host Frontend" "$PROJECT_ROOT/frontend/host" "npm run dev" "5174"

# 4. Traveler Frontend (Port 5173)
start_service "Traveler Frontend" "$PROJECT_ROOT/frontend/traveller" "npm run dev" "5173"

# 5. AI Agent (Port 8000)
start_service "AI Agent" "$PROJECT_ROOT/agent" "python3 run_server_sqlite.py" "8000"

echo ""
echo "✅ All services started!"
echo ""
echo "🔗 Access Points:"
echo "   Host Frontend:      http://localhost:5174"
echo "   Traveler Frontend: http://localhost:5173"
echo "   Host Backend API:   http://localhost:4000"
echo "   Traveler Backend:   http://localhost:5001"
echo "   AI Agent API:       http://localhost:8000"
echo "   AI Agent Docs:      http://localhost:8000/docs"
echo ""
echo "⏳ Wait 10-15 seconds for all services to start..."
echo ""
echo "🧪 To run comprehensive tests:"
echo "   npm install axios  # If not already installed"
echo "   node test_e2e_comprehensive.js"
echo ""

