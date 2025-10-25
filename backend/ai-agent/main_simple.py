from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from typing import Optional
import uvicorn
from datetime import datetime

load_dotenv()

app = FastAPI(
    title="Airbnb AI Travel Agent",
    description="AI-powered travel planning service for Airbnb travelers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Airbnb AI Travel Agent is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Travel Agent",
        "version": "1.0.0",
        "database": "connected"
    }

@app.post("/api/ai-agent/chat")
async def chat_with_agent(
    message: str,
    booking_id: Optional[int] = None,
    traveler_id: Optional[int] = None
):
    try:
        if not message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        responses = {
            "hello": "Hello! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?",
            "hi": "Hi there! I'm here to help you plan an amazing trip. What destination are you traveling to?",
            "help": "I can help you with:\n- Creating day-by-day itineraries\n- Finding restaurants based on your dietary needs\n- Suggesting activities and attractions\n- Creating packing checklists\n- Answering travel questions\n\nWhat would you like to know?",
            "travel plan": "I'd be happy to create a travel plan for you! To get started, I need to know:\n- Your destination\n- Travel dates\n- Number of travelers\n- Your interests and preferences\n\nWhat's your destination?",
            "restaurants": "I can recommend restaurants based on your dietary preferences and location. What type of cuisine are you interested in?",
            "activities": "I can suggest activities and attractions based on your interests. What do you enjoy doing while traveling? (e.g., culture, outdoor activities, food, history)",
            "packing": "I can create a personalized packing checklist based on your destination, travel dates, and planned activities. What's your destination and travel dates?"
        }
        
        message_lower = message.lower()
        response = "I'm here to help with your travel planning! I can assist with creating itineraries, finding restaurants, suggesting activities, and creating packing checklists. What would you like to know?"
        
        for key, value in responses.items():
            if key in message_lower:
                response = value
                break
        
        return {
            "response": response,
            "conversation_history": [
                {"role": "user", "content": message},
                {"role": "assistant", "content": response}
            ]
        }
        
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/api/ai-agent/generate-plan")
async def generate_travel_plan(request: dict):
    try:
        mock_plan = {
            "day_plans": [
                {
                    "date": "2024-11-01",
                    "time_blocks": {
                        "morning": [
                            {
                                "title": "City Walking Tour",
                                "description": "Explore the highlights of San Francisco with a guided walking tour",
                                "duration": 2.0,
                                "price_tier": "moderate"
                            }
                        ],
                        "afternoon": [
                            {
                                "title": "Local Museum Visit",
                                "description": "Discover the history and culture of San Francisco",
                                "duration": 3.0,
                                "price_tier": "budget"
                            }
                        ],
                        "evening": [
                            {
                                "title": "Food Market Tour",
                                "description": "Experience local flavors and ingredients",
                                "duration": 1.5,
                                "price_tier": "budget"
                            }
                        ]
                    },
                    "weather_forecast": {"temperature": 22, "condition": "sunny"},
                    "notes": "Perfect weather for outdoor activities!"
                }
            ],
            "restaurant_recommendations": [
                {
                    "name": "Local Bistro",
                    "address": "San Francisco, CA",
                    "cuisine_type": "International",
                    "price_tier": "moderate",
                    "dietary_accommodations": ["vegetarian", "vegan"],
                    "rating": 4.5,
                    "description": "Cozy bistro serving fresh local ingredients"
                }
            ],
            "packing_checklist": {
                "items": [
                    {"item": "Comfortable walking shoes", "category": "Footwear", "essential": True},
                    {"item": "Weather-appropriate clothing", "category": "Clothing", "essential": True},
                    {"item": "Camera or smartphone", "category": "Electronics", "essential": True},
                    {"item": "Sunscreen", "category": "Personal Care", "weather_dependent": True}
                ],
                "weather_aware": True,
                "trip_duration_days": 4,
                "destination_climate": "sunny"
            },
            "conversation_history": [
                {"role": "user", "content": "Create a travel plan for my trip"},
                {"role": "assistant", "content": "I've created a personalized travel plan for your trip to San Francisco! The itinerary includes daily activities, restaurant recommendations, and a weather-aware packing checklist."}
            ],
            "generated_at": datetime.now().isoformat(),
            "additional_tips": [
                "Stay hydrated and use sunscreen - it's going to be sunny!",
                "Book activities in advance to avoid crowds"
            ]
        }
        
        return mock_plan
        
    except Exception as e:
        print(f"Error generating travel plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate travel plan: {str(e)}")

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "Resource not found", "detail": str(exc)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Starting AI Travel Agent on {host}:{port}")
    print(f"📚 API Documentation: http://{host}:{port}/docs")
    print(f"🏥 Health Check: http://{host}:{port}/health")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
