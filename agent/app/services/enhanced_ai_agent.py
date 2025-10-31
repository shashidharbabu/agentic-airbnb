"""
Enhanced LangChain AI Agent with Conversation Memory and Database Integration
"""

from typing import Dict, List, Any, Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from app.config import settings
from app.services.conversation_memory import ConversationMemoryManager
from app.schemas import ConciergeRequest, BookingContext, UserPreferences
from sqlalchemy.orm import Session
import json
import logging
from datetime import datetime, timedelta
import re

logger = logging.getLogger(__name__)


class EnhancedTravelAgent:
    """
    Enhanced travel concierge agent using LangChain with conversation memory and DB integration
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """Create a dynamic system prompt based on booking context"""
        
        booking = context.get("booking", {})
        preferences = context.get("preferences", {})
        
        location = booking.get("location", "the destination")
        check_in = booking.get("check_in", "")
        check_out = booking.get("check_out", "")
        party_type = booking.get("party_type", "")
        party_size = booking.get("party_size", 0)
        
        interests = ", ".join(preferences.get("interests", [])) or "general interests"
        dietary = ", ".join(preferences.get("dietary_restrictions", [])) or "no specific restrictions"
        mobility = ", ".join(preferences.get("mobility_needs", [])) or "no mobility needs"
        budget = preferences.get("budget_tier", "moderate")
        
        system_prompt = f"""You are an expert AI travel concierge assistant for Airbnb guests.

BOOKING CONTEXT:
- Destination: {location}
- Check-in: {check_in}
- Check-out: {check_out}
- Party Type: {party_type} ({party_size} people)
- Trip Duration: {self._calculate_duration(check_in, check_out)} days

TRAVELER PROFILE:
- Budget Tier: {budget}
- Interests: {interests}
- Dietary Restrictions: {dietary}
- Mobility Needs: {mobility}
- Special Requirements: {preferences.get("special_requirements", "None")}

YOUR RESPONSIBILITIES:
1. Provide personalized travel recommendations based on the traveler's profile
2. Suggest activities, restaurants, attractions suitable for their interests and budget
3. Consider accessibility needs and dietary restrictions
4. Create practical day-by-day itineraries
5. Provide packing and travel tips relevant to the destination and season
6. Answer specific questions about their booking and trip
7. Remember previous conversations in this session
8. Be conversational and helpful, not robotic

IMPORTANT GUIDELINES:
- Always reference the booking context when relevant
- Suggest 3-5 top recommendations per request
- Include prices, accessibility info, and practical details
- Ask clarifying questions if needed
- Keep responses concise but informative (2-3 paragraphs)
- Use emojis sparingly for emphasis
- Never make up information - be honest if you need more data

RESPONSE FORMAT:
- For itinerary requests: Provide day-by-day breakdown
- For activity requests: List with details (name, price, duration, accessibility)
- For restaurant requests: Include cuisine type, price range, dietary options, rating
- For packing lists: Organized by category with essentials marked
- For general questions: Answer conversationally with relevant tips
"""
        return system_prompt
    
    def _calculate_duration(self, check_in: str, check_out: str) -> int:
        """Calculate trip duration in days"""
        try:
            check_in_date = datetime.strptime(check_in, "%Y-%m-%d").date()
            check_out_date = datetime.strptime(check_out, "%Y-%m-%d").date()
            return (check_out_date - check_in_date).days
        except:
            return 0
    
    async def process_user_message(
        self,
        session_id: str,
        booking_id: int,
        user_message: str,
        memory_manager: ConversationMemoryManager,
        db: Session
    ) -> Dict[str, Any]:
        """
        Process a user message with full context and conversation memory
        
        Args:
            session_id: Unique session identifier
            booking_id: Booking ID for context
            user_message: User's message
            memory_manager: Conversation memory manager instance
            db: Database session
            
        Returns:
            Dict with agent response and metadata
        """
        try:
            # Get or create session memory
            memory = memory_manager.get_or_create_session_memory(session_id, booking_id)
            
            # Get booking context
            context = memory_manager.get_booking_context(booking_id)
            if not context:
                return {
                    "response": "I couldn't load your booking information. Please try again or contact support.",
                    "status": "error",
                    "intent": None,
                    "entities": None
                }
            
            # Detect intent from user message
            intent = self._detect_intent(user_message)
            logger.info(f"Detected intent: {intent}")
            
            # Extract entities
            entities = self._extract_entities(user_message, context)
            
            # Get conversation history summary
            session_summary = memory_manager.get_session_summary(booking_id, limit=3)
            
            # Get relevant recommendations from database
            recommendations = memory_manager.get_relevant_recommendations(booking_id)
            
            # Create messages for LLM
            system_prompt = self._create_system_prompt(context)
            
            # Build context message (without complex JSON that breaks parsing)
            activities_str = "Not available"
            restaurants_str = "Not available"
            
            if recommendations.get('activities'):
                activities_str = ", ".join([a.get('title', 'Activity') for a in recommendations['activities'][:3]])
            if recommendations.get('restaurants'):
                restaurants_str = ", ".join([r.get('name', 'Restaurant') for r in recommendations['restaurants'][:3]])
            
            context_info = f"""AVAILABLE RECOMMENDATIONS:
- Top Activities: {activities_str}
- Top Restaurants: {restaurants_str}

{session_summary}

