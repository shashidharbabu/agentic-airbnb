# AI Travel Agent Backend

This is the Python FastAPI backend for the AI Travel Agent service that provides intelligent travel planning recommendations for Airbnb travelers.

## Features

- **Day-by-day Planning**: Generate detailed itineraries with morning, afternoon, and evening blocks
- **Activity Recommendations**: Curated activity cards with pricing, duration, and accessibility info
- **Restaurant Suggestions**: Filtered by dietary restrictions and preferences
- **Packing Checklists**: Weather-aware packing recommendations
- **Natural Language Processing**: Support for free-text queries and conversation history
- **Web Search Integration**: Real-time data from Tavily for weather, events, and local information

## Tech Stack

- **FastAPI**: Modern Python web framework
- **LangChain**: AI/LLM integration framework
- **OpenAI GPT-4**: Language model for intelligent responses
- **Tavily**: Web search API for real-time data
- **MySQL**: Database for storing conversation history and user data
- **Pydantic**: Data validation and serialization

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend/ai-agent
pip install -r requirements.txt
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Tavily API Key (required)
TAVILY_API_KEY=your_tavily_api_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=airbnb_core

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### 3. Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

#### Tavily API Key
1. Go to [Tavily](https://tavily.com/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy the key to your `.env` file

### 4. Database Setup

Ensure your MySQL database is running and the `airbnb_core` database exists with the required tables:
- `users`
- `traveler_profiles`
- `bookings`
- `properties`
- `conversation_history` (will be created automatically)

### 5. Run the Server

```bash
python main.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### AI Agent
- `POST /api/ai-agent/generate-plan` - Generate comprehensive travel plan
- `POST /api/ai-agent/chat` - Chat with AI agent
- `GET /api/ai-agent/booking/{booking_id}/context` - Get booking context
- `GET /api/ai-agent/traveler/{traveler_id}/preferences` - Get traveler preferences
- `GET /api/ai-agent/traveler/{traveler_id}/conversation-history` - Get chat history

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Usage Example

### Generate Travel Plan

```bash
curl -X POST "http://localhost:8000/api/ai-agent/generate-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_context": {
      "check_in": "2024-11-01",
      "check_out": "2024-11-05",
      "location": "San Francisco, CA, USA",
      "party_type": "couple",
      "guest_count": 2
    },
    "preferences": {
      "interests": ["culture", "food", "outdoor"],
      "mobility_needs": "full_mobility",
      "dietary_restrictions": ["vegetarian"],
      "children_count": 0
    },
    "user_query": "Create a detailed travel plan for my trip"
  }'
```

### Chat with Agent

```bash
curl -X POST "http://localhost:8000/api/ai-agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best restaurants for vegetarians?",
    "booking_id": 1,
    "traveler_id": 10
  }'
```

## Response Format

The AI agent returns structured JSON responses with:

- **Day Plans**: Detailed itineraries with time blocks and activities
- **Restaurant Recommendations**: Filtered by dietary needs and preferences
- **Packing Checklist**: Weather-aware items with essential flags
- **Conversation History**: Maintained chat context
- **Additional Tips**: Personalized recommendations

## Error Handling

The API includes comprehensive error handling:
- Input validation using Pydantic models
- Graceful fallbacks for external API failures
- Detailed error messages for debugging
- HTTP status codes following REST conventions

## Development

### Project Structure

```
backend/ai-agent/
├── main.py              # FastAPI application entry point
├── models.py            # Pydantic data models
├── ai_agent.py          # Core AI agent logic
├── tavily_service.py    # Web search integration
├── database.py          # Database operations
├── requirements.txt     # Python dependencies
├── env.example         # Environment variables template
└── README.md           # This file
```

### Adding New Features

1. **New Data Models**: Add to `models.py`
2. **API Endpoints**: Add to `main.py`
3. **AI Logic**: Extend `ai_agent.py`
4. **External Services**: Add to `tavily_service.py`
5. **Database Operations**: Extend `database.py`

## Troubleshooting

### Common Issues

1. **API Key Errors**: Verify your OpenAI and Tavily API keys are correct
2. **Database Connection**: Ensure MySQL is running and credentials are correct
3. **Import Errors**: Make sure all dependencies are installed
4. **CORS Issues**: Check that frontend URLs are in the CORS allowlist

### Logs

The server provides detailed logging for debugging:
- API request/response logs
- Database operation logs
- External API call logs
- Error stack traces

## Production Deployment

For production deployment:

1. Set `HOST=0.0.0.0` and appropriate `PORT`
2. Use a production WSGI server like Gunicorn
3. Set up proper environment variable management
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging
6. Use production database with proper security

## License

This project is part of the Airbnb Traveler Application.
