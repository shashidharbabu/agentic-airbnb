# Agent Airbnb - AI Travel Concierge

An intelligent AI-powered travel concierge service for Airbnb guests that provides personalized travel recommendations, day-by-day itineraries, and comprehensive travel planning assistance.

## 🚀 Features

### Core AI Capabilities
- **Natural Language Understanding**: Process free-text travel requests
- **Personalized Recommendations**: Activity cards, restaurant suggestions, and local events
- **Day-by-Day Planning**: Morning/afternoon/evening itinerary blocks
- **Smart Filtering**: Dietary restrictions, mobility needs, accessibility requirements
- **Weather-Aware Packing**: Intelligent packing checklists based on weather and activities

### Technical Features
- **FastAPI Backend**: High-performance REST API
- **LangChain Integration**: Advanced AI agent with tool usage
- **Tavily Web Search**: Real-time local context and information
- **SQLite Database**: Comprehensive data storage and management
- **Comprehensive Testing**: Full API test suite with sample data

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   FastAPI API   │    │   SQLite DB     │
│   (Future)      │◄──►│   + LangChain   │◄──►│   + Sample      │
│                 │    │   + Tavily      │    │     Data       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Requirements

- Python 3.8+
- OpenAI API Key
- Tavily API Key (provided)

## 🛠️ Installation & Setup

### Step 1: Navigate to Project Directory
```bash
cd /Users/shashidharbabu/Documents/07.\ Projects/agent
```

### Step 2: Activate Virtual Environment
```bash
source venv/bin/activate
```

### Step 3: Verify Dependencies
```bash
python -c "import fastapi, langchain, tavily; print('✅ All dependencies working!')"
```

### Step 4: Set Up Database (if needed)
```bash
python setup_sqlite.py
```

### Step 5: Start the Server
```bash
python run_server_sqlite.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 🧪 Testing

### Quick Health Check
```bash
curl http://localhost:8000/health
```

### Test Main API Endpoint
```bash
curl -X POST "http://localhost:8000/api/concierge" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_context": {
      "check_in_date": "2024-01-15",
      "check_out_date": "2024-01-18",
      "location": "Paris, France",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "party_type": "couple",
      "party_size": 2
    },
    "preferences": {
      "budget_tier": "mid-range",
      "interests": ["culture", "food", "art"],
      "mobility_needs": ["wheelchair_accessible"],
      "dietary_restrictions": ["vegetarian"],
      "special_requirements": "First time visiting Paris"
    },
    "user_message": "We are visiting Paris for the first time, love art and vegetarian food"
  }'
```

### Run Full Test Suite
```bash
python test_api.py
```

## 📚 API Endpoints

### Main Concierge Endpoint
```http
POST /api/concierge
Content-Type: application/json

{
  "booking_context": {
    "check_in_date": "2024-01-15",
    "check_out_date": "2024-01-18",
    "location": "Paris, France",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "party_type": "couple",
    "party_size": 2
  },
  "preferences": {
    "budget_tier": "mid-range",
    "interests": ["culture", "food", "art"],
    "mobility_needs": ["wheelchair_accessible"],
    "dietary_restrictions": ["vegetarian"],
    "special_requirements": "First time visiting Paris"
  },
  "user_message": "We're visiting Paris for the first time, love art and vegetarian food"
}
```

### Natural Language Query
```http
POST /api/concierge/query
Content-Type: application/json

{
  "booking_id": 1,
  "user_message": "We're vegan, no long hikes, two kids"
}
```

### Search Endpoints
- `GET /api/search/activities?location=Paris&interests=culture,art`
- `GET /api/search/restaurants?location=Paris&dietary=vegetarian`
- `GET /api/search/events?location=Paris`
- `GET /api/search/weather?location=Paris`

### Management Endpoints
- `POST /api/users` - Create user
- `GET /api/users/{user_id}` - Get user
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{booking_id}` - Get booking
- `POST /api/preferences` - Create preferences
- `GET /api/preferences/{booking_id}` - Get preferences

## 🎯 Key Features Explained

### 1. AI Agent with LangChain
- **Simplified Agent**: Uses direct LLM calls for reliability
- **Natural Language**: Process free-text requests like "vegan, no long hikes, two kids"
- **Context Awareness**: Considers booking details and user preferences