Current request intent: {intent}
Extracted details: {str(entities) if entities else "None"}"""
            
            # Build messages for LLM
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "system", "content": context_info},
            ]
            
            # Add recent chat history from memory
            if hasattr(memory, 'chat_memory') and memory.chat_memory.messages:
                for msg in memory.chat_memory.messages[-6:]:  # Last 3 exchanges
                    role = "user" if msg.type == "human" else "assistant"
                    messages.append({"role": role, "content": msg.content})
            
            # Add current message
            messages.append({"role": "user", "content": user_message})
            
            # Get AI response directly from LLM
            logger.info(f"Processing message: {user_message[:100]}...")
            response_msg = await self.llm.ainvoke(messages)
            response = response_msg.content
            
            logger.info(f"Agent response: {response[:100]}...")
            
            # Add to memory manually
            memory.chat_memory.add_user_message(user_message)
            memory.chat_memory.add_ai_message(response)
            
            # Save conversation to database
            memory_manager.add_message(
                session_id=session_id,
                booking_id=booking_id,
                user_message=user_message,
                agent_response=response,
                intent=intent,
                entities=entities
            )
            
            return {
                "response": response,
                "status": "success",
                "intent": intent,
                "entities": entities,
                "session_id": session_id,
                "conversation_memory": memory.chat_memory.messages[-4:] if hasattr(memory, 'chat_memory') else []
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            return {
                "response": f"I encountered an error processing your request: {str(e)}. Please try again.",
                "status": "error",
                "intent": None,
                "entities": None,
                "error": str(e)
            }
    
    def _detect_intent(self, message: str) -> str:
        """
        Detect user intent from message
        
        Args:
            message: User message
            
        Returns:
            Intent string
        """
        message_lower = message.lower().strip()
        
        # Greeting
        if any(word in message_lower for word in ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon']):
            if len(message_lower.split()) <= 3:
                return "greeting"
        
        # Itinerary/Day planning
        if any(word in message_lower for word in ['plan', 'itinerary', 'schedule', 'day by day', 'daily plan', 'what should i do', 'activities']):
            return "day_plan"
        
        # Food/Restaurants
        if any(word in message_lower for word in ['restaurant', 'food', 'eat', 'dining', 'lunch', 'dinner', 'breakfast', 'cuisine', 'dinner reservation']):
            return "restaurants"
        
        # Activities/Things to do
        if any(word in message_lower for word in ['activities', 'attractions', 'visit', 'see', 'explore', 'things to do', 'what can i']):
            return "activities"
        
        # Packing
        if any(word in message_lower for word in ['pack', 'bring', 'wear', 'clothes', 'luggage', 'what to bring']):
            return "packing"
        
        # Weather/Conditions
        if any(word in message_lower for word in ['weather', 'temperature', 'rain', 'snow', 'climate', 'cold', 'hot']):
            return "weather"
        
        # Transportation
        if any(word in message_lower for word in ['transport', 'taxi', 'uber', 'car', 'flight', 'train', 'bus', 'how to get']):
            return "transportation"
        
        # Questions
        if '?' in message_lower:
            return "question"
        
        # Default
        return "general"
    
    def _extract_entities(self, message: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Extract useful entities from message
        
        Args:
            message: User message
            context: Booking context
            
        Returns:
            Dict of extracted entities
        """
        entities = {}
        message_lower = message.lower()
        
        # Extract food preferences
        dietary_keywords = {
            'vegan': ['vegan', 'plant-based'],
            'vegetarian': ['vegetarian', 'veg'],
            'gluten-free': ['gluten-free', 'gluten free'],
            'spicy': ['spicy', 'hot'],
            'seafood': ['seafood', 'fish'],
            'italian': ['italian', 'pasta'],
            'asian': ['asian', 'thai', 'chinese', 'japanese']
        }
        
        for diet_type, keywords in dietary_keywords.items():
            if any(kw in message_lower for kw in keywords):
                entities['food_preference'] = diet_type
                break
        
        # Extract activity types
        activity_keywords = {
            'outdoor': ['hiking', 'nature', 'outdoor', 'park', 'beach', 'trail'],
            'culture': ['museum', 'art', 'culture', 'history', 'gallery', 'monument'],
            'food': ['food', 'restaurant', 'cuisine', 'dining', 'cook'],
            'nightlife': ['nightlife', 'bar', 'club', 'entertainment', 'night'],
            'shopping': ['shopping', 'shop', 'mall', 'store', 'boutique']
        }
        
        for activity_type, keywords in activity_keywords.items():
            if any(kw in message_lower for kw in keywords):
                entities['activity_type'] = activity_type
                break
        
        # Extract budget mentions
        if any(word in message_lower for word in ['cheap', 'budget', 'affordable', 'free']):
            entities['budget_preference'] = 'budget'
        elif any(word in message_lower for word in ['expensive', 'luxury', 'premium', 'high-end']):
            entities['budget_preference'] = 'luxury'
        
        # Extract time references
        if any(word in message_lower for word in ['morning', 'am', 'breakfast', 'brunch']):
            entities['time_preference'] = 'morning'
        elif any(word in message_lower for word in ['afternoon', 'lunch', 'pm']):
            entities['time_preference'] = 'afternoon'
        elif any(word in message_lower for word in ['evening', 'dinner', 'night']):
            entities['time_preference'] = 'evening'
        
        return entities if entities else None


# Create global agent instance
enhanced_travel_agent = EnhancedTravelAgent()
