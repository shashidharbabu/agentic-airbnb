from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Activity, Restaurant, LocalEvent, UserPreferences, Booking
from app.schemas import ActivityCard, RestaurantRecommendation, PackingItem, PriceTier, BudgetTier
from app.services.tavily_service import tavily_service
import random
from datetime import date, timedelta

class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_activity_recommendations(self, 
                                         location: str,
                                         preferences: UserPreferences,
                                         booking_dates: tuple,
                                         limit: int = 10) -> List[ActivityCard]:
        """Get personalized activity recommendations"""
        try:
            # Get activities from database
            db_activities = self._get_db_activities(location, preferences)
            
            # Get activities from Tavily search
            tavily_activities = await self._get_tavily_activities(location, preferences)
            
            # Combine and filter activities
            all_activities = db_activities + tavily_activities
            
            # Apply filters
            filtered_activities = self._filter_activities(all_activities, preferences)
            
            # Score and rank activities
            scored_activities = self._score_activities(filtered_activities, preferences)
            
            # Return top recommendations
            return scored_activities[:limit]
            
        except Exception as e:
            print(f"Error getting activity recommendations: {str(e)}")
            return []
    
    async def get_restaurant_recommendations(self,
                                           location: str,
                                           preferences: UserPreferences,
                                           limit: int = 8) -> List[RestaurantRecommendation]:
        """Get personalized restaurant recommendations"""
        try:
            # Get restaurants from database
            db_restaurants = self._get_db_restaurants(location, preferences)
            
            # Get restaurants from Tavily search
            tavily_restaurants = await self._get_tavily_restaurants(location, preferences)
            
            # Combine and filter restaurants
            all_restaurants = db_restaurants + tavily_restaurants
            
            # Apply dietary filters
            filtered_restaurants = self._filter_restaurants(all_restaurants, preferences)
            
            # Score and rank restaurants
            scored_restaurants = self._score_restaurants(filtered_restaurants, preferences)
            
            # Return top recommendations
            return scored_restaurants[:limit]
            
        except Exception as e:
            print(f"Error getting restaurant recommendations: {str(e)}")
            return []
    
    async def get_local_events(self, location: str, booking_dates: tuple) -> List[Dict[str, Any]]:
        """Get local events for the booking dates"""
        try:
            # Get events from database
            db_events = self._get_db_events(location, booking_dates)
            
            # Get events from Tavily search
            tavily_events = await self._get_tavily_events(location, booking_dates)
            
            # Combine events
            all_events = db_events + tavily_events
            
            # Remove duplicates and return
            unique_events = self._deduplicate_events(all_events)
            return unique_events[:6]  # Return top 6 events
            
        except Exception as e:
            print(f"Error getting local events: {str(e)}")
            return []
    
    def generate_packing_checklist(self, 
                                 location: str,
                                 booking_dates: tuple,
                                 activities: List[ActivityCard],
                                 weather_data: Dict[str, Any] = None) -> List[PackingItem]:
        """Generate weather-aware packing checklist"""
        try:
            checklist = []
            
            # Essential items
            checklist.extend(self._get_essential_items())
            
            # Weather-dependent items
            if weather_data:
                checklist.extend(self._get_weather_items(weather_data))
            
            # Activity-specific items
            checklist.extend(self._get_activity_items(activities))
            
            # Location-specific items
            checklist.extend(self._get_location_items(location))
            
            # Remove duplicates
            unique_checklist = self._deduplicate_packing_items(checklist)
            
            return unique_checklist
            
        except Exception as e:
            print(f"Error generating packing checklist: {str(e)}")
            return []
    
    def _get_db_activities(self, location: str, preferences: UserPreferences) -> List[ActivityCard]:
        """Get activities from database"""
        activities = self.db.query(Activity).filter(
            Activity.address.contains(location)
        ).all()
        
        return [self._convert_activity_to_card(activity) for activity in activities]
    
    async def _get_tavily_activities(self, location: str, preferences: UserPreferences) -> List[ActivityCard]:
        """Get activities from Tavily search"""
        try:
            results = await tavily_service.search_local_activities(location, preferences.interests)
            activities = tavily_service.extract_activity_info(results)
            
            return [self._convert_tavily_to_activity_card(activity) for activity in activities]
        except Exception as e:
            print(f"Error getting Tavily activities: {str(e)}")
            return []
    
    def _get_db_restaurants(self, location: str, preferences: UserPreferences) -> List[RestaurantRecommendation]:
        """Get restaurants from database"""
        restaurants = self.db.query(Restaurant).filter(
            Restaurant.address.contains(location)
        ).all()
        
        return [self._convert_restaurant_to_recommendation(restaurant) for restaurant in restaurants]
    
    async def _get_tavily_restaurants(self, location: str, preferences: UserPreferences) -> List[RestaurantRecommendation]:
        """Get restaurants from Tavily search"""
        try:
            results = await tavily_service.search_restaurants(location, preferences.dietary_restrictions)
            restaurants = tavily_service.extract_restaurant_info(results)
            
            return [self._convert_tavily_to_restaurant_recommendation(restaurant) for restaurant in restaurants]
        except Exception as e:
            print(f"Error getting Tavily restaurants: {str(e)}")
            return []
    
    def _get_db_events(self, location: str, booking_dates: tuple) -> List[Dict[str, Any]]:
        """Get events from database"""
        start_date, end_date = booking_dates
        events = self.db.query(LocalEvent).filter(
            LocalEvent.location.contains(location),
            LocalEvent.event_date >= start_date,
            LocalEvent.event_date <= end_date
        ).all()
        
        return [self._convert_event_to_dict(event) for event in events]
    
    async def _get_tavily_events(self, location: str, booking_dates: tuple) -> List[Dict[str, Any]]:
        """Get events from Tavily search"""
        try:
            start_date, end_date = booking_dates
            date_range = f"from {start_date} to {end_date}"
            results = await tavily_service.search_local_events(location, date_range)
            return results
        except Exception as e:
            print(f"Error getting Tavily events: {str(e)}")
            return []
    
    def _filter_activities(self, activities: List[ActivityCard], preferences: UserPreferences) -> List[ActivityCard]:
        """Filter activities based on preferences"""
        filtered = []
        
        for activity in activities:
            # Check mobility needs
            if preferences.mobility_needs and "wheelchair_accessible" in preferences.mobility_needs:
                if not activity.wheelchair_accessible:
                    continue
            
            # Check if child-friendly for family bookings
            if preferences.interests and "family" in preferences.interests:
                if not activity.child_friendly:
                    continue
            
            # Check budget compatibility
            if not self._is_budget_compatible(activity.price_tier, preferences.budget_tier):
                continue
            
            filtered.append(activity)
        
        return filtered
    
    def _filter_restaurants(self, restaurants: List[RestaurantRecommendation], preferences: UserPreferences) -> List[RestaurantRecommendation]:
        """Filter restaurants based on dietary restrictions"""
        filtered = []
        
        for restaurant in restaurants:
            # Check dietary restrictions
            if preferences.dietary_restrictions:
                if not self._matches_dietary_restrictions(restaurant, preferences.dietary_restrictions):
                    continue
            
            # Check budget compatibility
            if not self._is_budget_compatible(restaurant.price_tier, preferences.budget_tier):
                continue
            
            filtered.append(restaurant)
        
        return filtered
    
    def _score_activities(self, activities: List[ActivityCard], preferences: UserPreferences) -> List[ActivityCard]:
        """Score and rank activities"""
        scored = []
        
        for activity in activities:
            score = 0
            
            # Interest matching
            if preferences.interests:
                for interest in preferences.interests:
                    if interest.lower() in activity.tags:
                        score += 2
            
            # Accessibility bonus
            if preferences.mobility_needs and "wheelchair_accessible" in preferences.mobility_needs:
                if activity.wheelchair_accessible:
                    score += 3
            
            # Child-friendly bonus
            if preferences.interests and "family" in preferences.interests:
                if activity.child_friendly:
                    score += 2
            
            # Price tier bonus
            if activity.price_tier == preferences.budget_tier:
                score += 1
            
            activity.score = score
            scored.append(activity)
        
        # Sort by score (descending)
        return sorted(scored, key=lambda x: getattr(x, 'score', 0), reverse=True)
    
    def _score_restaurants(self, restaurants: List[RestaurantRecommendation], preferences: UserPreferences) -> List[RestaurantRecommendation]:
        """Score and rank restaurants"""
        scored = []
        
        for restaurant in restaurants:
            score = 0
            
            # Dietary matching
            if preferences.dietary_restrictions:
                for restriction in preferences.dietary_restrictions:
                    if restriction.lower() in restaurant.dietary_options:
                        score += 3
            
            # Accessibility bonus
            if preferences.mobility_needs and "wheelchair_accessible" in preferences.mobility_needs:
                if restaurant.wheelchair_accessible:
                    score += 2
            
            # Child-friendly bonus
            if preferences.interests and "family" in preferences.interests:
                if restaurant.child_friendly:
                    score += 2
            
            # Rating bonus
            if restaurant.rating and restaurant.rating >= 4.0:
                score += 1
            
            restaurant.score = score
            scored.append(restaurant)
        
        # Sort by score (descending)
        return sorted(scored, key=lambda x: getattr(x, 'score', 0), reverse=True)
    
    def _is_budget_compatible(self, item_price_tier: str, user_budget_tier: str) -> bool:
        """Check if item price tier is compatible with user budget"""
        price_hierarchy = {
            "free": 0,
            "budget": 1,
            "mid-range": 2,
            "luxury": 3
        }
        
        user_level = price_hierarchy.get(user_budget_tier, 1)
        item_level = price_hierarchy.get(item_price_tier, 1)
        
        # Allow items at or below user's budget level
        return item_level <= user_level
    
    def _matches_dietary_restrictions(self, restaurant: RestaurantRecommendation, restrictions: List[str]) -> bool:
        """Check if restaurant matches dietary restrictions"""
        if not restaurant.dietary_options:
            return False
        
        restaurant_options = [opt.lower() for opt in restaurant.dietary_options]
        user_restrictions = [restriction.lower() for restriction in restrictions]
        
        # Check if any user restriction is satisfied
        return any(restriction in restaurant_options for restriction in user_restrictions)
    
    def _get_essential_items(self) -> List[PackingItem]:
        """Get essential packing items"""
        return [
            PackingItem(item_name="Travel documents (ID, passport, tickets)", category="documents", is_essential=True),
            PackingItem(item_name="Money and credit cards", category="documents", is_essential=True),
            PackingItem(item_name="Phone and charger", category="electronics", is_essential=True),
            PackingItem(item_name="Comfortable walking shoes", category="clothing", is_essential=True),
            PackingItem(item_name="Weather-appropriate clothing", category="clothing", is_essential=True),
            PackingItem(item_name="Toiletries", category="toiletries", is_essential=True)
        ]
    
    def _get_weather_items(self, weather_data: Dict[str, Any]) -> List[PackingItem]:
        """Get weather-dependent packing items"""
        items = []
        
        if "rain" in weather_data.get("conditions", "").lower():
            items.append(PackingItem(item_name="Umbrella or rain jacket", category="clothing", weather_dependent=True))
        
        if weather_data.get("temperature_low", 0) < 10:
            items.append(PackingItem(item_name="Warm jacket or sweater", category="clothing", weather_dependent=True))
        
        if weather_data.get("temperature_high", 0) > 25:
            items.append(PackingItem(item_name="Sunscreen and hat", category="toiletries", weather_dependent=True))
        
        return items
    
    def _get_activity_items(self, activities: List[ActivityCard]) -> List[PackingItem]:
        """Get activity-specific packing items"""
        items = []
        
        for activity in activities:
            if "outdoor" in activity.tags:
                items.append(PackingItem(item_name="Outdoor gear (hiking boots, backpack)", category="clothing"))
            
            if "beach" in activity.tags or "water" in activity.tags:
                items.append(PackingItem(item_name="Swimsuit and towel", category="clothing"))
            
            if "museum" in activity.tags or "culture" in activity.tags:
                items.append(PackingItem(item_name="Camera for photos", category="electronics"))
        
        return items
    
    def _get_location_items(self, location: str) -> List[PackingItem]:
        """Get location-specific packing items"""
        items = []
        
        if "beach" in location.lower() or "coastal" in location.lower():
            items.append(PackingItem(item_name="Beach essentials (sunscreen, towel, swimsuit)", category="clothing"))
        
        if "mountain" in location.lower() or "hiking" in location.lower():
            items.append(PackingItem(item_name="Hiking gear (boots, backpack, water bottle)", category="clothing"))
        
        return items
    
    def _deduplicate_packing_items(self, items: List[PackingItem]) -> List[PackingItem]:
        """Remove duplicate packing items"""
        seen = set()
        unique_items = []
        
        for item in items:
            if item.item_name not in seen:
                seen.add(item.item_name)
                unique_items.append(item)
        
        return unique_items
    
    def _deduplicate_events(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate events"""
        seen = set()
        unique_events = []
        
        for event in events:
            event_key = event.get("title", "")
            if event_key not in seen:
                seen.add(event_key)
                unique_events.append(event)
        
        return unique_events
    
    # Conversion methods
    def _convert_activity_to_card(self, activity: Activity) -> ActivityCard:
        """Convert database Activity to ActivityCard"""
        return ActivityCard(
            id=activity.id,
            title=activity.title,
            description=activity.description,
            address=activity.address,
            latitude=float(activity.latitude) if activity.latitude else None,
            longitude=float(activity.longitude) if activity.longitude else None,
            price_tier=activity.price_tier,
            duration_hours=float(activity.duration_hours) if activity.duration_hours else None,
            tags=activity.tags or [],
            wheelchair_accessible=activity.wheelchair_accessible,
            child_friendly=activity.child_friendly
        )
    
    def _convert_tavily_to_activity_card(self, tavily_activity: Dict[str, Any]) -> ActivityCard:
        """Convert Tavily search result to ActivityCard"""
        return ActivityCard(
            id=0,  # External source
            title=tavily_activity.get("title", ""),
            description=tavily_activity.get("description", ""),
            address="",  # Not available from Tavily
            price_tier=PriceTier.MID_RANGE,  # Default
            tags=[],  # Would need to be extracted
            wheelchair_accessible=False,  # Would need to be determined
            child_friendly=False  # Would need to be determined
        )
    
    def _convert_restaurant_to_recommendation(self, restaurant: Restaurant) -> RestaurantRecommendation:
        """Convert database Restaurant to RestaurantRecommendation"""
        return RestaurantRecommendation(
            id=restaurant.id,
            name=restaurant.name,
            description=restaurant.description,
            address=restaurant.address,
            latitude=float(restaurant.latitude) if restaurant.latitude else None,
            longitude=float(restaurant.longitude) if restaurant.longitude else None,
            price_tier=restaurant.price_tier,
            cuisine_type=restaurant.cuisine_type,
            dietary_options=restaurant.dietary_options or [],
            wheelchair_accessible=restaurant.wheelchair_accessible,
            child_friendly=restaurant.child_friendly,
            rating=float(restaurant.rating) if restaurant.rating else None
        )
    
    def _convert_tavily_to_restaurant_recommendation(self, tavily_restaurant: Dict[str, Any]) -> RestaurantRecommendation:
        """Convert Tavily search result to RestaurantRecommendation"""
        return RestaurantRecommendation(
            id=0,  # External source
            name=tavily_restaurant.get("name", ""),
            description=tavily_restaurant.get("description", ""),
            address="",  # Not available from Tavily
            price_tier=PriceTier.MID_RANGE,  # Default
            cuisine_type="",  # Would need to be extracted
            dietary_options=[],  # Would need to be extracted
            wheelchair_accessible=False,  # Would need to be determined
            child_friendly=False  # Would need to be determined
        )
    
    def _convert_event_to_dict(self, event: LocalEvent) -> Dict[str, Any]:
        """Convert database LocalEvent to dictionary"""
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat(),
            "start_time": event.start_time.isoformat() if event.start_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "location": event.location,
            "price_tier": event.price_tier,
            "event_type": event.event_type,
            "tags": event.tags or []
        }
