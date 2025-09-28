from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, PromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from langchain.chains import LLMChain
from langchain.agents import Tool, AgentExecutor, create_react_agent
from langchain.memory import ConversationBufferMemory
from typing import Dict, List, Any, Optional
from app.config import settings
from app.services.tavily_service import tavily_service
from app.schemas import BookingContext, UserPreferences, ConciergeRequest
import json
import re

class TravelConciergeAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            openai_api_key=settings.OPENAI_API_KEY
        )
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        self._setup_tools()
        self._setup_agent()
    
    def _setup_tools(self):
        """Setup tools for the agent"""
        self.tools = [
            Tool(
                name="search_activities",
                description="Search for local activities and attractions in a specific location",
                func=self._search_activities_tool
            ),
            Tool(
                name="search_restaurants",
                description="Search for restaurants with dietary restrictions and preferences",
                func=self._search_restaurants_tool
            ),
            Tool(
                name="search_events",
                description="Search for local events and happenings",
                func=self._search_events_tool
            ),
            Tool(
                name="search_weather",
                description="Get weather information for the location",
                func=self._search_weather_tool
            ),
            Tool(
                name="generate_packing_list",
                description="Generate a packing checklist based on weather and activities",
                func=self._generate_packing_list_tool
            )
        ]
    
    def _setup_agent(self):
        """Setup the ReAct agent"""
        from langchain.prompts import PromptTemplate
        
        prompt = PromptTemplate(
            template=self._get_system_prompt() + "\n\n{input}\n\n{agent_scratchpad}",
            input_variables=["input", "agent_scratchpad", "tools", "tool_names"]
        )
        
        self.agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True
        )
    
    def _get_system_prompt(self) -> str:
        return """You are a professional travel concierge AI assistant for Airbnb guests. 
        Your role is to create personalized travel itineraries based on booking context, user preferences, and local information.
        
        Key capabilities:
        1. Understand natural language travel requests
        2. Search for local activities, restaurants, and events
        3. Consider dietary restrictions, mobility needs, and accessibility
        4. Generate weather-aware packing lists
        5. Create day-by-day itineraries with morning/afternoon/evening blocks
        
        Always consider:
        - User's budget tier and preferences
        - Dietary restrictions and mobility needs
        - Family-friendly options when appropriate
        - Weather conditions for the travel dates
        - Local events and seasonal activities
        
        Provide detailed, actionable recommendations with addresses, prices, and accessibility information.
        
        You have access to the following tools: {tools}
        Tool names: {tool_names}
        
        Use the following format:
        Question: the input question you must answer
        Thought: you should always think about what to do
        Action: the action to take, should be one of [{tool_names}]
        Action Input: the input to the action
        Observation: the result of the action
        ... (this Thought/Action/Action Input/Observation can repeat N times)
        Thought: I now know the final answer
        Final Answer: the final answer to the original input question"""
    
    async def process_concierge_request(self, request: ConciergeRequest) -> Dict[str, Any]:
        """Process a concierge request and return recommendations"""
        try:
            # Extract context from request
            booking = request.booking_context
            preferences = request.preferences
            user_message = request.user_message or ""
            
            # Create context string
            context = self._build_context_string(booking, preferences)
            
            # Process with agent
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
        
        response = await self.agent_executor.ainvoke({"input": query})
        return self._parse_agent_response(response)
    
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
        
        response = await self.agent_executor.ainvoke({"input": query})
        return self._parse_agent_response(response)
    
    def _parse_agent_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Parse agent response into structured format"""
        # This would parse the agent's response and structure it
        # For now, return a basic structure
        return {
            "agent_response": response.get("output", ""),
            "day_by_day_plan": [],
            "activity_cards": [],
            "restaurant_recommendations": [],
            "packing_checklist": [],
            "weather_summary": {},
            "local_events": []
        }
    
    # Tool functions
    async def _search_activities_tool(self, query: str) -> str:
        """Tool for searching activities"""
        try:
            # Extract location from query
            location = self._extract_location_from_query(query)
            interests = self._extract_interests_from_query(query)
            
            results = await tavily_service.search_local_activities(location, interests)
            activities = tavily_service.extract_activity_info(results)
            
            return json.dumps(activities[:5])  # Return top 5
        except Exception as e:
            return f"Error searching activities: {str(e)}"
    
    async def _search_restaurants_tool(self, query: str) -> str:
        """Tool for searching restaurants"""
        try:
            location = self._extract_location_from_query(query)
            dietary_restrictions = self._extract_dietary_from_query(query)
            
            results = await tavily_service.search_restaurants(location, dietary_restrictions)
            restaurants = tavily_service.extract_restaurant_info(results)
            
            return json.dumps(restaurants[:5])  # Return top 5
        except Exception as e:
            return f"Error searching restaurants: {str(e)}"
    
    async def _search_events_tool(self, query: str) -> str:
        """Tool for searching events"""
        try:
            location = self._extract_location_from_query(query)
            results = await tavily_service.search_local_events(location)
            return json.dumps(results[:3])  # Return top 3
        except Exception as e:
            return f"Error searching events: {str(e)}"
    
    async def _search_weather_tool(self, query: str) -> str:
        """Tool for searching weather"""
        try:
            location = self._extract_location_from_query(query)
            results = await tavily_service.search_weather_info(location)
            return json.dumps(results)
        except Exception as e:
            return f"Error searching weather: {str(e)}"
    
    async def _generate_packing_list_tool(self, query: str) -> str:
        """Tool for generating packing list"""
        try:
            # This would analyze weather and activities to generate packing list
            packing_items = [
                {"item": "Weather-appropriate clothing", "category": "clothing", "essential": True},
                {"item": "Comfortable walking shoes", "category": "clothing", "essential": True},
                {"item": "Travel documents", "category": "documents", "essential": True},
                {"item": "Camera/phone charger", "category": "electronics", "essential": False}
            ]
            return json.dumps(packing_items)
        except Exception as e:
            return f"Error generating packing list: {str(e)}"
    
    def _extract_location_from_query(self, query: str) -> str:
        """Extract location from query"""
        # Simple extraction - in real implementation, use NER
        words = query.lower().split()
        location_keywords = ['in', 'at', 'near', 'around']
        for i, word in enumerate(words):
            if word in location_keywords and i + 1 < len(words):
                return ' '.join(words[i+1:i+3])  # Take next 1-2 words
        return "unknown location"
    
    def _extract_interests_from_query(self, query: str) -> List[str]:
        """Extract interests from query"""
        interests = []
        interest_keywords = {
            'outdoor': ['hiking', 'nature', 'outdoor', 'park', 'beach'],
            'culture': ['museum', 'art', 'culture', 'history', 'gallery'],
            'food': ['food', 'restaurant', 'cuisine', 'dining'],
            'nightlife': ['nightlife', 'bar', 'club', 'entertainment']
        }
        
        query_lower = query.lower()
        for interest, keywords in interest_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                interests.append(interest)
        
        return interests
    
    def _extract_dietary_from_query(self, query: str) -> List[str]:
        """Extract dietary restrictions from query"""
        dietary = []
        dietary_keywords = {
            'vegan': ['vegan', 'plant-based'],
            'vegetarian': ['vegetarian', 'veg'],
            'gluten-free': ['gluten-free', 'gluten free', 'celiac'],
            'halal': ['halal', 'muslim'],
            'kosher': ['kosher', 'jewish']
        }
        
        query_lower = query.lower()
        for restriction, keywords in dietary_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                dietary.append(restriction)
        
        return dietary

# Global instance
travel_agent = TravelConciergeAgent()
