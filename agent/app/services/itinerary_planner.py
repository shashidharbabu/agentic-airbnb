from typing import List, Dict, Any, Tuple
from datetime import date, timedelta
from app.schemas import DayPlan, ActivityCard, RestaurantRecommendation, TimeBlock
from app.services.recommendation_engine import RecommendationEngine
import random

class ItineraryPlanner:
    def __init__(self, recommendation_engine: RecommendationEngine):
        self.recommendation_engine = recommendation_engine
    
    async def create_day_by_day_itinerary(self,
                                        location: str,
                                        booking_dates: Tuple[date, date],
                                        preferences,
                                        activities: List[ActivityCard],
                                        restaurants: List[RestaurantRecommendation],
                                        events: List[Dict[str, Any]]) -> List[DayPlan]:
        """Create a comprehensive day-by-day itinerary"""
        try:
            start_date, end_date = booking_dates
            days = []
            current_date = start_date
            
            while current_date <= end_date:
                day_plan = await self._create_single_day_plan(
                    current_date,
                    location,
                    preferences,
                    activities,
                    restaurants,
                    events
                )
                days.append(day_plan)
                current_date += timedelta(days=1)
            
            return days
            
        except Exception as e:
            print(f"Error creating itinerary: {str(e)}")
            return []
    
    async def _create_single_day_plan(self,
                                    day_date: date,
                                    location: str,
                                    preferences,
                                    activities: List[ActivityCard],
                                    restaurants: List[RestaurantRecommendation],
                                    events: List[Dict[str, Any]]) -> DayPlan:
        """Create a plan for a single day"""
        try:
            # Get day-specific events
            day_events = self._get_events_for_date(events, day_date)
            
            # Select activities for each time block
            morning_activity = self._select_activity_for_time_block(
                activities, TimeBlock.MORNING, preferences, day_events
            )
            afternoon_activity = self._select_activity_for_time_block(
                activities, TimeBlock.AFTERNOON, preferences, day_events
            )
            evening_activity = self._select_activity_for_time_block(
                activities, TimeBlock.EVENING, preferences, day_events
            )
            
            # Select restaurants for the day
            day_restaurants = self._select_restaurants_for_day(
                restaurants, preferences, [morning_activity, afternoon_activity, evening_activity]
            )
            
            # Create notes
            notes = self._generate_day_notes(
                morning_activity, afternoon_activity, evening_activity, day_events
            )
            
            return DayPlan(
                day_number=self._get_day_number(day_date),
                date=day_date,
                morning=morning_activity,
                afternoon=afternoon_activity,
                evening=evening_activity,
                restaurants=day_restaurants,
                events=day_events,
                notes=notes
            )
            
        except Exception as e:
            print(f"Error creating single day plan: {str(e)}")
            return DayPlan(
                day_number=1,
                date=day_date,
                notes=f"Error creating plan: {str(e)}"
            )
    
    def _get_events_for_date(self, events: List[Dict[str, Any]], target_date: date) -> List[Dict[str, Any]]:
        """Get events happening on a specific date"""
        day_events = []
        
        for event in events:
            event_date_str = event.get("event_date", "")
            if event_date_str:
                try:
                    event_date = date.fromisoformat(event_date_str)
                    if event_date == target_date:
                        day_events.append(event)
                except ValueError:
                    continue
        
        return day_events
    
    def _select_activity_for_time_block(self,
                                      activities: List[ActivityCard],
                                      time_block: TimeBlock,
                                      preferences,
                                      day_events: List[Dict[str, Any]]) -> ActivityCard:
        """Select an appropriate activity for a specific time block"""
        try:
            # Filter activities suitable for the time block
            suitable_activities = self._filter_activities_by_time_block(activities, time_block)
            
            # If there are day events, prioritize them
            if day_events and time_block in [TimeBlock.MORNING, TimeBlock.AFTERNOON]:
                event_activity = self._create_activity_from_event(day_events[0])
                if event_activity:
                    return event_activity
            
            # Select from available activities
            if suitable_activities:
                # Score activities based on preferences
                scored_activities = self._score_activities_for_selection(suitable_activities, preferences)
                return scored_activities[0] if scored_activities else suitable_activities[0]
            
            # Return a default activity if none found
            return self._create_default_activity(time_block)
            
        except Exception as e:
            print(f"Error selecting activity for {time_block}: {str(e)}")
            return self._create_default_activity(time_block)
    
    def _filter_activities_by_time_block(self, activities: List[ActivityCard], time_block: TimeBlock) -> List[ActivityCard]:
        """Filter activities based on time block appropriateness"""
        suitable = []
        
        for activity in activities:
            # Morning activities (9 AM - 12 PM)
            if time_block == TimeBlock.MORNING:
                if any(tag in activity.tags for tag in ["outdoor", "museum", "culture", "sightseeing"]):
                    suitable.append(activity)
            
            # Afternoon activities (1 PM - 5 PM)
            elif time_block == TimeBlock.AFTERNOON:
                if any(tag in activity.tags for tag in ["outdoor", "shopping", "culture", "entertainment"]):
                    suitable.append(activity)
            
            # Evening activities (6 PM - 10 PM)
            elif time_block == TimeBlock.EVENING:
                if any(tag in activity.tags for tag in ["nightlife", "entertainment", "dining", "culture"]):
                    suitable.append(activity)
        
        return suitable
    
    def _create_activity_from_event(self, event: Dict[str, Any]) -> ActivityCard:
        """Create an activity card from an event"""
        return ActivityCard(
            id=event.get("id", 0),
            title=event.get("title", "Local Event"),
            description=event.get("description", ""),
            address=event.get("location", ""),
            price_tier=event.get("price_tier", "free"),
            tags=event.get("tags", []),
            wheelchair_accessible=False,  # Would need to be determined
            child_friendly=False  # Would need to be determined
        )
    
    def _score_activities_for_selection(self, activities: List[ActivityCard], preferences) -> List[ActivityCard]:
        """Score activities for selection based on preferences"""
        scored = []
        
        for activity in activities:
            score = 0
            
            # Interest matching
            if preferences.interests:
                for interest in preferences.interests:
                    if interest.lower() in [tag.lower() for tag in activity.tags]:
                        score += 3
            
            # Accessibility bonus
            if preferences.mobility_needs and "wheelchair_accessible" in preferences.mobility_needs:
                if activity.wheelchair_accessible:
                    score += 2
            
            # Child-friendly bonus
            if preferences.interests and "family" in preferences.interests:
                if activity.child_friendly:
                    score += 2
            
            # Duration consideration
            if activity.duration_hours:
                if 2 <= activity.duration_hours <= 4:  # Optimal duration
                    score += 1
            
            activity.score = score
            scored.append(activity)
        
        # Sort by score (descending)
        return sorted(scored, key=lambda x: getattr(x, 'score', 0), reverse=True)
    
    def _create_default_activity(self, time_block: TimeBlock) -> ActivityCard:
        """Create a default activity if none are available"""
        default_activities = {
            TimeBlock.MORNING: ActivityCard(
                id=0,
                title="Explore the local area",
                description="Take a leisurely walk around the neighborhood to get oriented",
                price_tier="free",
                tags=["outdoor", "sightseeing"]
            ),
            TimeBlock.AFTERNOON: ActivityCard(
                id=0,
                title="Visit local attractions",
                description="Check out popular spots in the area",
                price_tier="mid-range",
                tags=["culture", "sightseeing"]
            ),
            TimeBlock.EVENING: ActivityCard(
                id=0,
                title="Enjoy local dining",
                description="Experience the local food scene",
                price_tier="mid-range",
                tags=["dining", "culture"]
            )
        }
        
        return default_activities.get(time_block, default_activities[TimeBlock.MORNING])
    
    def _select_restaurants_for_day(self,
                                   restaurants: List[RestaurantRecommendation],
                                   preferences,
                                   day_activities: List[ActivityCard]) -> List[RestaurantRecommendation]:
        """Select appropriate restaurants for the day"""
        try:
            # Filter restaurants based on preferences
            suitable_restaurants = self._filter_restaurants_for_day(restaurants, preferences)
            
            # Select 2-3 restaurants for the day
            selected = []
            
            # Morning/breakfast restaurant
            breakfast_options = [r for r in suitable_restaurants if "breakfast" in r.cuisine_type.lower() or "cafe" in r.name.lower()]
            if breakfast_options:
                selected.append(random.choice(breakfast_options))
            
            # Lunch restaurant
            lunch_options = [r for r in suitable_restaurants if r not in selected]
            if lunch_options:
                selected.append(random.choice(lunch_options))
            
            # Dinner restaurant
            dinner_options = [r for r in suitable_restaurants if r not in selected]
            if dinner_options:
                selected.append(random.choice(dinner_options))
            
            return selected[:3]  # Return up to 3 restaurants
            
        except Exception as e:
            print(f"Error selecting restaurants: {str(e)}")
            return []
    
    def _filter_restaurants_for_day(self, restaurants: List[RestaurantRecommendation], preferences) -> List[RestaurantRecommendation]:
        """Filter restaurants for the day based on preferences"""
        filtered = []
        
        for restaurant in restaurants:
            # Check dietary restrictions
            if preferences.dietary_restrictions:
                if not self._matches_dietary_restrictions(restaurant, preferences.dietary_restrictions):
                    continue
            
            # Check accessibility
            if preferences.mobility_needs and "wheelchair_accessible" in preferences.mobility_needs:
                if not restaurant.wheelchair_accessible:
                    continue
            
            # Check child-friendliness
            if preferences.interests and "family" in preferences.interests:
                if not restaurant.child_friendly:
                    continue
            
            filtered.append(restaurant)
        
        return filtered
    
    def _matches_dietary_restrictions(self, restaurant: RestaurantRecommendation, restrictions: List[str]) -> bool:
        """Check if restaurant matches dietary restrictions"""
        if not restaurant.dietary_options:
            return len(restrictions) == 0  # No restrictions to match
        
        restaurant_options = [opt.lower() for opt in restaurant.dietary_options]
        user_restrictions = [restriction.lower() for restriction in restrictions]
        
        return any(restriction in restaurant_options for restriction in user_restrictions)
    
    def _generate_day_notes(self,
                          morning_activity: ActivityCard,
                          afternoon_activity: ActivityCard,
                          evening_activity: ActivityCard,
                          day_events: List[Dict[str, Any]]) -> str:
        """Generate helpful notes for the day"""
        notes = []
        
        # Activity notes
        if morning_activity:
            notes.append(f"Morning: {morning_activity.title}")
            if morning_activity.duration_hours:
                notes.append(f"Duration: {morning_activity.duration_hours} hours")
        
        if afternoon_activity:
            notes.append(f"Afternoon: {afternoon_activity.title}")
            if afternoon_activity.duration_hours:
                notes.append(f"Duration: {afternoon_activity.duration_hours} hours")
        
        if evening_activity:
            notes.append(f"Evening: {evening_activity.title}")
            if evening_activity.duration_hours:
                notes.append(f"Duration: {evening_activity.duration_hours} hours")
        
        # Event notes
        if day_events:
            notes.append("Special events today:")
            for event in day_events:
                notes.append(f"- {event.get('title', 'Event')}")
        
        return "\n".join(notes)
    
    def _get_day_number(self, target_date: date) -> int:
        """Get the day number for the itinerary"""
        # This would be calculated based on the booking start date
        # For now, return 1
        return 1
