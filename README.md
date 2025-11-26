# Agentic Airbnb - AI Travel Concierge

A full-stack distributed Airbnb platform with an intelligent AI-powered travel concierge service. This system includes separate host and traveler applications, backend APIs, and an AI agent for personalized travel planning.

## 📁 Repository Structure

```
agentic-airbnb/
├── agent/              # AI Agent Backend (FastAPI + Python)
├── backend/
│   ├── host/          # Host Backend API (Node.js + Express)
│   └── traveller/     # Traveller Backend API (Node.js + Express)
├── frontend/
│   ├── host/          # Host Frontend (React + Vite)
│   └── traveller/     # Traveller Frontend (React + Vite)
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** (v16 or higher) installed
- **Python** (3.8 or higher) installed
- **MySQL** running on localhost:3306
- **OpenAI API Key** (for AI agent features)
- **npm** or **yarn** package manager

---

## Step 1: Clone and Navigate to Project

```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb"
```

---

## Step 2: Setup Environment Variables

### Backend Host (.env)
Create `backend/host/.env`:
```bash
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_core
SESSION_SECRET=host-secret-key-change-me
SESSION_COOKIE_NAME=airbnb_host.sid
WEB_ORIGIN=http://localhost:5174
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### Backend Traveller (.env)
Create `backend/traveller/.env`:
```bash
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_core
SESSION_SECRET=traveller-secret-key-change-me
WEB_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### Frontend Host (.env)
Create `frontend/host/.env`:
```bash
VITE_HOST_API=http://localhost:4000
VITE_AGENT_API=http://localhost:8000
```

### Frontend Traveller (.env)
Create `frontend/traveller/.env`:
```bash
VITE_API_URL=http://localhost:5001
VITE_AGENT_API_URL=http://localhost:8000
```

### AI Agent (.env)
Create `agent/.env`:
```bash
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key

# Tavily API Key (provided - for web search)
TAVILY_API_KEY=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

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

**⚠️ Important:** Replace `your_mysql_password` with your actual MySQL root password.

---

## Step 3: Setup Database

Run the database migration to create the schema:

```bash
mysql -u root -p airbnb_core < backend/host/sql/unify_schemas.sql
```

Enter your MySQL password when prompted.

---

## Step 4: Install Dependencies

### Install Backend Dependencies
```bash
# Host Backend
cd backend/host
npm install
cd ../..

# Traveller Backend
cd backend/traveller
npm install
cd ../..
```

### Install Frontend Dependencies
```bash
# Host Frontend
cd frontend/host
npm install
cd ../..

# Traveller Frontend
cd frontend/traveller
npm install
cd ../..
```

### Install AI Agent Dependencies
```bash
# AI Agent
cd agent
pip3 install -r requirements.txt
# Optional: Setup database
python3 setup_sqlite.py
cd ..
```

---

## Step 5: Start All Servers

Open **5 separate terminal windows/tabs** and run the following commands:

### Terminal 1: Host Backend (Port 4000)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/backend/host"
npm run dev
```
✅ Expected: `Host API on http://localhost:4000`

### Terminal 2: Traveller Backend (Port 5001)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/backend/traveller"
npm run dev
```
✅ Expected: `Traveler API running on http://localhost:5001`

### Terminal 3: Host Frontend (Port 5174)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/host"
npm run dev
```
✅ Expected: `Local: http://localhost:5174/`

### Terminal 4: Traveller Frontend (Port 5173)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/frontend/traveller"
npm run dev
```
✅ Expected: `Local: http://localhost:5173/`

### Terminal 5: AI Agent Server (Port 8000)
```bash
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb/agent"
python3 run_server_sqlite.py
```
✅ Expected: `Server running on http://localhost:8000`

**Alternative for AI Agent:**
```bash
# Using the startup script
cd "/Users/spartan/Documents/Distributed Systems Lab/agentic-airbnb"
bash START_AI_AGENT.sh
```

---

## 🔗 Access Points

Once all servers are running, you can access:

