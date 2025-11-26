# Agentic Airbnb - Complete Codebase Overview

## 📋 Executive Summary

This is a **full-stack distributed Airbnb platform** with an AI-powered travel concierge service. The system consists of:

- **2 Frontend Applications** (React + Vite)
- **2 Backend APIs** (Node.js + Express)
- **1 AI Agent Service** (FastAPI + Python)
- **1 Shared MySQL Database** (airbnb_core)
- **1 SQLite Database** (for AI agent local data)

---

## 🏗️ System Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   Host Frontend     │         │ Traveller Frontend  │
│   (Port 5174)       │         │   (Port 5173)       │
│   React + Vite      │         │   React + Vite      │
└──────────┬──────────┘         └──────────┬──────────┘
           │                                │
           │ HTTP                           │ HTTP
           │                                │
           ▼                                ▼
┌─────────────────────┐         ┌─────────────────────┐
│   Host Backend      │         │ Traveller Backend   │
│   (Port 4000)       │         │   (Port 5001)       │
│   Node.js + Express │         │   Node.js + Express │
└──────────┬──────────┘         └──────────┬──────────┘
           │                                │
           └────────────┬───────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   MySQL Database      │
            │   airbnb_core         │
            │   (Shared)            │
            └───────────────────────┘

┌─────────────────────────────────────────────┐
│       AI Agent Server                       │
│       (Port 8000)                           │
│       FastAPI + Python                      │
│       - LangChain + OpenAI                  │
│       - Tavily Web Search                   │
│       - SQLite (local data)                 │
└─────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

### **Frontend Applications**

#### `frontend/host/` - Host/Property Owner Interface
- **Tech Stack**: React 18, Vite, Bootstrap
- **Port**: 5174
- **Key Features**:
  - Property listing management
  - Booking request approval/rejection
  - Profile management
  - Multi-step property onboarding
  - Photo uploads
  - Dashboard with analytics

**Key Files**:
- `src/App.jsx` - Main router with authentication guards
- `src/pages/` - 25+ page components
- `src/components/` - Reusable UI components
- `src/context/AuthContext.jsx` - Authentication state management
- `src/api/client.js` - API client configuration

**Routes**:
- `/login` - Host login
- `/` - Dashboard (requires auth)
- `/properties/new` - Create new property
- `/bookings` - Manage booking requests
- `/host/listings` - View all listings
- `/onboarding/*` - Multi-step property creation flow

#### `frontend/traveller/` - Traveler/Guest Interface
- **Tech Stack**: React 18, Vite, Bootstrap
- **Port**: 5173
- **Key Features**:
  - Property search and discovery
  - Booking management
  - Favorites system
  - **AI-powered travel concierge** (chatbot)
  - Profile management
  - Booking history

**Key Files**:
- `src/App.jsx` - Main router
- `src/components/AIAgentPanel.jsx` - AI chatbot interface
- `src/components/AIAgentButton.jsx` - Floating chat button
- `src/pages/` - 9 page components
- `src/context/AuthContext.jsx` - Authentication state

**Routes**:
- `/` - Home/search page
- `/login`, `/signup` - Authentication
- `/dashboard` - User dashboard
- `/property/:id` - Property details
- `/bookings` - Booking management
- `/favorites` - Saved properties
- `/history` - Past bookings

---

### **Backend APIs**

#### `backend/host/` - Host Backend API
- **Tech Stack**: Node.js, Express, MySQL, Express-Session
- **Port**: 4000
- **Database**: MySQL (airbnb_core)
- **Authentication**: Session-based (cookie: `airbnb_host.sid`)

**Key Files**:
- `src/server.js` - Main Express server with Swagger docs
- `src/routes/`:
  - `auth.js` - Signup, login, logout, profile management
  - `properties.js` - CRUD operations for properties
  - `bookings.js` - Booking request management
  - `owners.js` - Owner profile endpoints
  - `public.js` - Public property search
- `src/middleware/`:
  - `auth.js` - Authentication middleware
  - `passport.js` - OAuth (Google) integration
  - `firebase.js` - Firebase Admin SDK
  - `upload.js` - File upload handling
- `src/db.js` - MySQL connection pool
- `sql/` - Database schema and migrations

