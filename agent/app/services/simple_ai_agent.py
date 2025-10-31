from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from typing import Dict, List, Any, Optional
from app.config_sqlite import settings
from app.services.tavily_service import tavily_service
from app.services import simple_ai_agent_helpers
from app.schemas import (
    BookingContext, UserPreferences, ConciergeRequest,
    ActivityCard, RestaurantRecommendation, PackingItem, DayPlan, PriceTier
)
from datetime import datetime, timedelta
import json
import re
from dateutil import parser as date_parser

class SimpleTravelConciergeAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY
        )
        self.tavily_service = tavily_service
    
    async def _get_activities_simple(self, location: str, preferences) -> List[ActivityCard]:
        """Get activities using simplified approach"""
        return await simple_ai_agent_helpers.get_activities_simple(location, preferences)
    
    async def _get_restaurants_simple(self, location: str, preferences) -> List[RestaurantRecommendation]:
        """Get restaurants using simplified approach"""
        return await simple_ai_agent_helpers.get_restaurants_simple(location, preferences)
    
    async def _get_events_simple(self, location: str, dates: tuple) -> List[Dict[str, Any]]:
        """Get events using simplified approach"""
        return await simple_ai_agent_helpers.get_events_simple(location, dates)
    
    def _create_simple_itinerary(self, check_in, check_out, activities, restaurants) -> List[DayPlan]:
        """Create simple itinerary"""
        return simple_ai_agent_helpers.create_simple_itinerary(check_in, check_out, activities, restaurants)
    
    def _generate_simple_packing(self, location: str, dates: tuple) -> List[PackingItem]:
        """Generate simple packing list"""
        return simple_ai_agent_helpers.generate_simple_packing(location, dates)
    
    async def process_concierge_request(
        self, 
        request: ConciergeRequest,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Process a concierge request and return recommendations with conversation context"""
        try:
            # Extract context from request
            booking = request.booking_context
            preferences = request.preferences
            user_message = request.user_message or ""
            
            print(f"📨 DEBUG: Received message: '{user_message}'")
            print(f"📍 DEBUG: Default location: '{booking.location}'")
            print(f"💬 DEBUG: Conversation history: {len(conversation_history) if conversation_history else 0} messages")
            
            # Extract travel details from user message
            extracted_details = self._extract_travel_details(user_message)
            print(f"🔍 DEBUG: Extracted details: {extracted_details}")
            
            # Override booking context with extracted details
            if extracted_details.get('location'):
                booking.location = extracted_details['location']
                print(f"✅ DEBUG: Updated location to: '{booking.location}'")
            
            if extracted_details.get('check_in_date'):
                booking.check_in_date = extracted_details['check_in_date']
                print(f"✅ DEBUG: Updated check-in to: '{booking.check_in_date}'")
            
            if extracted_details.get('check_out_date'):
                booking.check_out_date = extracted_details['check_out_date']
                print(f"✅ DEBUG: Updated check-out to: '{booking.check_out_date}'")
            
            if extracted_details.get('party_size'):
                booking.party_size = extracted_details['party_size']
                print(f"✅ DEBUG: Updated party size to: {booking.party_size}")
            
            # Detect user intent
            intent = self._detect_intent(user_message)
            
            # Check if this is a follow-up question
            is_followup = self._is_followup_question(user_message, conversation_history)
            
            print(f"🎯 DEBUG: Final intent = '{intent}', is_followup = {is_followup}")
            
            # Handle based on intent
            if is_followup:
                # Handle follow-up questions with conversation context
                print(f"🔄 DEBUG: Handling follow-up question with conversation context")
                return await self._handle_followup_question(booking, preferences, user_message, conversation_history)
            elif intent == "greeting":
                print(f"🎉 DEBUG: Handling greeting...")
                return await self._handle_greeting(booking, preferences)
            elif intent == "day_plan":
                return await self._generate_full_itinerary(booking, preferences, user_message)
            elif intent == "restaurants":
                return await self._generate_restaurant_recommendations(booking, preferences, user_message)
            elif intent == "activities":
                return await self._generate_activity_recommendations(booking, preferences, user_message)
            elif intent == "packing":
                return await self._generate_packing_checklist(booking, preferences, user_message)
            elif intent == "question":
                return await self._handle_specific_question(booking, preferences, user_message, conversation_history)
            else:
                # Default: generate comprehensive response
                return await self._generate_full_itinerary(booking, preferences, user_message)
            
        except Exception as e:
            print(f"Error in process_concierge_request: {str(e)}")
            return {
                "agent_response": f"I apologize, but I encountered an error: {str(e)}. Please try rephrasing your request.",
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [],
                "packing_checklist": []
            }
    
    def _extract_travel_details(self, user_message: str) -> Dict[str, Any]:
        """Extract location, dates, and other travel details from user message using NLU"""
        details = {}
        message_lower = user_message.lower()
        
        # Extract location using common patterns
        location_patterns = [
            r'(?:to|in|at|visit|traveling to|going to|trip to)\s+([A-Z][a-zA-Z\s]+(?:,\s*[A-Z]{2})?)',
            r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?),\s*([A-Z]{2})',  # City, State
            r'([A-Z][a-zA-Z\s]+)\s+itinerary',
            r'plan.*(?:for|in)\s+([A-Z][a-zA-Z\s]+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, user_message)
            if match:
                location = match.group(1).strip()
                # Common US cities - capitalize properly
                city_names = {
                    'los angeles': 'Los Angeles, CA',
                    'new york': 'New York, NY',
                    'san francisco': 'San Francisco, CA',
                    'chicago': 'Chicago, IL',
                    'miami': 'Miami, FL',
                    'seattle': 'Seattle, WA',
                    'boston': 'Boston, MA',
                    'las vegas': 'Las Vegas, NV',
                    'portland': 'Portland, OR',
                    'austin': 'Austin, TX',
                    'denver': 'Denver, CO',
                    'san diego': 'San Diego, CA'
                }
                
                location_lower = location.lower()
                if location_lower in city_names:
                    details['location'] = city_names[location_lower]
                else:
                    details['location'] = location.title()
                break
        
        # Extract dates
        date_patterns = [
            r'from\s+(\w+\s+\d+)\s+to\s+(\w+\s+\d+)',
            r'(\d{1,2}/\d{1,2}(?:/\d{2,4})?)\s+to\s+(\d{1,2}/\d{1,2}(?:/\d{2,4})?)',
            r'for\s+(\d+)\s+days?',
            r'(\d+)\s+day\s+trip'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, message_lower)
            if match:
                if 'days' in pattern or 'day' in pattern:
                    # Duration mentioned
                    num_days = int(match.group(1))
                    check_in = datetime.now() + timedelta(days=7)  # Default to 1 week from now
                    check_out = check_in + timedelta(days=num_days)
                    details['check_in_date'] = check_in.date()
                    details['check_out_date'] = check_out.date()
                else:
                    # Specific dates mentioned
                    try:
                        check_in = date_parser.parse(match.group(1), fuzzy=True)
                        check_out = date_parser.parse(match.group(2), fuzzy=True)
                        details['check_in_date'] = check_in.date()
                        details['check_out_date'] = check_out.date()
                    except:
                        pass
                break
        
        # Extract party size
        party_patterns = [
            r'(\d+)\s+(?:people|persons|guests|travelers|of us)',
            r'(?:party of|group of)\s+(\d+)',
            r'(?:family of|couple)'
        ]
        
        for pattern in party_patterns:
            match = re.search(pattern, message_lower)
            if match:
                if 'couple' in pattern:
                    details['party_size'] = 2
                    details['party_type'] = 'couple'
                elif 'family' in pattern:
                    details['party_size'] = int(match.group(1)) if match.lastindex else 4
                    details['party_type'] = 'family'
                else:
                    size = int(match.group(1))
                    details['party_size'] = size
                    details['party_type'] = 'family' if size >= 3 else 'couple'
                break
        
        return details
    
    def _detect_intent(self, user_message: str) -> str:
        """Detect user intent from natural language"""
        message_lower = user_message.lower().strip()
        
        print(f"🔍 DEBUG: User message = '{user_message}'")
        print(f"🔍 DEBUG: Message lower = '{message_lower}'")
        print(f"🔍 DEBUG: Word count = {len(message_lower.split())}")
        
        # Greeting patterns
        greeting_patterns = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
        if any(pattern in message_lower for pattern in greeting_patterns) and len(message_lower.split()) <= 3:
            print(f"✅ DEBUG: Detected GREETING intent")
            return "greeting"
        
        # Day plan patterns
        day_plan_patterns = ['plan my', 'itinerary', 'schedule', 'day by day', 'daily plan', 'what should i do']
        if any(pattern in message_lower for pattern in day_plan_patterns):
            print(f"✅ DEBUG: Detected DAY_PLAN intent")
            return "day_plan"
        
        # Restaurant patterns
        restaurant_patterns = ['restaurant', 'food', 'eat', 'dining', 'lunch', 'dinner', 'breakfast', 'cuisine']
        if any(pattern in message_lower for pattern in restaurant_patterns):
            print(f"✅ DEBUG: Detected RESTAURANTS intent")
            return "restaurants"
        
        # Activity patterns
        activity_patterns = ['activities', 'things to do', 'attractions', 'visit', 'see', 'explore', 'fun']
        if any(pattern in message_lower for pattern in activity_patterns):
            print(f"✅ DEBUG: Detected ACTIVITIES intent")
            return "activities"
        
        # Packing patterns
        packing_patterns = ['pack', 'bring', 'what to wear', 'clothes', 'luggage']
        if any(pattern in message_lower for pattern in packing_patterns):
            print(f"✅ DEBUG: Detected PACKING intent")
            return "packing"
        
        # Question patterns
        question_patterns = ['?', 'what', 'where', 'when', 'how', 'why', 'is', 'are', 'can', 'should']
        if any(pattern in message_lower for pattern in question_patterns):
            print(f"✅ DEBUG: Detected QUESTION intent")
            return "question"
        
        # Default to day_plan if unclear
        print(f"✅ DEBUG: Detected DAY_PLAN intent (default)")
        return "day_plan"
    
    def _is_followup_question(self, user_message: str, conversation_history: List[Dict[str, str]] = None) -> bool:
        """Detect if this is a follow-up question based on context clues and conversation history"""
        if not conversation_history or len(conversation_history) == 0:
            return False
        
        message_lower = user_message.lower().strip()
        
        # Follow-up indicators
        followup_indicators = [
            'more about', 'tell me more', 'more details', 'more info',
            'what about', 'how about', 'tell me about that',
            'it', 'this', 'that', 'these', 'those', 'them',
            'the first', 'the second', 'the third', 'number',
            'other options', 'alternatives', 'something else'
        ]
        
        has_followup_indicator = any(indicator in message_lower for indicator in followup_indicators)
        
        # Also check if message is short and vague (likely a follow-up)
        is_short_and_vague = len(message_lower.split()) <= 8 and (
            'more' in message_lower or 
            'about' in message_lower or
            any(word in message_lower for word in ['it', 'this', 'that', 'these'])
        )
        
        return has_followup_indicator or is_short_and_vague
    
    async def _handle_followup_question(
        self, 
        booking: BookingContext, 
        preferences: UserPreferences, 
        user_message: str,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Handle follow-up questions using conversation context"""
        context = self._build_context_string(booking, preferences)
        
        # Build conversation context string
        recent_conversation = "\n".join([
            f"{msg['role'].upper()}: {msg['content'][:200]}" 
            for msg in conversation_history[-6:]  # Last 6 messages (3 exchanges)
        ])
        
        system_prompt = """You are a friendly AI travel concierge assistant.
The user is asking a follow-up question about something from the previous conversation.
Use the conversation history to understand what they're referring to and provide a helpful, detailed answer.

If they're asking about a specific item or place mentioned earlier, provide detailed information about it.
Keep responses conversational but informative (2-4 paragraphs).
"""
        
        query = f"""
        Travel Context: {context}
        
        Recent Conversation:
        {recent_conversation}
        
        User's follow-up question: {user_message}
        
        Provide a detailed, helpful answer that references the conversation context.
        """
        
        messages = [
            SystemMessage(content=system_prompt),
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
    
    def _build_context_string(self, booking: BookingContext, preferences: UserPreferences) -> str:
        """Build context string for the agent"""
        context = f"""
        BOOKING CONTEXT:
        - Location: {booking.location}
        - Dates: {booking.check_in_date} to {booking.check_out_date}
        - Party: {booking.party_type} ({booking.party_size} people)
        
        PREFERENCES:
        - Budget: {preferences.budget_tier}
        - Interests: {', '.join(preferences.interests)}
        - Mobility needs: {', '.join(preferences.mobility_needs)}
        - Dietary restrictions: {', '.join(preferences.dietary_restrictions)}
        - Special requirements: {preferences.special_requirements or 'None'}
        """
        return context
    
    async def _handle_greeting(self, booking: BookingContext, preferences: UserPreferences) -> Dict[str, Any]:
        """Handle greeting messages"""
        response = f"""Hello! 👋 I'm your AI travel assistant for your trip to {booking.location}!

I can help you with:
• 📅 **Day-by-day itinerary** - Plan your activities for each day
• 🍽️ **Restaurant recommendations** - Find great places to eat
• 🎯 **Activity suggestions** - Discover things to do
• 🎒 **Packing checklist** - Know what to bring

Your trip is from {booking.check_in_date} to {booking.check_out_date} for {booking.party_size} {booking.party_type}.

What would you like help with?"""
        
        return {
            "agent_response": response,
            "day_by_day_plan": [],
            "activity_cards": [],
            "restaurant_recommendations": [],
            "packing_checklist": []
        }
    
    async def _generate_full_itinerary(self, booking: BookingContext, preferences: UserPreferences, user_message: str) -> Dict[str, Any]:
        """Generate a complete day-by-day itinerary"""
        try:
            # Calculate dates
            check_in = datetime.strptime(str(booking.check_in_date), "%Y-%m-%d").date()
            check_out = datetime.strptime(str(booking.check_out_date), "%Y-%m-%d").date()
            booking_dates = (check_in, check_out)
            
            # Get activities from Tavily using simplified approach
            activities = await self._get_activities_simple(booking.location, preferences)
            
            # Get restaurants
            restaurants = await self._get_restaurants_simple(booking.location, preferences)
            
            # Get local events
            events = await self._get_events_simple(booking.location, booking_dates)
            
            # Create simple day-by-day itinerary
            day_plans = self._create_simple_itinerary(
                check_in,
                check_out,
                activities,
                restaurants
            )
            
            # Generate packing checklist
            packing_checklist = self._generate_simple_packing(
                booking.location,
                (check_in, check_out)
            )
            
            # Generate AI summary
            summary = await self._generate_itinerary_summary(booking, day_plans, restaurants, packing_checklist)
            
            return {
                "agent_response": summary,
                "day_by_day_plan": [self._serialize_day_plan(day) for day in day_plans],
                "activity_cards": [self._serialize_activity(act) for act in activities[:10]],
                "restaurant_recommendations": [self._serialize_restaurant(rest) for rest in restaurants[:8]],
                "packing_checklist": [self._serialize_packing_item(item) for item in packing_checklist]
            }
        except Exception as e:
            print(f"Error generating full itinerary: {str(e)}")
            return await self._handle_specific_question(booking, preferences, user_message)
    
    async def _generate_restaurant_recommendations(self, booking: BookingContext, preferences: UserPreferences, user_message: str) -> Dict[str, Any]:
        """Generate restaurant recommendations"""
        try:
            restaurants = await self._get_restaurants_simple(booking.location, preferences)
            
            # Filter by dietary needs if specified
            if preferences.dietary_restrictions:
                restaurants = [r for r in restaurants if any(diet in r.dietary_options for diet in preferences.dietary_restrictions)]
            
            # Generate AI response
            dietary_info = f" with {', '.join(preferences.dietary_restrictions)} options" if preferences.dietary_restrictions else ""
            response = f"""🍽️ **Restaurant Recommendations for {booking.location}**{dietary_info}

I found {len(restaurants)} great restaurants that match your preferences. Here are my top picks:

"""
            for i, rest in enumerate(restaurants[:5], 1):
                response += f"{i}. **{rest.name}** - {rest.cuisine_type or 'Local cuisine'}\n"
                if rest.description:
                    response += f"   {rest.description[:100]}...\n"
                response += f"   Price: {rest.price_tier}\n\n"
            
            response += "Would you like more details about any of these, or shall I help with something else?"
            
            return {
                "agent_response": response,
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [self._serialize_restaurant(r) for r in restaurants[:10]],
                "packing_checklist": []
            }
        except Exception as e:
            print(f"Error generating restaurants: {str(e)}")
            return {
                "agent_response": f"I can help you find restaurants in {booking.location}! What type of cuisine are you interested in?",
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [],
                "packing_checklist": []
            }
    
    async def _generate_activity_recommendations(self, booking: BookingContext, preferences: UserPreferences, user_message: str) -> Dict[str, Any]:
        """Generate activity recommendations"""
        try:
            activities = await self._get_activities_simple(booking.location, preferences)
            
            # Filter by mobility needs
            if preferences.mobility_needs and 'wheelchair' in preferences.mobility_needs:
                activities = [a for a in activities if a.wheelchair_accessible]
            
            response = f"""🎯 **Things to Do in {booking.location}**

I found {len(activities)} amazing activities for you! Here are my top recommendations:

"""
            for i, act in enumerate(activities[:5], 1):
                response += f"{i}. **{act.title}**\n"
                if act.description:
                    response += f"   {act.description[:100]}...\n"
                response += f"   Price: {act.price_tier}"
                if act.duration_hours:
                    response += f" | Duration: {act.duration_hours}h"
                if act.wheelchair_accessible:
                    response += f" | ♿ Wheelchair accessible"
                if act.child_friendly:
                    response += f" | 👶 Child friendly"
                response += "\n\n"
            
            response += "Want to know more about any of these activities?"
            
            return {
                "agent_response": response,
                "day_by_day_plan": [],
                "activity_cards": [self._serialize_activity(a) for a in activities[:15]],
                "restaurant_recommendations": [],
                "packing_checklist": []
            }
        except Exception as e:
            print(f"Error generating activities: {str(e)}")
            return {
                "agent_response": f"I can help you discover activities in {booking.location}! What are you interested in? (e.g., museums, outdoor activities, nightlife)",
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [],
                "packing_checklist": []
            }
    
    async def _generate_packing_checklist(self, booking: BookingContext, preferences: UserPreferences, user_message: str) -> Dict[str, Any]:
        """Generate packing checklist"""
        try:
            check_in = datetime.strptime(str(booking.check_in_date), "%Y-%m-%d").date()
            check_out = datetime.strptime(str(booking.check_out_date), "%Y-%m-%d").date()
            
            packing_list = self._generate_simple_packing(booking.location, (check_in, check_out))
            
            response = f"""🎒 **Packing Checklist for {booking.location}**

Here's what I recommend bringing for your {(check_out - check_in).days}-day trip:

"""
            categories = {}
            for item in packing_list:
                if item.category not in categories:
                    categories[item.category] = []
                categories[item.category].append(item)
            
            for category, items in categories.items():
                response += f"\n**{category.upper()}:**\n"
                for item in items[:5]:
                    marker = "✓" if item.is_essential else "○"
                    response += f"{marker} {item.item_name}\n"
            
            response += "\n✓ = Essential items | ○ = Recommended items"
            
            return {
                "agent_response": response,
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [],
                "packing_checklist": [self._serialize_packing_item(p) for p in packing_list]
            }
        except Exception as e:
            print(f"Error generating packing list: {str(e)}")
            return {
                "agent_response": f"For your trip to {booking.location}, I recommend packing comfortable walking shoes, weather-appropriate clothing, and any personal essentials. Would you like a detailed packing list?",
                "day_by_day_plan": [],
                "activity_cards": [],
                "restaurant_recommendations": [],
                "packing_checklist": []
            }
    
    async def _handle_specific_question(
        self, 
        booking: BookingContext, 
        preferences: UserPreferences, 
        user_message: str,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Handle specific questions conversationally with context"""
        context = self._build_context_string(booking, preferences)
        
        # Build conversation context if available
        recent_conversation = ""
        if conversation_history and len(conversation_history) > 0:
            recent_conversation = "\n\nRecent Conversation:\n" + "\n".join([
                f"{msg['role'].upper()}: {msg['content'][:150]}" 
                for msg in conversation_history[-4:]  # Last 4 messages
            ])
        
        system_prompt = """You are a friendly AI travel concierge assistant.

Answer the user's question in a helpful, conversational way. Keep responses concise (2-3 paragraphs max).
If they ask about specific recommendations, offer to provide detailed lists.
Use the conversation history to provide contextual answers."""
        
        query = f"""
        Travel Context: {context}
        {recent_conversation}
        
        User asks: {user_message}
        
        Provide a helpful answer.
        """
        
        messages = [
            SystemMessage(content=system_prompt),
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
    
    async def _generate_itinerary_summary(self, booking: BookingContext, day_plans: List[DayPlan], restaurants: List, packing: List) -> str:
        """Generate a natural language summary of the itinerary"""
        num_days = len(day_plans)
        
        summary = f"""📅 **Your {num_days}-Day {booking.location} Itinerary**

I've created a personalized itinerary for your trip! Here's an overview:

"""
        for i, day in enumerate(day_plans[:3], 1):  # Show first 3 days
            date_str = day.date.strftime("%B %d")
            summary += f"**Day {i} ({date_str}):**\n"
            if day.morning:
                summary += f"• Morning: {day.morning.title}\n"
            if day.afternoon:
                summary += f"• Afternoon: {day.afternoon.title}\n"
            if day.evening:
                summary += f"• Evening: {day.evening.title}\n"
            summary += "\n"
        
        if num_days > 3:
            summary += f"...and {num_days - 3} more days!\n\n"
        
        summary += f"🍽️ I've also found {len(restaurants)} restaurants and created a packing checklist for you.\n\n"
        summary += "Scroll down to see all the details, or ask me anything about your trip!"
        
        return summary
    
    def _serialize_day_plan(self, day: DayPlan) -> Dict:
        """Serialize DayPlan to dict"""
        return {
            "day_number": day.day_number,
            "date": str(day.date),
            "morning": self._serialize_activity(day.morning) if day.morning else None,
            "afternoon": self._serialize_activity(day.afternoon) if day.afternoon else None,
            "evening": self._serialize_activity(day.evening) if day.evening else None,
            "restaurants": [self._serialize_restaurant(r) for r in day.restaurants],
            "events": day.events,
            "notes": day.notes
        }
    
    def _serialize_activity(self, activity: ActivityCard) -> Dict:
        """Serialize ActivityCard to dict"""
        return {
            "id": activity.id,
            "title": activity.title,
            "description": activity.description,
            "address": activity.address,
            "latitude": activity.latitude,
            "longitude": activity.longitude,
            "price_tier": activity.price_tier,
            "duration_hours": activity.duration_hours,
            "tags": activity.tags,
            "wheelchair_accessible": activity.wheelchair_accessible,
            "child_friendly": activity.child_friendly
        }
    
    def _serialize_restaurant(self, restaurant: RestaurantRecommendation) -> Dict:
        """Serialize RestaurantRecommendation to dict"""
        return {
            "id": restaurant.id,
            "name": restaurant.name,
            "description": restaurant.description,
            "address": restaurant.address,
            "latitude": restaurant.latitude,
            "longitude": restaurant.longitude,
            "price_tier": restaurant.price_tier,
            "cuisine_type": restaurant.cuisine_type,
            "dietary_options": restaurant.dietary_options,
            "wheelchair_accessible": restaurant.wheelchair_accessible,
            "child_friendly": restaurant.child_friendly,
            "rating": restaurant.rating
        }
    
    def _serialize_packing_item(self, item: PackingItem) -> Dict:
        """Serialize PackingItem to dict"""
        return {
            "item_name": item.item_name,
            "category": item.category,
            "is_essential": item.is_essential,
            "weather_dependent": item.weather_dependent
        }

# Global instance
simple_travel_agent = SimpleTravelConciergeAgent()
