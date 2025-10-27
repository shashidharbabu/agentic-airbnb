from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn

from app.database import get_db
from app.schemas import (
    ConciergeRequest, ConciergeResponse, BookingCreate, BookingResponse,
    UserCreate, UserResponse, UserPreferencesCreate, UserPreferencesResponse
)
from app.services.ai_agent import travel_agent
from app.services.recommendation_engine import RecommendationEngine
from app.services.itinerary_planner import ItineraryPlanner
from app.services.tavily_service import tavily_service
from app.models import User, Booking, UserPreferences
from app.config import settings

# Create FastAPI app
app = FastAPI(
    title="Agent Airbnb - AI Travel Concierge",
    description="AI-powered travel concierge service for Airbnb guests",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Agent Airbnb - AI Travel Concierge API",
        "version": "1.0.0",
        "status": "active"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agent-airbnb"}

# Main AI Concierge endpoint
@app.post("/api/concierge", response_model=ConciergeResponse)
async def ai_concierge(request: ConciergeRequest, db: Session = Depends(get_db)):
    """
    Main AI Concierge endpoint that processes travel requests and returns personalized recommendations.
    
    This endpoint:
    1. Processes booking context and user preferences
    2. Uses AI agent for natural language understanding
    3. Generates personalized travel recommendations
    4. Returns day-by-day plans, activities, restaurants, and packing lists
    """
    try:
        # Initialize services
        recommendation_engine = RecommendationEngine(db)
        itinerary_planner = ItineraryPlanner(recommendation_engine)
        
        # Process with AI agent
        agent_response = await travel_agent.process_concierge_request(request)
        
        # Get booking dates
        booking_dates = (request.booking_context.check_in_date, request.booking_context.check_out_date)
        
        # Get recommendations
        activities = await recommendation_engine.get_activity_recommendations(
            request.booking_context.location,
            request.preferences,
            booking_dates
        )
        
        restaurants = await recommendation_engine.get_restaurant_recommendations(
            request.booking_context.location,
            request.preferences
        )
        
        # Get local events
        events = await recommendation_engine.get_local_events(
            request.booking_context.location,
            booking_dates
        )
        
        # Get weather information
        weather_data = await tavily_service.search_weather_info(
            request.booking_context.location,
            f"from {request.booking_context.check_in_date} to {request.booking_context.check_out_date}"
        )
        
        # Generate packing checklist
        packing_checklist = recommendation_engine.generate_packing_checklist(
            request.booking_context.location,
            booking_dates,
            activities,
            weather_data
        )
        
        # Create day-by-day itinerary
        day_by_day_plan = await itinerary_planner.create_day_by_day_itinerary(
            request.booking_context.location,
            booking_dates,
            request.preferences,
            activities,
            restaurants,
            events
        )
        
        # Prepare response
        response = ConciergeResponse(
            day_by_day_plan=day_by_day_plan,
            activity_cards=activities,
            restaurant_recommendations=restaurants,
            packing_checklist=packing_checklist,
            weather_summary=weather_data,
            local_events=events,
            agent_notes=agent_response.get("agent_response", "")
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing concierge request: {str(e)}")

# AI Agent Chat endpoint (for frontend integration)
@app.post("/api/ai-agent/chat")
async def ai_agent_chat(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Chat endpoint for AI Agent integration with frontend.
    Processes chat messages with booking context.
    """
    try:
        message = request.get("message", "")
        booking_id = request.get("booking_id")
        traveler_id = request.get("traveler_id")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # If booking_id is provided, get booking context
        booking_context = None
        user_preferences = None
        
        if booking_id:
            booking = db.query(Booking).filter(Booking.id == booking_id).first()
            if booking:
                preferences = db.query(UserPreferences).filter(UserPreferences.booking_id == booking_id).first()
                
                from app.schemas import BookingContext, UserPreferences as UserPreferencesSchema
                booking_context = BookingContext(
                    check_in_date=booking.check_in_date,
                    check_out_date=booking.check_out_date,
                    location=booking.location,
                    latitude=float(booking.latitude) if booking.latitude else None,
                    longitude=float(booking.longitude) if booking.longitude else None,
                    party_type=booking.party_type,
                    party_size=booking.party_size
                )
                
                if preferences:
                    user_preferences = UserPreferencesSchema(
                        budget_tier=preferences.budget_tier,
                        interests=preferences.interests or [],
                        mobility_needs=preferences.mobility_needs or [],
                        dietary_restrictions=preferences.dietary_restrictions or [],
                        special_requirements=preferences.special_requirements
                    )
        
        # Create concierge request
        if booking_context and user_preferences:
            concierge_request = ConciergeRequest(
                booking_context=booking_context,
                preferences=user_preferences,
                user_message=message
            )
            agent_response = await travel_agent.process_concierge_request(concierge_request)
            response_text = agent_response.get("agent_response", "I can help you plan your trip! Please provide more details about your travel preferences.")
        else:
            # No booking context, provide general response
            response_text = f"I'm your AI travel assistant! To provide personalized recommendations, I'll need information about your booking. How can I help you today?"
        
        return {
            "response": response_text,
            "booking_id": booking_id,
            "status": "success"
        }
        
    except Exception as e:
        print(f"Error in ai_agent_chat: {str(e)}")
        return {
            "response": "I apologize, but I encountered an error processing your request. Please try again or provide more details about your travel plans.",
            "status": "error",
            "error": str(e)
        }

# Natural Language Query endpoint
@app.post("/api/concierge/query")
async def natural_language_query(
    booking_id: int,
    user_message: str,
    db: Session = Depends(get_db)
):
    """
    Handle natural language queries from users.
    This endpoint processes free-text requests and returns AI responses.
    """
    try:
        # Get booking and preferences from database
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        preferences = db.query(UserPreferences).filter(UserPreferences.booking_id == booking_id).first()
        if not preferences:
            raise HTTPException(status_code=404, detail="User preferences not found")
        
        # Create request object
        from app.schemas import BookingContext, UserPreferences as UserPreferencesSchema
        booking_context = BookingContext(
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            location=booking.location,
            latitude=float(booking.latitude) if booking.latitude else None,
            longitude=float(booking.longitude) if booking.longitude else None,
            party_type=booking.party_type,
            party_size=booking.party_size
        )
        
        user_preferences = UserPreferencesSchema(
            budget_tier=preferences.budget_tier,
            interests=preferences.interests or [],
            mobility_needs=preferences.mobility_needs or [],
            dietary_restrictions=preferences.dietary_restrictions or [],
            special_requirements=preferences.special_requirements
        )
        
        request = ConciergeRequest(
            booking_context=booking_context,
            preferences=user_preferences,
            user_message=user_message
        )
        
        # Process with AI agent
        response = await travel_agent.process_concierge_request(request)
        
        return {
            "message": "Query processed successfully",
            "agent_response": response.get("agent_response", ""),
            "booking_id": booking_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

# User management endpoints
@app.post("/api/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    try:
        db_user = User(
            email=user.email,
            name=user.name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating user: {str(e)}")

@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Booking management endpoints
@app.post("/api/bookings", response_model=BookingResponse)
async def create_booking(booking: BookingCreate, db: Session = Depends(get_db)):
    """Create a new booking"""
    try:
        db_booking = Booking(
            user_id=booking.user_id,
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            location=booking.location,
            latitude=booking.latitude,
            longitude=booking.longitude,
            party_type=booking.party_type,
            party_size=booking.party_size
        )
        db.add(db_booking)
        db.commit()
        db.refresh(db_booking)
        return db_booking
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating booking: {str(e)}")

@app.get("/api/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: int, db: Session = Depends(get_db)):
    """Get booking by ID"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

# User preferences endpoints
@app.post("/api/preferences", response_model=UserPreferencesResponse)
async def create_preferences(preferences: UserPreferencesCreate, db: Session = Depends(get_db)):
    """Create user preferences for a booking"""
    try:
        db_preferences = UserPreferences(
            booking_id=preferences.booking_id,
            budget_tier=preferences.budget_tier,
            interests=preferences.interests,
            mobility_needs=preferences.mobility_needs,
            dietary_restrictions=preferences.dietary_restrictions,
            special_requirements=preferences.special_requirements
        )
        db.add(db_preferences)
        db.commit()
        db.refresh(db_preferences)
        return db_preferences
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating preferences: {str(e)}")

@app.get("/api/preferences/{booking_id}", response_model=UserPreferencesResponse)
async def get_preferences(booking_id: int, db: Session = Depends(get_db)):
    """Get preferences for a booking"""
    preferences = db.query(UserPreferences).filter(UserPreferences.booking_id == booking_id).first()
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return preferences

# Tavily search endpoints (for testing)
@app.get("/api/search/activities")
async def search_activities(location: str, interests: str = ""):
    """Search for activities using Tavily"""
    try:
        interests_list = interests.split(",") if interests else []
        results = await tavily_service.search_local_activities(location, interests_list)
        return {
            "location": location,
            "interests": interests_list,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching activities: {str(e)}")

@app.get("/api/search/restaurants")
async def search_restaurants(location: str, dietary: str = ""):
    """Search for restaurants using Tavily"""
    try:
        dietary_list = dietary.split(",") if dietary else []
        results = await tavily_service.search_restaurants(location, dietary_list)
        return {
            "location": location,
            "dietary_restrictions": dietary_list,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching restaurants: {str(e)}")

@app.get("/api/search/events")
async def search_events(location: str):
    """Search for events using Tavily"""
    try:
        results = await tavily_service.search_local_events(location)
        return {
            "location": location,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching events: {str(e)}")

@app.get("/api/search/weather")
async def search_weather(location: str):
    """Search for weather information using Tavily"""
    try:
        results = await tavily_service.search_weather_info(location)
        return {
            "location": location,
            "weather_data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching weather: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
