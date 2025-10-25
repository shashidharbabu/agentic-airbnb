import os
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
from typing import List, Dict, Any
from datetime import datetime, date, timedelta
import json

from models import (
    AIAgentRequest, AIAgentResponse, DayPlan, ActivityCard, 
    RestaurantRecommendation, PackingChecklist, PackingItem,
    TimeBlock, PriceTier, WeatherData, LocalEvent
)
from tavily_service import TavilyService
from database import DatabaseManager

class AIAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            api_key=os.getenv('OPENAI_API_KEY')
        )
        self.tavily = TavilyService()
        self.db = DatabaseManager()
    
    async def generate_travel_plan(self, request: AIAgentRequest) -> AIAgentResponse:
        weather_data = self.tavily.search_weather(
            request.booking_context.location,
            (request.booking_context.check_in, request.booking_context.check_out)
        )
        
        local_events = self.tavily.search_local_events(
            request.booking_context.location,
            (request.booking_context.check_in, request.booking_context.check_out)
        )
        
        activities = self.tavily.search_activities(
            request.booking_context.location,
            request.preferences.interests,
            request.preferences.mobility_needs
        )
        
        restaurants = self.tavily.search_restaurants(
            request.booking_context.location,
            request.preferences.dietary_restrictions
        )
        
        packing_tips = self.tavily.search_packing_tips(
            request.booking_context.location,
            (request.booking_context.check_in, request.booking_context.check_out),
            request.preferences.interests
        )
        
        day_plans = await self._generate_day_plans(
            request.booking_context,
            request.preferences,
            activities,
            weather_data,
            local_events
        )
        
        restaurant_recommendations = self._filter_restaurants(restaurants, request.preferences)
        
        packing_checklist = self._generate_packing_checklist(
            request.booking_context,
            request.preferences,
            weather_data,
            packing_tips
        )
        
        conversation_history = request.conversation_history.copy()
        if request.user_query:
            conversation_history.append({"role": "user", "content": request.user_query})
        
        ai_response = await self._generate_ai_response(request, day_plans, restaurant_recommendations)
        conversation_history.append({"role": "assistant", "content": ai_response})
        
        return AIAgentResponse(
            day_plans=day_plans,
            restaurant_recommendations=restaurant_recommendations,
            packing_checklist=packing_checklist,
            conversation_history=conversation_history,
            generated_at=datetime.now(),
            additional_tips=self._generate_additional_tips(request, weather_data)
        )
    
    async def _generate_day_plans(
        self, 
        booking_context, 
        preferences, 
        activities: List[ActivityCard],
        weather_data: List[WeatherData],
        local_events: List[LocalEvent]
    ) -> List[DayPlan]:
        system_prompt = f"""
        You are a professional travel planner. Create detailed day-by-day itineraries for a trip to {booking_context.location}.
        
        Trip Details:
        - Dates: {booking_context.check_in} to {booking_context.check_out}
        - Party Type: {booking_context.party_type}
        - Guest Count: {booking_context.guest_count}
        - Interests: {', '.join(preferences.interests) if preferences.interests else 'General sightseeing'}
        - Mobility Needs: {preferences.mobility_needs}
        - Children: {preferences.children_count}
        
        Available Activities:
        {self._format_activities_for_ai(activities)}
        
        Local Events:
        {self._format_events_for_ai(local_events)}
        
        Weather Information:
        {self._format_weather_for_ai(weather_data)}
        
        Create a detailed itinerary with morning, afternoon, and evening blocks for each day.
        Consider the weather, accessibility needs, and family-friendly options.
        Return the response in JSON format with this structure:
        {{
            "day_plans": [
                {{
                    "date": "YYYY-MM-DD",
                    "time_blocks": {{
                        "morning": [{{"title": "...", "description": "...", "duration": 2.0, "price_tier": "moderate"}}],
                        "afternoon": [...],
                        "evening": [...]
                    }},
                    "weather_forecast": {{"temperature": 25, "condition": "sunny"}},
                    "notes": "Additional tips for this day"
                }}
            ]
        }}
        """
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content="Please create a detailed travel itinerary for this trip.")
        ]
        
        response = await self.llm.ainvoke(messages)
        
        try:
            ai_data = json.loads(response.content)
            day_plans = []
            
            for day_data in ai_data.get('day_plans', []):
                time_blocks = {}
                for time_block, activities_data in day_data.get('time_blocks', {}).items():
                    activity_cards = []
                    for activity in activities_data:
                        activity_cards.append(ActivityCard(
                            title=activity.get('title', ''),
                            address=booking_context.location,
                            price_tier=activity.get('price_tier', 'moderate'),
                            duration_hours=activity.get('duration', 2.0),
                            description=activity.get('description', ''),
                            tags=activity.get('tags', [])
                        ))
                    time_blocks[TimeBlock(time_block)] = activity_cards
                
                day_plan = DayPlan(
                    date=datetime.strptime(day_data['date'], '%Y-%m-%d').date(),
                    time_blocks=time_blocks,
                    weather_forecast=day_data.get('weather_forecast', {}),
                    notes=day_data.get('notes', '')
                )
                day_plans.append(day_plan)
            
            return day_plans
            
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            return self._create_basic_day_plans(booking_context, activities)
    
    def _filter_restaurants(self, restaurants: List[RestaurantRecommendation], preferences) -> List[RestaurantRecommendation]:
        filtered = []
        
        for restaurant in restaurants:
            if preferences.dietary_restrictions:
                has_accommodation = any(
                    restriction in restaurant.dietary_accommodations 
                    for restriction in preferences.dietary_restrictions
                )
                if not has_accommodation and preferences.dietary_restrictions != ['none']:
                    continue
            
            if preferences.children_count > 0 and not self._is_restaurant_child_friendly(restaurant):
                continue
            
            filtered.append(restaurant)
        
        return filtered[:6]  
    
    def _generate_packing_checklist(
        self, 
        booking_context, 
        preferences, 
        weather_data: List[WeatherData],
        packing_tips: List[str]
    ) -> PackingChecklist:
        
        basic_items = [
            PackingItem(item="Passport/ID", category="Documents", essential=True),
            PackingItem(item="Travel documents", category="Documents", essential=True),
            PackingItem(item="Phone charger", category="Electronics", essential=True),
            PackingItem(item="Underwear", category="Clothing", essential=True),
            PackingItem(item="Socks", category="Clothing", essential=True),
            PackingItem(item="Toiletries", category="Personal Care", essential=True),
        ]
        
        weather_items = []
        if weather_data:
            avg_temp = sum(w.temperature for w in weather_data) / len(weather_data)
            condition = weather_data[0].condition.lower()
            
            if avg_temp < 10:
                weather_items.extend([
                    PackingItem(item="Warm jacket", category="Clothing", weather_dependent=True),
                    PackingItem(item="Gloves", category="Accessories", weather_dependent=True),
                    PackingItem(item="Scarf", category="Accessories", weather_dependent=True),
                ])
            elif avg_temp > 25:
                weather_items.extend([
                    PackingItem(item="Sunscreen", category="Personal Care", weather_dependent=True),
                    PackingItem(item="Hat", category="Accessories", weather_dependent=True),
                    PackingItem(item="Light clothing", category="Clothing", weather_dependent=True),
                ])
            
            if 'rain' in condition:
                weather_items.append(
                    PackingItem(item="Umbrella", category="Accessories", weather_dependent=True)
                )
        
        activity_items = []
        if 'outdoor' in preferences.interests:
            activity_items.extend([
                PackingItem(item="Hiking boots", category="Footwear"),
                PackingItem(item="Backpack", category="Equipment"),
            ])
        
        if 'culture' in preferences.interests:
            activity_items.append(
                PackingItem(item="Comfortable walking shoes", category="Footwear")
            )
        
        family_items = []
        if preferences.children_count > 0:
            family_items.extend([
                PackingItem(item="Children's medications", category="Health", essential=True),
                PackingItem(item="Snacks", category="Food", essential=True),
                PackingItem(item="Entertainment for kids", category="Entertainment"),
            ])
        
        all_items = basic_items + weather_items + activity_items + family_items
        
        for tip in packing_tips[:5]:  
            if tip.strip():
                all_items.append(
                    PackingItem(
                        item=tip.strip(),
                        category="Tips",
                        reason="Based on local recommendations"
                    )
                )
        
        trip_duration = (booking_context.check_out - booking_context.check_in).days
        
        return PackingChecklist(
            items=all_items,
            weather_aware=True,
            trip_duration_days=trip_duration,
            destination_climate=weather_data[0].condition if weather_data else "Unknown"
        )
    
    async def _generate_ai_response(self, request, day_plans, restaurants) -> str:
        
        if request.user_query:
            system_prompt = f"""
            You are a helpful travel assistant. The user is planning a trip to {request.booking_context.location} 
            from {request.booking_context.check_in} to {request.booking_context.check_out}.
            
            Current itinerary includes {len(day_plans)} days of activities and {len(restaurants)} restaurant recommendations.
            
            Respond to the user's question: "{request.user_query}"
            
            Be helpful, specific, and provide actionable advice.
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=request.user_query)
            ]
            
            response = await self.llm.ainvoke(messages)
            return response.content
        else:
            return f"I've created a personalized travel plan for your {len(day_plans)}-day trip to {request.booking_context.location}! The itinerary includes daily activities, restaurant recommendations, and a weather-aware packing checklist."
    
    def _generate_additional_tips(self, request, weather_data) -> List[str]:
        tips = []
        
        if weather_data:
            avg_temp = sum(w.temperature for w in weather_data) / len(weather_data)
            if avg_temp > 25:
                tips.append("Stay hydrated and use sunscreen - it's going to be warm!")
            elif avg_temp < 10:
                tips.append("Pack warm layers - temperatures will be cool.")
        
        if request.preferences.children_count > 0:
            tips.append("Consider booking family-friendly activities in advance.")
        
        if request.preferences.mobility_needs == "wheelchair_accessible":
            tips.append("I've prioritized wheelchair-accessible venues in your itinerary.")
        
        if request.preferences.dietary_restrictions:
            tips.append(f"Restaurant recommendations are filtered for your dietary needs: {', '.join(request.preferences.dietary_restrictions)}")
        
        return tips
    
    def _format_activities_for_ai(self, activities: List[ActivityCard]) -> str:
        if not activities:
            return "No specific activities found."
        
        formatted = []
        for activity in activities[:10]:  
            formatted.append(f"- {activity.title}: {activity.description} (Duration: {activity.duration_hours}h, Price: {activity.price_tier})")
        
        return "\n".join(formatted)
    
    def _format_events_for_ai(self, events: List[LocalEvent]) -> str:
        """Format events for AI prompt"""
        if not events:
            return "No local events found."
        
        formatted = []
        for event in events[:5]:  
            formatted.append(f"- {event.title} on {event.date}: {event.description}")
        
        return "\n".join(formatted)
    
    def _format_weather_for_ai(self, weather_data: List[WeatherData]) -> str:
        if not weather_data:
            return "No weather data available."
        
        formatted = []
        for weather in weather_data:
            formatted.append(f"- {weather.condition}, {weather.temperature}°C, {weather.description}")
        
        return "\n".join(formatted)
    
    def _create_basic_day_plans(self, booking_context, activities: List[ActivityCard]) -> List[DayPlan]:
        day_plans = []
        current_date = booking_context.check_in
        
        while current_date < booking_context.check_out:
            day_activities = activities[len(day_plans) * 3:(len(day_plans) + 1) * 3]
            
            time_blocks = {
                TimeBlock.MORNING: day_activities[:1] if day_activities else [],
                TimeBlock.AFTERNOON: day_activities[1:2] if len(day_activities) > 1 else [],
                TimeBlock.EVENING: day_activities[2:3] if len(day_activities) > 2 else []
            }
            
            day_plan = DayPlan(
                date=current_date,
                time_blocks=time_blocks,
                notes=f"Day {len(day_plans) + 1} in {booking_context.location}"
            )
            
            day_plans.append(day_plan)
            current_date += timedelta(days=1)
        
        return day_plans
    
    def _is_restaurant_child_friendly(self, restaurant: RestaurantRecommendation) -> bool:
        child_keywords = ['family', 'kid', 'child', 'playground', 'high chair']
        content = f"{restaurant.name} {restaurant.description}".lower()
        return any(keyword in content for keyword in child_keywords)
