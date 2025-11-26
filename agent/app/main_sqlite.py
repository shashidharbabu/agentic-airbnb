from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uvicorn
import httpx

from app.database_sqlite import get_db
from app.schemas import (
    ConciergeRequest, ConciergeResponse, BookingCreate, BookingResponse,
    UserCreate, UserResponse, UserPreferencesCreate, UserPreferencesResponse
)
from app.services.simple_ai_agent import simple_travel_agent
from app.services.recommendation_engine import RecommendationEngine
from app.services.itinerary_planner import ItineraryPlanner
from app.services.tavily_service import tavily_service
from app.models import User, Booking, UserPreferences
from app.config_sqlite import settings

# Create FastAPI app
app = FastAPI(
    title="Agent Airbnb - AI Travel Concierge (SQLite)",
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

# Helper function to fetch traveller's upcoming bookings
async def fetch_traveller_upcoming_bookings(traveller_id: int) -> Optional[List[Dict[str, Any]]]:
    """
    Fetch upcoming bookings for a traveller from the traveller backend.
    Uses internal API endpoint that doesn't require authentication.
    Returns upcoming bookings or None if no bookings found.
    """
    try:
        traveller_api_url = settings.TRAVELER_API_URL
        
        async with httpx.AsyncClient() as client:
            # Use the new internal endpoint that doesn't require authentication
            response = await client.get(
                f"{traveller_api_url}/api/bookings/internal/traveler/{traveller_id}/upcoming",
                timeout=10.0
            )
            
            print(f"📡 API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                bookings = data.get("bookings", [])
                
                print(f"📊 Found {len(bookings)} upcoming bookings in database")
                
                # Bookings are already filtered for upcoming dates in the SQL query
                return bookings if bookings else None
            else:
                print(f"❌ Failed to fetch bookings: {response.status_code}")
                print(f"❌ Response: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error fetching traveller bookings: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Agent Airbnb - AI Travel Concierge API (SQLite)",
        "version": "1.0.0",
        "status": "active",
        "database": "SQLite"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "agent-airbnb", "database": "SQLite"}

# Main AI Concierge endpoint
@app.post("/api/concierge", response_model=ConciergeResponse)
async def ai_concierge(request: ConciergeRequest, db: Session = Depends(get_db)):
    """
    Main AI Concierge endpoint that processes travel requests and returns personalized recommendations.
    """
    try:
        print(f"🎯 DEBUG: Received concierge request with message: '{request.user_message}'")
        
        # Process with AI agent - this now handles intent detection
        agent_response = await simple_travel_agent.process_concierge_request(request)
        
        print(f"🎯 DEBUG: Agent response keys: {agent_response.keys()}")
        
        # The agent response already contains the appropriate data based on intent
        # We use it directly instead of always generating full recommendations
        response_data = {
            "day_by_day_plan": agent_response.get("day_by_day_plan", []),
            "activity_cards": agent_response.get("activity_cards", []),
            "restaurant_recommendations": agent_response.get("restaurant_recommendations", []),
            "packing_checklist": agent_response.get("packing_checklist", []),
            "weather_summary": {},
            "local_events": [],
            "agent_notes": agent_response.get("agent_response", ""),
            "extracted_context": {
                "location": request.booking_context.location,
                "check_in_date": str(request.booking_context.check_in_date),
                "check_out_date": str(request.booking_context.check_out_date),
                "party_size": request.booking_context.party_size
            }
        }
        
        return response_data
        
    except Exception as e:
        print(f"❌ ERROR in ai_concierge: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing concierge request: {str(e)}")

# AI Agent Chat endpoint (for frontend integration)
@app.post("/api/ai-agent/chat")
async def ai_agent_chat(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    Chat endpoint for AI Agent integration with frontend.
    Automatically fetches traveller's upcoming bookings and uses them as context.
    """
    try:
        message = request.get("message", "")
        traveler_id = request.get("traveler_id") or request.get("traveller_id")
        booking_id = request.get("booking_id")
        conversation_history = request.get("conversation_history", [])
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        print(f"🎯 DEBUG (chat endpoint): Message='{message}', traveler_id={traveler_id}, booking_id={booking_id}")
        print(f"💬 DEBUG: Conversation history has {len(conversation_history)} messages")
        
        # Initialize context variables
        booking_context = None
        user_preferences = None
        booking_info = None
        
        # Strategy 1: If traveler_id is provided, fetch their upcoming bookings from traveller backend
        if traveler_id:
            print(f"🔍 Fetching upcoming bookings for traveler {traveler_id}...")
            upcoming_bookings = await fetch_traveller_upcoming_bookings(traveler_id)
            
            if upcoming_bookings and len(upcoming_bookings) > 0:
                # Use the first upcoming booking
                booking_info = upcoming_bookings[0]
                print(f"✅ Found {len(upcoming_bookings)} upcoming booking(s). Using: {booking_info.get('property_name')}")
                
                # Extract location from the booking
                location_parts = []
                if booking_info.get("property_location"):
                    # property_location might be a full address or city
                    location_parts.append(booking_info["property_location"])
                
                location = location_parts[0] if location_parts else "your destination"
                
                # Parse dates
                start_date = datetime.strptime(booking_info["start_date"][:10], "%Y-%m-%d").date()
                end_date = datetime.strptime(booking_info["end_date"][:10], "%Y-%m-%d").date()
                
                # Create booking context from traveller backend data
                from app.schemas import BookingContext, UserPreferences as UserPreferencesSchema
                booking_context = BookingContext(
                    check_in_date=start_date,
                    check_out_date=end_date,
                    location=location,
                    latitude=None,  # Not available from booking
                    longitude=None,
                    party_type="couple" if booking_info.get("guests", 2) == 2 else "group",
                    party_size=booking_info.get("guests", 2)
                )
                
                # Create default preferences (can be enhanced later)
                user_preferences = UserPreferencesSchema(
                    budget_tier="mid-range",
                    interests=["food", "culture", "sightseeing"],
                    mobility_needs=[],
                    dietary_restrictions=[],
                    special_requirements=None
                )
                
                booking_id = booking_info.get("id")
            else:
                print("ℹ️ No upcoming bookings found for this traveler")
                # Return helpful message
                return {
                    "response": "I don't see any upcoming bookings in your account yet. Once you book a property, I'll be able to help you plan an amazing itinerary for your trip! Feel free to browse available properties and make a booking.",
                    "status": "success",
                    "has_booking": False
                }
        
        # Strategy 2: If booking_id is provided (fallback to SQLite sample data)
        elif booking_id:
            print(f"🔍 Looking up booking {booking_id} in local database...")
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
        
        # Process with AI agent if we have context
        if booking_context and user_preferences:
            concierge_request = ConciergeRequest(
                booking_context=booking_context,
                preferences=user_preferences,
                user_message=message
            )
            print(f"🎯 DEBUG: Processing message: '{message}'")
            print(f"📍 Context: {booking_context.location}, {booking_context.check_in_date} to {booking_context.check_out_date}")
            
            agent_response = await simple_travel_agent.process_concierge_request(
                concierge_request, 
                conversation_history=conversation_history
            )
            print(f"✅ Agent response keys: {agent_response.keys()}")
            
            # Return full agent response with booking details
            return {
                "response": agent_response.get("agent_response", "I can help you plan your trip!"),
                "day_by_day_plan": agent_response.get("day_by_day_plan", []),
                "activity_cards": agent_response.get("activity_cards", []),
                "restaurant_recommendations": agent_response.get("restaurant_recommendations", []),
                "packing_checklist": agent_response.get("packing_checklist", []),
                "extracted_context": {
                    "location": booking_context.location,
                    "check_in_date": str(booking_context.check_in_date),
                    "check_out_date": str(booking_context.check_out_date),
                    "party_size": booking_context.party_size,
                    "property_name": booking_info.get("property_name") if booking_info else None
                },
                "booking_id": booking_id,
                "status": "success",
                "has_booking": True
            }
        else:
            # No booking context available
            response_text = "I'm your AI travel assistant! To provide personalized recommendations, I'll need you to have an upcoming booking. Once you book a property, I can help you plan your itinerary, recommend restaurants, and create a packing list!"
            
            return {
                "response": response_text,
                "status": "success",
                "has_booking": False
            }
        
    except Exception as e:
        print(f"❌ Error in ai_agent_chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "response": "I apologize, but I encountered an error processing your request. Please try again or provide more details about your travel plans.",
            "status": "error",
            "error": str(e),
            "has_booking": False
        }

# Natural Language Query endpoint
@app.post("/api/concierge/query")
async def natural_language_query(
    booking_id: int,
    user_message: str,
    db: Session = Depends(get_db)
):
    """Handle natural language queries from users."""
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
        response = await simple_travel_agent.process_concierge_request(request)
        
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
        "app.main_sqlite:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