**Key Endpoints**:
- `POST /auth/signup` - Create host account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /properties` - Create property
- `GET /properties/mine` - Get host's properties
- `GET /bookings/incoming` - Get booking requests
- `POST /bookings/:id/accept` - Accept booking
- `POST /bookings/:id/cancel` - Cancel booking

**Database Tables** (MySQL):
- `owners` - Host accounts
- `properties` - Property listings
- `property_photos` - Property images
- `bookings` - Booking requests
- `sessions` - Express session storage

#### `backend/traveller/` - Traveler Backend API
- **Tech Stack**: Node.js, Express, MySQL, Express-Session
- **Port**: 5001
- **Database**: MySQL (airbnb_core) - **SHARED with host backend**
- **Authentication**: Session-based (cookie: `airbnb_traveller.sid`)

**Key Files**:
- `src/server.js` - Main Express server with Swagger docs
- `src/routes/`:
  - `auth.js` - Traveler authentication
  - `traveler.js` - Profile management
  - `properties.js` - Property search
  - `bookings.js` - Booking creation/management
  - `favorites.js` - Favorites management
- `src/config/database.js` - MySQL connection
- `src/middleware/auth.js` - Authentication middleware

**Key Endpoints**:
- `POST /api/auth/signup` - Create traveler account
- `POST /api/auth/login` - Login
- `GET /api/traveler/profile` - Get/update profile
- `GET /api/properties/search` - Search properties (with filters)
- `GET /api/properties/:id` - Get property details
- `POST /api/bookings` - Create booking request
- `GET /api/bookings` - Get traveler's bookings
- `GET /api/bookings/internal/traveler/:id/upcoming` - **Internal endpoint for AI agent**
- `POST /api/favorites` - Add to favorites
- `GET /api/favorites/traveler/:id` - Get favorites

**Database Tables** (MySQL - shared):
- `users` - Traveler accounts
- `traveler_profiles` - Extended traveler info
- `properties` - Same as host (shared)
- `bookings` - Same as host (shared)
- `favorites` - Traveler's saved properties

**Important**: Both backends share the same MySQL database (`airbnb_core`), allowing seamless data sharing between hosts and travelers.

---

### **AI Agent Service**

#### `agent/` - AI Travel Concierge
- **Tech Stack**: FastAPI, Python, LangChain, OpenAI, Tavily
- **Port**: 8000
- **Database**: SQLite (local) + MySQL (via HTTP calls to traveler backend)

**Key Files**:
- `app/main_sqlite.py` - Main FastAPI application
- `app/services/`:
  - `simple_ai_agent.py` - Core AI agent with intent detection
  - `simple_ai_agent_helpers.py` - Helper functions
  - `tavily_service.py` - Web search integration
  - `recommendation_engine.py` - Activity/restaurant recommendations
  - `itinerary_planner.py` - Day-by-day planning
  - `conversation_memory.py` - Conversation history management
- `app/models.py` - SQLAlchemy models (SQLite)
- `app/schemas.py` - Pydantic schemas
- `app/config_sqlite.py` - Configuration
- `app/database_sqlite.py` - SQLite connection
- `run_server_sqlite.py` - Server startup script

**Key Endpoints**:
- `POST /api/ai-agent/chat` - **Main chat endpoint** (used by frontend)
  - Accepts: `message`, `traveler_id`, `booking_id`, `conversation_history`
  - Automatically fetches traveler's upcoming bookings from traveler backend
  - Returns: AI response with recommendations
- `POST /api/concierge` - Full concierge request (structured)
- `GET /api/search/activities` - Search activities
- `GET /api/search/restaurants` - Search restaurants
- `GET /api/search/events` - Search local events
- `GET /api/search/weather` - Get weather info

**AI Capabilities**:
1. **Intent Detection**: Greetings, day planning, restaurants, activities, packing, questions
2. **Natural Language Understanding**: Extracts location, dates, party size from messages
3. **Context Awareness**: Uses booking context and conversation history
4. **Personalized Recommendations**: 
   - Activity cards with filtering (budget, accessibility, interests)
   - Restaurant recommendations (dietary restrictions, cuisine)
   - Day-by-day itineraries (morning/afternoon/evening)
   - Packing checklists (weather-aware)
5. **Web Search Integration**: Uses Tavily API for real-time local information
6. **Follow-up Question Handling**: Maintains conversation context

**Integration Flow**:
```
Traveller Frontend (AIAgentPanel.jsx)
    ↓ POST /api/ai-agent/chat
