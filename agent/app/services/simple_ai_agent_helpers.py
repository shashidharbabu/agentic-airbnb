# Helper functions for SimpleTravelConciergeAgent
# These provide simplified implementations until full services are integrated

from typing import List, Dict, Any
from app.schemas import ActivityCard, RestaurantRecommendation, PackingItem, DayPlan, PriceTier, PackingCategory
from datetime import date, timedelta
import random

async def get_activities_simple(location: str, preferences) -> List[ActivityCard]:
    """Simplified activity generation using Tavily"""
    activities = []
    
    # Sample activities (in real implementation, would use Tavily)
    sample_activities = [
        {"title": f"Explore {location} Downtown", "description": "Walking tour of the city center", "price": "free", "duration": 2.5, "tags": ["walking", "sightseeing"], "wheelchair": True, "child": True},
        {"title": f"{location} Museum Tour", "description": "Visit local museums and galleries", "price": "mid-range", "duration": 3, "tags": ["culture", "indoor"], "wheelchair": True, "child": True},
        {"title": "Local Food Market", "description": "Experience local cuisine and culture", "price": "budget", "duration": 2, "tags": ["food", "culture"], "wheelchair": True, "child": True},
        {"title": "Scenic Viewpoint", "description": "Best views of the city", "price": "free", "duration": 1.5, "tags": ["nature", "photography"], "wheelchair": False, "child": True},
        {"title": "Historical Landmark Tour", "description": "Discover the city's history", "price": "mid-range", "duration": 2.5, "tags": ["history", "culture"], "wheelchair": True, "child": True},
    ]
    
    for i, act in enumerate(sample_activities):
        activities.append(ActivityCard(
            id=i + 1,
            title=act["title"],
            description=act["description"],
            address=f"{location}",
            price_tier=act["price"],
            duration_hours=act["duration"],
            tags=act["tags"],
            wheelchair_accessible=act["wheelchair"],
            child_friendly=act["child"]
        ))
    
    return activities

async def get_restaurants_simple(location: str, preferences) -> List[RestaurantRecommendation]:
    """Simplified restaurant generation"""
    restaurants = []
    
    sample_restaurants = [
        {"name": f"The Local Bistro", "cuisine": "Local", "price": "mid-range", "dietary": ["vegetarian"], "rating": 4.5},
        {"name": f"{location} Grill", "cuisine": "American", "price": "mid-range", "dietary": ["gluten-free"], "rating": 4.3},
        {"name": "Garden Cafe", "cuisine": "Vegetarian", "price": "budget", "dietary": ["vegetarian", "vegan"], "rating": 4.7},
        {"name": "Seafood Palace", "cuisine": "Seafood", "price": "luxury", "dietary": ["gluten-free"], "rating": 4.8},
        {"name": "Street Food Market", "cuisine": "International", "price": "budget", "dietary": ["vegetarian", "vegan", "gluten-free"], "rating": 4.4},
    ]
    
    for i, rest in enumerate(sample_restaurants):
        restaurants.append(RestaurantRecommendation(
            id=i + 1,
            name=rest["name"],
            description=f"Popular {rest['cuisine']} restaurant in {location}",
            address=f"{location} Downtown",
            price_tier=rest["price"],
            cuisine_type=rest["cuisine"],
            dietary_options=rest["dietary"],
            wheelchair_accessible=True,
            child_friendly=True,
            rating=rest["rating"]
        ))
    
    return restaurants

async def get_events_simple(location: str, booking_dates: tuple) -> List[Dict[str, Any]]:
    """Simplified events generation"""
    events = [
        {"name": f"{location} Cultural Festival", "date": booking_dates[0], "description": "Local cultural celebration"},
        {"name": "Weekend Market", "date": booking_dates[0] + timedelta(days=1), "description": "Artisan goods and local food"},
    ]
    return events

def create_simple_itinerary(check_in: date, check_out: date, activities: List, restaurants: List) -> List[DayPlan]:
    """Create a simple day-by-day itinerary"""
    days = []
    current_date = check_in
    day_num = 1
    
    while current_date <= check_out:
        # Rotate through activities
        morning_idx = (day_num - 1) * 3 % len(activities)
        afternoon_idx = ((day_num - 1) * 3 + 1) % len(activities)
        evening_idx = ((day_num - 1) * 3 + 2) % len(activities)
        
        day_restaurants = restaurants[((day_num - 1) * 2) % len(restaurants):((day_num - 1) * 2 + 2) % len(restaurants) + 1]
        
        days.append(DayPlan(
            day_number=day_num,
            date=current_date,
            morning=activities[morning_idx] if morning_idx < len(activities) else None,
            afternoon=activities[afternoon_idx] if afternoon_idx < len(activities) else None,
            evening=activities[evening_idx] if evening_idx < len(activities) else None,
            restaurants=day_restaurants[:2] if day_restaurants else [],
            events=[],
            notes=f"Enjoy day {day_num} in {current_date.strftime('%B %d')}!"
        ))
        
        current_date += timedelta(days=1)
        day_num += 1
    
    return days

def generate_simple_packing(location: str, dates: tuple) -> List[PackingItem]:
    """Generate a simple packing checklist"""
    num_days = (dates[1] - dates[0]).days
    
    items = [
        # Clothing
        PackingItem(item_name=f"{num_days + 1} sets of clothing", category=PackingCategory.CLOTHING, is_essential=True, weather_dependent=True),
        PackingItem(item_name="Comfortable walking shoes", category=PackingCategory.CLOTHING, is_essential=True, weather_dependent=False),
        PackingItem(item_name="Light jacket", category=PackingCategory.CLOTHING, is_essential=False, weather_dependent=True),
        PackingItem(item_name="Sunglasses", category=PackingCategory.CLOTHING, is_essential=False, weather_dependent=True),
        
        # Toiletries
        PackingItem(item_name="Toothbrush & toothpaste", category=PackingCategory.TOILETRIES, is_essential=True, weather_dependent=False),
        PackingItem(item_name="Shampoo & soap", category=PackingCategory.TOILETRIES, is_essential=True, weather_dependent=False),
        PackingItem(item_name="Sunscreen", category=PackingCategory.TOILETRIES, is_essential=False, weather_dependent=True),
        
        # Electronics
        PackingItem(item_name="Phone charger", category=PackingCategory.ELECTRONICS, is_essential=True, weather_dependent=False),
        PackingItem(item_name="Camera", category=PackingCategory.ELECTRONICS, is_essential=False, weather_dependent=False),
        
        # Documents
        PackingItem(item_name="ID/Passport", category=PackingCategory.DOCUMENTS, is_essential=True, weather_dependent=False),
        PackingItem(item_name="Booking confirmations", category=PackingCategory.DOCUMENTS, is_essential=True, weather_dependent=False),
        
        # Other
        PackingItem(item_name="Reusable water bottle", category=PackingCategory.OTHER, is_essential=False, weather_dependent=False),
        PackingItem(item_name="Day backpack", category=PackingCategory.OTHER, is_essential=False, weather_dependent=False),
    ]
    
    return items

