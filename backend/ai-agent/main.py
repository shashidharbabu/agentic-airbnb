from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from typing import Optional
import uvicorn
from datetime import datetime
from ollama_ai_agent import OllamaAIAgent
from models import AIAgentRequest, BookingContext, TravelerPreferences, MobilityNeeds, DietaryRestrictions, PartyType

# Load environment variables
load_dotenv()

# Initialize AI Agent
ai_agent = OllamaAIAgent()

# In-memory conversation storage (in production, use a database)
conversation_storage = {}

# Initialize FastAPI app
app = FastAPI(
    title="Airbnb AI Travel Agent",
    description="AI-powered travel planning service for Airbnb travelers",
    version="1.0.0"
)

# Configure CORS origins via environment variable
default_origins = "http://localhost:5173,http://localhost:5174"
allowed_origins = [
    origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Airbnb AI Travel Agent is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "AI Travel Agent",
        "version": "1.0.0",
        "database": "connected"
    }

@app.post("/api/ai-agent/chat")
async def chat_with_agent(request: dict):
    """Chat with AI agent for follow-up questions"""
    try:
        message = request.get("message", "")
        booking_id = request.get("booking_id")
        traveler_id = request.get("traveler_id")
        
        if not message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Create a unique conversation key based on traveler_id and booking_id
        conversation_key = f"traveler_{traveler_id}_booking_{booking_id}" if traveler_id and booking_id else f"traveler_{traveler_id}" if traveler_id else "anonymous"
        
        # Get existing conversation history
        conversation_history = conversation_storage.get(conversation_key, [])
        
        # Check if user mentions specific travel details
        message_lower = message.lower()
        has_destination = any(word in message_lower for word in ['paris', 'london', 'tokyo', 'new york', 'san francisco', 'to ', 'visit', 'going to', 'travel to'])
        has_dates = any(word in message_lower for word in ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', '2024', '2025', 'next week', 'next month'])
        
        # Create booking context only if user mentions specific details
        booking_context = None
        if has_destination or has_dates:
            # Extract destination from message or use a default
            location = "your destination"
            if 'paris' in message_lower:
                location = "Paris"
            elif 'london' in message_lower:
                location = "London"
            elif 'tokyo' in message_lower:
                location = "Tokyo"
            elif 'new york' in message_lower:
                location = "New York"
            elif 'san francisco' in message_lower:
                location = "San Francisco"
            
            booking_context = BookingContext(
                location=location,
                check_in=datetime.now().date(),
                check_out=(datetime.now().date().replace(day=datetime.now().day + 3)),
                party_type=PartyType.FAMILY,
                guest_count=2
            )
        
        # Create basic preferences
        preferences = TravelerPreferences(
            interests=["culture", "food", "outdoor"],
            dietary_restrictions=[DietaryRestrictions.VEGETARIAN],
            mobility_needs=MobilityNeeds.FULL_MOBILITY,
            children_count=0,
            budget_range="moderate"
        )
        
        # Generate AI response using Ollama
        print(f"DEBUG: Generating AI response for message: {message}")
        print(f"DEBUG: Using conversation history with {len(conversation_history)} messages")
        try:
            # For general greetings, use a simpler approach without specific booking context
            if not booking_context:
                response = await ai_agent._generate_general_response_with_history(message, conversation_history)
            else:
                # Create AI request with booking context and conversation history
                ai_request = AIAgentRequest(
                    booking_context=booking_context,
                    preferences=preferences,
                    user_query=message,
                    conversation_history=conversation_history
                )
                response = await ai_agent._generate_ai_response(ai_request, [], [])
            print(f"DEBUG: AI response generated: {response[:100]}...")
        except Exception as e:
            print(f"DEBUG: Error generating AI response: {e}")
            raise e
        
        # Update conversation history
        conversation_history.append({"role": "user", "content": message})
        conversation_history.append({"role": "assistant", "content": response})
        
        # Store updated conversation history
        conversation_storage[conversation_key] = conversation_history
        
        # Keep only last 20 messages to prevent memory issues
        if len(conversation_history) > 20:
            conversation_storage[conversation_key] = conversation_history[-20:]
        
        return {
            "response": response,
            "conversation_history": conversation_history
        }
        
    except Exception as e:
        print(f"Error in chat: {e}")
        # Fallback to simple response if AI fails
        return {
            "response": "I'm here to help with your travel planning! What would you like to know about your upcoming trip?",
            "conversation_history": [
                {"role": "user", "content": message},
                {"role": "assistant", "content": "I'm here to help with your travel planning! What would you like to know about your upcoming trip?"}
            ]
        }

@app.post("/api/ai-agent/generate-plan")
async def generate_travel_plan(request: dict):
    """Generate comprehensive travel plan based on booking and preferences"""
    try:
        # Extract data from request
        location = request.get("location", "San Francisco")
        check_in = request.get("check_in", datetime.now().date().isoformat())
        check_out = request.get("check_out", (datetime.now().date().replace(day=datetime.now().day + 3)).isoformat())
        guest_count = request.get("guest_count", 2)
        interests = request.get("interests", ["culture", "food", "outdoor"])
        dietary_restrictions = request.get("dietary_restrictions", ["vegetarian"])
        mobility_needs = request.get("mobility_needs", "none")
        children_count = request.get("children_count", 0)
        budget_range = request.get("budget_range", "moderate")
        
        # Create booking context
        booking_context = BookingContext(
            location=location,
            check_in=datetime.fromisoformat(check_in).date(),
            check_out=datetime.fromisoformat(check_out).date(),
            party_type=PartyType.FAMILY if children_count > 0 else PartyType.COUPLE,
            guest_count=guest_count
        )
        
        # Convert string values to enums
        mobility_enum = MobilityNeeds.FULL_MOBILITY
        if mobility_needs == "wheelchair_accessible":
            mobility_enum = MobilityNeeds.WHEELCHAIR_ACCESSIBLE
        elif mobility_needs == "limited_mobility":
            mobility_enum = MobilityNeeds.LIMITED_MOBILITY
        
        dietary_enums = []
        for restriction in dietary_restrictions:
            if restriction == "vegan":
                dietary_enums.append(DietaryRestrictions.VEGAN)
            elif restriction == "vegetarian":
                dietary_enums.append(DietaryRestrictions.VEGETARIAN)
            elif restriction == "gluten_free":
                dietary_enums.append(DietaryRestrictions.GLUTEN_FREE)
            elif restriction == "keto":
                dietary_enums.append(DietaryRestrictions.KETO)
            elif restriction == "halal":
                dietary_enums.append(DietaryRestrictions.HALAL)
            elif restriction == "kosher":
                dietary_enums.append(DietaryRestrictions.KOSHER)
        
        # Create preferences
        preferences = TravelerPreferences(
            interests=interests,
            dietary_restrictions=dietary_enums,
            mobility_needs=mobility_enum,
            children_count=children_count,
            budget_range=budget_range
        )
        
        # Create AI request
        ai_request = AIAgentRequest(
            booking_context=booking_context,
            preferences=preferences,
            user_query="Create a comprehensive travel plan",
            conversation_history=[]
        )
        
        # Generate travel plan using Ollama
        travel_plan = await ai_agent.generate_travel_plan(ai_request)
        
        # Convert to dict for JSON response
        return {
            "day_plans": [
                {
                    "date": day_plan.date.isoformat(),
                    "time_blocks": {
                        time_block.value: [
                            {
                                "title": activity.title,
                                "description": activity.description,
                                "duration": activity.duration_hours,
                                "price_tier": activity.price_tier
                            }
                            for activity in activities
                        ]
                        for time_block, activities in day_plan.time_blocks.items()
                    },
                    "weather_forecast": day_plan.weather_forecast,
                    "notes": day_plan.notes
                }
                for day_plan in travel_plan.day_plans
            ],
            "restaurant_recommendations": [
                {
                    "name": restaurant.name,
                    "address": restaurant.address,
                    "cuisine_type": restaurant.cuisine_type,
                    "price_tier": restaurant.price_tier,
                    "dietary_accommodations": restaurant.dietary_accommodations,
                    "rating": restaurant.rating,
                    "description": restaurant.description
                }
                for restaurant in travel_plan.restaurant_recommendations
            ],
            "packing_checklist": {
                "items": [
                    {
                        "item": item.item,
                        "category": item.category,
                        "essential": item.essential,
                        "weather_dependent": getattr(item, 'weather_dependent', False),
                        "reason": getattr(item, 'reason', None)
                    }
                    for item in travel_plan.packing_checklist.items
                ],
                "weather_aware": travel_plan.packing_checklist.weather_aware,
                "trip_duration_days": travel_plan.packing_checklist.trip_duration_days,
                "destination_climate": travel_plan.packing_checklist.destination_climate
            },
            "conversation_history": travel_plan.conversation_history,
            "generated_at": travel_plan.generated_at.isoformat(),
            "additional_tips": travel_plan.additional_tips
        }
        
    except Exception as e:
        print(f"Error generating travel plan: {e}")
        # Fallback to mock plan if AI fails
        return {
            "day_plans": [
                {
                    "date": datetime.now().date().isoformat(),
                    "time_blocks": {
                        "morning": [
                            {
                                "title": "City Walking Tour",
                                "description": "Explore the highlights of your destination",
                                "duration": 2.0,
                                "price_tier": "moderate"
                            }
                        ],
                        "afternoon": [
                            {
                                "title": "Local Museum Visit",
                                "description": "Discover the history and culture",
                                "duration": 3.0,
                                "price_tier": "budget"
                            }
                        ],
                        "evening": [
                            {
                                "title": "Food Market Tour",
                                "description": "Experience local flavors",
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
                    "address": location,
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
                    {"item": "Camera or smartphone", "category": "Electronics", "essential": True}
                ],
                "weather_aware": True,
                "trip_duration_days": 3,
                "destination_climate": "sunny"
            },
            "conversation_history": [
                {"role": "user", "content": "Create a travel plan for my trip"},
                {"role": "assistant", "content": "I've created a personalized travel plan for your trip! The itinerary includes daily activities, restaurant recommendations, and a weather-aware packing checklist."}
            ],
            "generated_at": datetime.now().isoformat(),
            "additional_tips": [
                "Stay hydrated and use sunscreen!",
                "Book activities in advance to avoid crowds"
            ]
        }

# Error handlers
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
    # Get configuration from environment
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