- **Host Frontend**: http://localhost:5174
- **Traveller Frontend**: http://localhost:5173
- **Host Backend API**: http://localhost:4000
- **Traveller Backend API**: http://localhost:5001
- **AI Agent API**: http://localhost:8000
- **AI Agent Documentation**: http://localhost:8000/docs

---

## 📋 Features

### Host Platform
- Property listing management
- Booking requests management
- Profile management
- Photo uploads

### Traveller Platform
- Property search and discovery
- Booking management
- AI-powered travel concierge
- Personalized recommendations
- Day-by-day itinerary planning

### AI Agent
- Natural language travel planning
- Personalized activity recommendations
- Restaurant suggestions
- Weather-aware packing lists
- Real-time web search integration

---

## 🧪 Testing the System

### Basic Flow Test

1. **Create Host Account**
   - Open http://localhost:5174
   - Sign up as a host
   - Create a property listing

2. **Create Traveller Account**
   - Open http://localhost:5173
   - Sign up as a traveller
   - Search for properties

3. **Make a Booking**
   - Select a property
   - Choose dates and guests
   - Complete booking (status: PENDING)

4. **Host Approves Booking**
   - Go to host dashboard (http://localhost:5174)
   - Navigate to Bookings
   - Accept the booking request

5. **Traveller Sees Confirmation**
   - Go to traveller bookings page
   - Status should update to CONFIRMED

6. **Test AI Agent**
   - In traveller app, open the AI chat panel
   - Ask travel questions like: "Plan a 3-day trip to Paris"
   - Get personalized recommendations

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:4000 | xargs kill -9  # Host backend
lsof -ti:5001 | xargs kill -9  # Traveller backend
lsof -ti:5173 | xargs kill -9  # Traveller frontend
lsof -ti:5174 | xargs kill -9  # Host frontend
lsof -ti:8000 | xargs kill -9  # AI Agent
```

### MySQL Connection Issues
```bash
# Check if MySQL is running
mysql -u root -p -e "SELECT 1"

# Start MySQL (macOS)
brew services start mysql

# Start MySQL (Linux)
sudo systemctl start mysql
```

### Missing Dependencies
```bash
# Reinstall backend dependencies
cd backend/host && npm install
cd ../traveller && npm install

# Reinstall frontend dependencies
cd ../frontend/host && npm install
cd ../traveller && npm install

# Reinstall AI agent dependencies
cd ../../agent && pip3 install -r requirements.txt
```

### Environment Variable Issues
- Verify all `.env` files are created in the correct directories
- Check that MySQL password is correct
- Ensure OpenAI API key is set for AI agent features

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Bootstrap
- **Backend**: Node.js, Express, MySQL
- **AI Agent**: FastAPI, Python, LangChain, OpenAI, Tavily
- **Database**: MySQL (shared), SQLite (AI agent)
- **Authentication**: Express Sessions, Firebase (optional)

---

## 📚 Additional Documentation

- [Quick Start Guide](./QUICK_START.md) - Detailed integration guide
- [AI Agent Documentation](./agent/README.md) - AI agent details
- [API Documentation](./API_DOCUMENTATION_GUIDE.md) - API reference
- [Testing Guide](./TESTING_GUIDE.md) - Testing instructions

---

## 🎯 System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Host Frontend  │         │ Traveller Frontend│
│   (Port 5174)   │         │   (Port 5173)    │
└────────┬────────┘         └────────┬─────────┘
         │                            │
         │ HTTP                       │ HTTP
         │                            │
         ▼                            ▼
┌─────────────────┐         ┌─────────────────┐
│  Host Backend   │         │ Traveller Backend│
│   (Port 4000)   │         │   (Port 5001)   │
└────────┬────────┘         └────────┬─────────┘
         │                            │
         │                            │
         └────────────┬───────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   MySQL Database │
            │   airbnb_core    │
            └──────────────────┘

┌──────────────────────────────────────┐
│       AI Agent Server                │
│       (Port 8000)                    │
│   FastAPI + LangChain + OpenAI       │
└──────────────────────────────────────┘
```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review individual component READMEs
3. Check the documentation files in the root directory

---

**Built with ❤️ for intelligent travel planning**
