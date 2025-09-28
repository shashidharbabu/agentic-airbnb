from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from typing import Dict, List, Any, Optional
from app.config_sqlite import settings
from app.services.tavily_service import tavily_service
from app.schemas import BookingContext, UserPreferences, ConciergeRequest
import json

class SimpleTravelConciergeAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY
        )
    
    async def process_concierge_request(self, request: ConciergeRequest) -> Dict[str, Any]:
        """Process a concierge request and return recommendations"""
        try:
            # Extract context from request
            booking = request.booking_context
            preferences = request.preferences
            user_message = request.user_message or ""
            
            # Create context string
            context = self._build_context_string(booking, preferences)
            
            # Process with simple LLM call
            if user_message:
                # Handle natural language query
                response = await self._handle_natural_language_query(context, user_message)
            else:
                # Generate comprehensive itinerary
                response = await self._generate_comprehensive_itinerary(context)
            
            return response
            
        except Exception as e:
            return {
                "error": f"Error processing request: {str(e)}",
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [],
                "packing_checklist": []
            }
    
    def _build_context_string(self, booking: BookingContext, preferences: UserPreferences) -> str:
        """Build context string for the agent"""
        context = f"""
        BOOKING CONTEXT:
        - Location: {booking.location}
        - Dates: {booking.check_in_date} to {booking.check_out_date}
        - Party: {booking.party_type} ({booking.party_size} people)
        - Coordinates: {booking.latitude}, {booking.longitude}
        
        PREFERENCES:
        - Budget: {preferences.budget_tier}
        - Interests: {', '.join(preferences.interests)}
        - Mobility needs: {', '.join(preferences.mobility_needs)}
        - Dietary restrictions: {', '.join(preferences.dietary_restrictions)}
        - Special requirements: {preferences.special_requirements or 'None'}
        """
        return context
    
    async def _handle_natural_language_query(self, context: str, user_message: str) -> Dict[str, Any]:
        """Handle natural language queries"""
        query = f"""
        Context: {context}
        
        User Query: {user_message}
        
        Please provide personalized travel recommendations based on the context and user query.
        """
        
        messages = [
            SystemMessage(content="You are a professional travel concierge AI assistant. Provide helpful, personalized travel recommendations."),
            HumanMessage(content=query)
        ]
        
        response = await self.llm.ainvoke(messages)
        
        return {
            "agent_response": response.content,
            "day_by_day_plan": [],
            "activity_cards": [],
            "restaurant_recommendations": [],
            "packing_checklist": []
        }
    
    async def _generate_comprehensive_itinerary(self, context: str) -> Dict[str, Any]:
        """Generate a comprehensive travel itinerary"""
        query = f"""
        Context: {context}
        
        Please create a comprehensive travel itinerary including:
        1. Day-by-day plan with morning/afternoon/evening activities
        2. Restaurant recommendations with dietary considerations
        3. Activity cards with accessibility information
        4. Weather-aware packing checklist
        5. Local events and happenings
        """
        
        messages = [
            SystemMessage(content="You are a professional travel concierge AI assistant. Create detailed, personalized travel itineraries."),
            HumanMessage(content=query)
        ]
        
        response = await self.llm.ainvoke(messages)
        
        return {
            "agent_response": response.content,
            "day_by_day_plan": [],
            "activity_cards": [],
            "restaurant_recommendations": [],
            "packing_checklist": []
        }

# Global instance
simple_travel_agent = SimpleTravelConciergeAgent()
