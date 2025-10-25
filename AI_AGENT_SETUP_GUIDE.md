# AI Travel Agent Setup Guide

This guide will help you set up the complete AI Travel Agent system for the Airbnb Traveler application.

## Overview

The AI Travel Agent provides intelligent travel planning with:
- **Day-by-day itineraries** with morning/afternoon/evening blocks
- **Activity recommendations** with pricing, duration, and accessibility info
- **Restaurant suggestions** filtered by dietary restrictions
- **Weather-aware packing checklists**
- **Natural language chat** with conversation history
- **Real-time data** from web searches (weather, events, POIs)

## Architecture

```
Frontend (React) ←→ Backend (Node.js) ←→ AI Agent (Python FastAPI)
                                    ↓
                              MySQL Database
                                    ↓
                              Tavily API (Web Search)
                                    ↓
                              OpenAI GPT-4
```

## Prerequisites

1. **Python 3.8+** installed
2. **Node.js 16+** installed
3. **MySQL** database running
4. **OpenAI API Key** (for GPT-4)
5. **Tavily API Key** (for web searches)

## Setup Instructions

### Step 1: Get API Keys

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

#### Tavily API Key
1. Go to [Tavily](https://tavily.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the key

### Step 2: Setup AI Agent Backend

```bash
# Navigate to AI agent directory
cd backend/ai-agent

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp env.example .env
```

Edit `.env` file:
```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-your-openai-key-here

# Tavily API Key (required)
TAVILY_API_KEY=tvly-your-tavily-key-here

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=airbnb_core

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

### Step 3: Test AI Agent Backend

```bash
# Run the startup script
python start_ai_agent.py
```

Expected output:
```
AI Travel Agent Backend Startup
========================================
Python version: 3.8.x
Environment variables configured
All required packages are installed
Database connection successful

Starting AI Travel Agent Backend...
==================================================
Server starting on http://0.0.0.0:8000
API Documentation: http://0.0.0.0:8000/docs
Health Check: http://0.0.0.0:8000/health
```

### Step 4: Verify AI Agent is Working

Open your browser and visit:
- **Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs

### Step 5: Test with Frontend

1. **Start the Node.js backend** (if not already running):
   ```bash
   cd backend/traveller
   npm start
   ```

2. **Start the React frontend**:
   ```bash
   cd frontend/traveller
   npm run dev
   ```

3. **Test the AI Agent**:
   - Go to http://localhost:5173/dashboard
   - Look for the floating AI agent button (🤖) in the bottom-right corner
   - Click the button to open the AI agent panel
   - Try asking: "Create a travel plan for my trip"

## Features Testing

### 1. Basic Chat
- Click the AI agent button
- Type: "Hello, can you help me plan my trip?"
- Verify you get a response

### 2. Travel Plan Generation
- Ask: "Create a detailed travel plan for San Francisco"
- Check the "Travel Plan" tab for:
  - Day-by-day itineraries
  - Activity recommendations
  - Restaurant suggestions
  - Packing checklist

### 3. Conversation History
- Ask multiple questions
- Verify conversation is maintained
- Check that context is preserved

### 4. Real-time Data
- Ask about weather: "What's the weather like?"
- Ask about events: "Any local events happening?"
- Verify responses include current information

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

#### 2. "API key not found" errors
- Check your `.env` file has the correct API keys
- Ensure no extra spaces or quotes around the keys
- Restart the server after changing `.env`

#### 3. "Database connection failed"
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify `airbnb_core` database exists

#### 4. "CORS error" in browser
- Check that frontend URL is in CORS allowlist in `main.py`
- Ensure both servers are running on correct ports

#### 5. AI responses are generic
- Check OpenAI API key is valid and has credits
- Verify Tavily API key is working
- Check server logs for errors

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export LOG_LEVEL=debug
python start_ai_agent.py
```

### Check Logs

Monitor server logs for:
- API request/response details
- Database operation logs
- External API call logs
- Error messages

## API Endpoints Reference

### Health & Status
- `GET /` - Basic health check
- `GET /health` - Detailed health status

### AI Agent
- `POST /api/ai-agent/generate-plan` - Generate travel plan
- `POST /api/ai-agent/chat` - Chat with agent
- `GET /api/ai-agent/booking/{id}/context` - Get booking context
- `GET /api/ai-agent/traveler/{id}/preferences` - Get traveler preferences

### Example API Call

```bash
curl -X POST "http://localhost:8000/api/ai-agent/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the best restaurants in San Francisco?",
    "booking_id": 1,
    "traveler_id": 10
  }'
```

## Production Deployment

For production deployment:

1. **Environment Variables**:
   - Use proper secret management
   - Set production database credentials
   - Configure production API keys

2. **Server Configuration**:
   - Use production WSGI server (Gunicorn)
   - Configure reverse proxy (nginx)
   - Set up SSL certificates

3. **Monitoring**:
   - Set up logging and monitoring
   - Configure error tracking
   - Monitor API usage and costs

4. **Security**:
   - Validate all inputs
   - Rate limit API calls
   - Secure database connections

## Cost Considerations

### OpenAI API Costs
- GPT-4 is more expensive than GPT-3.5
- Consider using GPT-3.5 for simple queries
- Monitor usage in OpenAI dashboard

### Tavily API Costs
- Free tier available
- Monitor usage in Tavily dashboard
- Consider caching for repeated queries

## Next Steps

1. **Customize AI Responses**: Modify prompts in `ai_agent.py`
2. **Add More Data Sources**: Extend `tavily_service.py`
3. **Improve UI**: Enhance `AIAgentPanel.jsx`
4. **Add Analytics**: Track usage and performance
5. **Scale Up**: Consider microservices architecture

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify all API keys are correct
3. Ensure all services are running
4. Test individual components separately
5. Check the API documentation at `/docs`

## Success Criteria

AI agent button appears on dashboard
Clicking button opens AI panel
Chat functionality works
Travel plan generation works
Conversation history is maintained
Real-time data is fetched
UI is responsive and user-friendly

AI Travel Agent is ready for use! 