### 2. Recommendation Engine
- **Activity Filtering**: Budget, accessibility, interests, child-friendliness
- **Restaurant Matching**: Dietary restrictions, cuisine preferences, ratings
- **Event Integration**: Local events and seasonal activities
- **Scoring System**: Intelligent ranking based on user preferences

### 3. Itinerary Planning
- **Day-by-Day Structure**: Morning/afternoon/evening blocks
- **Time Block Optimization**: Appropriate activities for each time period
- **Restaurant Integration**: Meal planning with dietary considerations
- **Event Scheduling**: Local events and special happenings

### 4. Packing Intelligence
- **Weather Awareness**: Temperature, precipitation, conditions
- **Activity-Based**: Hiking gear for outdoor activities, formal wear for fine dining
- **Location-Specific**: Beach essentials for coastal destinations
- **Essential Items**: Documents, electronics, basic necessities

## 🔧 Configuration

### Environment Variables
The system uses a `.env` file with the following configuration:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=agent_airbnb.db
DB_USER=
DB_PASSWORD=

# API Keys
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=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
WEATHER_API_KEY=your_weather_api_key

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

## 📊 Database Schema

The system uses SQLite with the following key tables:
- **Users**: User management and authentication
- **Bookings**: Travel booking information
- **UserPreferences**: Travel preferences and requirements
- **Activities**: Local activities and attractions
- **Restaurants**: Dining recommendations
- **LocalEvents**: Events and happenings
- **WeatherData**: Weather information
- **Itineraries**: Generated travel plans
- **PackingChecklists**: Packing recommendations
- **AgentConversations**: NLU conversation history

## 📁 Project Structure

```
agent/
├── app/                          # FastAPI application
│   ├── __init__.py
│   ├── config_sqlite.py         # SQLite configuration
│   ├── database_sqlite.py       # Database connection
│   ├── models.py                # SQLAlchemy models
│   ├── schemas.py               # Pydantic schemas
│   ├── main_sqlite.py           # Main API endpoints
│   └── services/                # AI services
│       ├── __init__.py
│       ├── simple_ai_agent.py   # Simplified AI agent
│       ├── tavily_service.py    # Web search integration
│       ├── recommendation_engine.py  # Smart recommendations
│       └── itinerary_planner.py # Day-by-day planning
├── venv/                        # Virtual environment
├── agent_airbnb.db             # SQLite database
├── requirements.txt            # Dependencies
├── run_server_sqlite.py        # Server startup
├── setup_sqlite.py            # Database setup
├── sample_data.py             # Test data creation
├── test_api.py                # API tests
├── fix_dependencies.py        # Dependency resolver
└── README.md                  # This file
```

## 🚀 Quick Start Guide

### 1. Start the Server
```bash
cd /Users/shashidharbabu/Documents/07.\ Projects/agent
source venv/bin/activate
python run_server_sqlite.py
```

### 2. Test the API
Open your browser and visit:
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **Root Endpoint**: http://localhost:8000/

### 3. Make a Test Request
Use the API documentation at `/docs` to test the `/api/concierge` endpoint with sample data.

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   pkill -f "python run_server_sqlite.py"
   ```

2. **Dependencies Not Found**
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Database Issues**
   ```bash
   rm agent_airbnb.db
   python setup_sqlite.py
   ```

4. **Import Errors**
   ```bash
   python -c "import fastapi, langchain, tavily"
   ```

### Logs and Debugging
- Server logs are displayed in the terminal
- Database queries are logged with SQLAlchemy
- API requests are logged with status codes

## 🚀 Future Enhancements

### Frontend Integration
- React/Vue.js dashboard with bottom-right chatbot button
- Real-time chat interface
- Interactive itinerary visualization
- Mobile-responsive design

### Advanced Features
- Real-time weather integration
- Social media integration for local insights
- Machine learning for preference learning
- Multi-language support
- Voice interface integration

### Deployment
- Docker containerization
- Cloud deployment (AWS/GCP/Azure)
- CI/CD pipeline
- Monitoring and logging
- Load balancing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the test suite in `test_api.py`
- Examine sample data in `sample_data.py`
- Check server logs for error details

## 📞 Contact

For technical support or questions about this AI Travel Concierge system, please refer to the project documentation and test files.

---

**Built with ❤️ using FastAPI, LangChain, and Tavily**

*Agent Airbnb - Your Intelligent Travel Companion*