AI Agent (main_sqlite.py)
    ↓ GET /api/bookings/internal/traveler/:id/upcoming
Traveller Backend (bookings.js)
    ↓ Query MySQL
MySQL Database (airbnb_core)
    ↑ Returns booking data
AI Agent processes with OpenAI + Tavily
    ↑ Returns AI response
Traveller Frontend displays response
```

---

## 🗄️ Database Architecture

### **MySQL Database (`airbnb_core`)**

**Shared Tables** (used by both host and traveler backends):
- `properties` - Property listings
  - Columns: id, owner_id, name, description, location, address, city, state, country, price_per_night, bedrooms, bathrooms, max_guests, amenities, property_type, main_photo
- `bookings` - Booking requests
  - Columns: id, property_id, traveler_id, owner_id, start_date, end_date, guests, total_price, status (PENDING/ACCEPTED/CANCELLED), special_requests
- `sessions` - Express session storage

**Host-Specific Tables**:
- `owners` - Host accounts
  - Columns: id, email, name, phone, location, bio, avatar_url, password_hash

**Traveler-Specific Tables**:
- `users` - Traveler accounts
  - Columns: id, email, name, phone, password_hash
- `traveler_profiles` - Extended traveler info
  - Columns: traveler_id, about_me, city, state, country, languages, gender, profile_picture
- `favorites` - Saved properties
  - Columns: id, traveler_id, property_id

**Schema Unification**: The `unify_schemas.sql` file ensures compatibility between host and traveler systems by:
- Standardizing ID types to BIGINT
- Adding missing columns (total_price, special_requests)
- Creating indexes for performance

### **SQLite Database (`agent_airbnb.db`)**

Used by AI agent for local data storage:
- `users` - User management
- `bookings` - Booking information
- `user_preferences` - Travel preferences
- `activities` - Local activities
- `restaurants` - Restaurant recommendations
- `local_events` - Events and happenings
- `weather_data` - Weather information
- `itineraries` - Generated travel plans
- `packing_checklists` - Packing recommendations
- `agent_conversations` - Conversation history

**Note**: The AI agent primarily uses the traveler backend's MySQL database for real booking data, and SQLite for local caching/sample data.

---

## 🔐 Authentication & Authorization

### **Host Backend**
- **Method**: Express sessions with HTTP-only cookies
- **Cookie Name**: `airbnb_host.sid`
- **Middleware**: `ensureAuth` in `src/middleware/auth.js`
- **OAuth**: Google OAuth 2.0 support (via Passport.js)
- **Firebase**: Optional Firebase Admin SDK integration

### **Traveler Backend**
- **Method**: Express sessions with HTTP-only cookies
- **Cookie Name**: `airbnb_traveller.sid`
- **Middleware**: `ensureAuth` in `src/middleware/auth.js`
- **Session Store**: MySQL (sessions table)

### **AI Agent**
- **No authentication** (internal service, called by frontend)
- Uses `traveler_id` from frontend to fetch bookings

---

## 🔄 Data Flow Examples

### **1. Property Booking Flow**

```
1. Traveler searches properties
   Frontend → GET /api/properties/search → Traveller Backend → MySQL

2. Traveler views property details
   Frontend → GET /api/properties/:id → Traveller Backend → MySQL

3. Traveler creates booking
   Frontend → POST /api/bookings → Traveller Backend → MySQL
   (Status: PENDING)

4. Host views booking requests
   Frontend → GET /bookings/incoming → Host Backend → MySQL

5. Host accepts booking
   Frontend → POST /bookings/:id/accept → Host Backend → MySQL
   (Status: ACCEPTED)

6. Traveler sees confirmed booking
   Frontend → GET /api/bookings → Traveller Backend → MySQL
```

### **2. AI Agent Chat Flow**

```
1. Traveler opens AI chat panel
   Frontend (AIAgentPanel.jsx) → User clicks chat button

2. Traveler sends message
   Frontend → POST /api/ai-agent/chat (with traveler_id)
   Body: { message, traveler_id, conversation_history }

3. AI Agent fetches bookings
   AI Agent → GET /api/bookings/internal/traveler/:id/upcoming
   → Traveller Backend → MySQL

4. AI Agent processes request
   - Detects intent (greeting, day_plan, restaurants, etc.)
   - Extracts travel details from message
   - Uses OpenAI (GPT-3.5-turbo) for natural language processing
   - Uses Tavily for web search (activities, restaurants, weather)
   - Generates personalized recommendations

5. AI Agent returns response
   Response: {
     response: "AI text response",
     day_by_day_plan: [...],
     activity_cards: [...],
     restaurant_recommendations: [...],
     packing_checklist: [...],
     extracted_context: {...}
   }

6. Frontend displays response
   AIAgentPanel.jsx renders markdown, activity cards, etc.
```

---

## 🛠️ Technology Stack Summary

### **Frontend**
- React 18
- Vite (build tool)
- React Router (routing)
- Bootstrap (UI framework)
- React Markdown (for AI responses)
- Axios/Fetch (API calls)

### **Backend (Host & Traveler)**
- Node.js
- Express.js
- MySQL2 (database driver)
- Express-Session (session management)
- Express-MySQL-Session (session store)
- Passport.js (OAuth)
- Firebase Admin SDK (optional)
- Multer (file uploads)
- Swagger/OpenAPI (API documentation)
- Joi (request validation)

### **AI Agent**
- FastAPI (Python web framework)
- LangChain (AI framework)
- OpenAI (GPT-3.5-turbo)
- Tavily (web search API)
- SQLAlchemy (ORM)
- Pydantic (data validation)
- SQLite (local database)
- httpx (HTTP client for backend calls)

### **Database**
- MySQL 8.0+ (primary database)
- SQLite (AI agent local data)

---

## 📦 Key Dependencies

### **Host Backend** (`backend/host/package.json`)
- express, express-session, express-mysql-session
- mysql2, cors, morgan
- passport, passport-google-oauth20
- firebase-admin, multer
- swagger-ui-express, swagger-jsdoc
- joi (validation)

### **Traveler Backend** (`backend/traveller/package.json`)
- Similar to host backend
- Additional: dotenv

### **AI Agent** (`agent/requirements.txt`)
- fastapi, uvicorn
- langchain, langchain-openai
- sqlalchemy, pydantic
- tavily-python
- httpx, python-dateutil

### **Frontend** (`frontend/*/package.json`)
- react, react-dom, react-router-dom
- vite, @vitejs/plugin-react
- bootstrap, react-markdown
- axios (or fetch API)

---

## 🔌 Environment Variables

### **Host Backend** (`backend/host/.env`)
```
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

### **Traveler Backend** (`backend/traveller/.env`)
```
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

### **Host Frontend** (`frontend/host/.env`)
```
VITE_HOST_API=http://localhost:4000
VITE_AGENT_API=http://localhost:8000
```

### **Traveler Frontend** (`frontend/traveller/.env`)
```
VITE_API_URL=http://localhost:5001
VITE_AGENT_API_URL=http://localhost:8000
```

### **AI Agent** (`agent/.env`)
```
OPENAI_API_KEY=sk-your-openai-api-key
TAVILY_API_KEY=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
HOST=0.0.0.0
PORT=8000
```

---

## 🚀 Startup Sequence

1. **Start MySQL** (if not running)
   ```bash
   brew services start mysql  # macOS
   # or
   sudo systemctl start mysql  # Linux
   ```

2. **Setup Database** (first time only)
   ```bash
   mysql -u root -p airbnb_core < backend/host/sql/unify_schemas.sql
   ```

3. **Start Host Backend** (Terminal 1)
   ```bash
   cd backend/host
   npm run dev
   # Runs on http://localhost:4000
   ```

4. **Start Traveler Backend** (Terminal 2)
   ```bash
   cd backend/traveller
   npm run dev
   # Runs on http://localhost:5001
   ```

5. **Start Host Frontend** (Terminal 3)
   ```bash
   cd frontend/host
   npm run dev
   # Runs on http://localhost:5174
   ```

6. **Start Traveler Frontend** (Terminal 4)
   ```bash
   cd frontend/traveller
   npm run dev
   # Runs on http://localhost:5173
   ```

7. **Start AI Agent** (Terminal 5)
   ```bash
   cd agent
   python3 run_server_sqlite.py
   # Runs on http://localhost:8000
   ```

---

## 🧪 Testing the System

### **Basic Flow**
1. Create host account → http://localhost:5174
2. Create property listing
3. Create traveler account → http://localhost:5173
4. Search and book property
5. Host approves booking
6. Traveler uses AI agent to plan trip

### **AI Agent Testing**
1. Open traveler frontend
2. Click AI chat button (bottom-right)
3. Send messages like:
   - "Plan a 3-day trip to Paris"
   - "What restaurants do you recommend?"
   - "What should I pack?"
   - "Show me activities for families"

---

## 📝 Key Features Implemented

✅ **Host Platform**
- Property listing management
- Multi-step onboarding flow
- Booking request approval/rejection
- Profile management
- Photo uploads
- OAuth (Google) integration
- Phone authentication (Firebase)

✅ **Traveler Platform**
- Property search with filters
- Booking management
- Favorites system
- Profile management
- Booking history
- **AI-powered travel concierge**

✅ **AI Agent**
- Natural language understanding
- Intent detection (greeting, planning, restaurants, activities, packing)
- Personalized recommendations
- Day-by-day itinerary planning
- Weather-aware packing lists
- Real-time web search (Tavily)
- Conversation context management
- Automatic booking context fetching

---

## 🔍 Important Code Locations

### **AI Agent Integration**
- Frontend: `frontend/traveller/src/components/AIAgentPanel.jsx`
- Backend Endpoint: `agent/app/main_sqlite.py` → `/api/ai-agent/chat`
- AI Logic: `agent/app/services/simple_ai_agent.py`
- Booking Fetch: `backend/traveller/src/routes/bookings.js` → `/api/bookings/internal/traveler/:id/upcoming`

### **Authentication**
- Host Auth: `backend/host/src/routes/auth.js`
- Traveler Auth: `backend/traveller/src/routes/auth.js`
- Middleware: `backend/*/src/middleware/auth.js`

### **Database Schema**
- Unified Schema: `backend/host/sql/unify_schemas.sql`
- Base Schema: `backend/host/sql/schema.sql`
- Traveler Tables: `backend/host/sql/add_traveler_tables.sql`

### **API Documentation**
- Host API: http://localhost:4000/api-docs
- Traveler API: http://localhost:5001/api-docs
- AI Agent: http://localhost:8000/docs

---

## 🎯 Extension Points for Lab 2

Based on the codebase structure, here are potential extension points:

1. **Microservices Architecture**
   - Split host and traveler backends into separate services
   - Add API gateway
   - Implement service discovery

2. **Message Queue Integration**
   - Add RabbitMQ/Kafka for async processing
   - Booking confirmation emails
   - Notification system

3. **Caching Layer**
   - Redis for session storage
   - Property search caching
   - AI agent response caching

4. **Load Balancing**
   - Multiple instances of backends
   - Health checks
   - Request distribution

5. **Distributed Tracing**
   - OpenTelemetry integration
   - Request tracking across services
   - Performance monitoring

6. **Event-Driven Architecture**
   - Event sourcing for bookings
   - Event bus for cross-service communication
   - CQRS pattern

7. **Containerization**
   - Docker containers for each service
   - Docker Compose for local development
   - Kubernetes for production

8. **Service Mesh**
   - Istio/Linkerd integration
   - Service-to-service communication
   - Circuit breakers

---

## 📚 Additional Resources

- **Main README**: `README.md` - Setup instructions
- **API Documentation**: `API_DOCUMENTATION_GUIDE.md` - API reference
- **Agent README**: `agent/README.md` - AI agent details
- **Database Schema**: `backend/host/sql/unify_schemas.sql` - Complete schema

---

**Last Updated**: Based on current codebase structure
**Status**: Production-ready for Lab 1, ready for Lab 2 extensions

