"""
Sample data creation script for Agent Airbnb
This script creates comprehensive test data for the AI concierge system.
"""

from sqlalchemy.orm import Session
from app.database_sqlite import SessionLocal, engine
from app.models import Base, User, Booking, UserPreferences, Activity, Restaurant, LocalEvent, WeatherData
from app.schemas import PartyType, BudgetTier, PriceTier
from datetime import date, time, datetime, timedelta
from decimal import Decimal
import random

def create_sample_data():
    """Create comprehensive sample data for testing"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create sample users
        users = create_sample_users(db)
        
        # Create sample bookings
        bookings = create_sample_bookings(db, users)
        
        # Create sample preferences
        preferences = create_sample_preferences(db, bookings)
        
        # Create sample activities
        activities = create_sample_activities(db)
        
        # Create sample restaurants
        restaurants = create_sample_restaurants(db)
        
        # Create sample events
        events = create_sample_events(db)
        
        # Create sample weather data
        weather_data = create_sample_weather_data(db)
        
        print("✅ Sample data created successfully!")
        print(f"Created {len(users)} users")
        print(f"Created {len(bookings)} bookings")
        print(f"Created {len(preferences)} preferences")
        print(f"Created {len(activities)} activities")
        print(f"Created {len(restaurants)} restaurants")
        print(f"Created {len(events)} events")
        print(f"Created {len(weather_data)} weather records")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
    finally:
        db.close()

def create_sample_users(db: Session):
    """Create sample users"""
    users_data = [
        {"email": "john.doe@email.com", "name": "John Doe"},
        {"email": "jane.smith@email.com", "name": "Jane Smith"},
        {"email": "mike.wilson@email.com", "name": "Mike Wilson"},
        {"email": "sarah.johnson@email.com", "name": "Sarah Johnson"},
        {"email": "david.brown@email.com", "name": "David Brown"},
        {"email": "lisa.garcia@email.com", "name": "Lisa Garcia"},
        {"email": "robert.miller@email.com", "name": "Robert Miller"},
        {"email": "emily.davis@email.com", "name": "Emily Davis"},
        {"email": "james.rodriguez@email.com", "name": "James Rodriguez"},
        {"email": "jennifer.martinez@email.com", "name": "Jennifer Martinez"}
    ]
    
    users = []
    for user_data in users_data:
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    return users

def create_sample_bookings(db: Session, users):
    """Create sample bookings"""
    locations = [
        "Paris, France",
        "Tokyo, Japan",
        "New York, USA",
        "London, UK",
        "Rome, Italy",
        "Barcelona, Spain",
        "Amsterdam, Netherlands",
        "Sydney, Australia",
        "San Francisco, USA",
        "Berlin, Germany"
    ]
    
    bookings = []
    for i, user in enumerate(users):
        # Create 1-3 bookings per user
        num_bookings = random.randint(1, 3)
        
        for j in range(num_bookings):
            start_date = date.today() + timedelta(days=random.randint(1, 30))
            end_date = start_date + timedelta(days=random.randint(2, 7))
            
            booking = Booking(
                user_id=user.id,
                check_in_date=start_date,
                check_out_date=end_date,
                location=random.choice(locations),
                latitude=Decimal(str(random.uniform(-90, 90))),
                longitude=Decimal(str(random.uniform(-180, 180))),
                party_type=random.choice(list(PartyType)),
                party_size=random.randint(1, 6),
                created_at=datetime.now()
            )
            db.add(booking)
            bookings.append(booking)
    
    db.commit()
    return bookings

def create_sample_preferences(db: Session, bookings):
    """Create sample user preferences"""
    interests_options = [
        ["outdoor", "culture", "food"],
        ["art", "history", "nightlife"],
        ["nature", "photography", "adventure"],
        ["music", "theater", "dining"],
        ["sports", "fitness", "wellness"],
        ["shopping", "fashion", "beauty"],
        ["technology", "science", "innovation"],
        ["family", "children", "education"]
    ]
    
    mobility_needs_options = [
        [],
        ["wheelchair_accessible"],
        ["no_stairs"],
        ["elevator_access"],
        ["wheelchair_accessible", "no_stairs"]
    ]
    
    dietary_restrictions_options = [
        [],
        ["vegan"],
        ["vegetarian"],
        ["gluten_free"],
        ["halal"],
        ["kosher"],
        ["vegan", "gluten_free"],
        ["vegetarian", "dairy_free"]
    ]
    
    preferences = []
    for booking in bookings:
        preference = UserPreferences(
            booking_id=booking.id,
            budget_tier=random.choice(list(BudgetTier)),
            interests=random.choice(interests_options),
            mobility_needs=random.choice(mobility_needs_options),
            dietary_restrictions=random.choice(dietary_restrictions_options),
            special_requirements=random.choice([
                None,
                "Need quiet accommodation",
                "Pet-friendly required",
                "Business trip - need WiFi",
                "Anniversary celebration",
                "First time visiting",
                "Senior citizen - slower pace"
            ]),
            created_at=datetime.now()
        )
        db.add(preference)
        preferences.append(preference)
    
    db.commit()
    return preferences

def create_sample_activities(db: Session):
    """Create sample activities"""
    activities_data = [
        # Paris activities
        {"title": "Eiffel Tower Visit", "location": "Paris", "price_tier": "mid-range", "tags": ["sightseeing", "culture"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Louvre Museum Tour", "location": "Paris", "price_tier": "mid-range", "tags": ["culture", "art", "museum"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Seine River Cruise", "location": "Paris", "price_tier": "luxury", "tags": ["sightseeing", "romantic"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Montmartre Walking Tour", "location": "Paris", "price_tier": "budget", "tags": ["culture", "outdoor"], "wheelchair_accessible": False, "child_friendly": True},
        
        # Tokyo activities
        {"title": "Senso-ji Temple", "location": "Tokyo", "price_tier": "free", "tags": ["culture", "spiritual"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Tokyo Skytree", "location": "Tokyo", "price_tier": "mid-range", "tags": ["sightseeing", "modern"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Tsukiji Fish Market", "location": "Tokyo", "price_tier": "budget", "tags": ["food", "culture"], "wheelchair_accessible": False, "child_friendly": True},
        {"title": "Shibuya Crossing", "location": "Tokyo", "price_tier": "free", "tags": ["sightseeing", "urban"], "wheelchair_accessible": True, "child_friendly": True},
        
        # New York activities
        {"title": "Central Park", "location": "New York", "price_tier": "free", "tags": ["outdoor", "nature"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Statue of Liberty", "location": "New York", "price_tier": "mid-range", "tags": ["sightseeing", "history"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Broadway Show", "location": "New York", "price_tier": "luxury", "tags": ["entertainment", "culture"], "wheelchair_accessible": True, "child_friendly": False},
        {"title": "High Line Park", "location": "New York", "price_tier": "free", "tags": ["outdoor", "urban"], "wheelchair_accessible": True, "child_friendly": True},
        
        # London activities
        {"title": "British Museum", "location": "London", "price_tier": "free", "tags": ["culture", "museum", "history"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Tower of London", "location": "London", "price_tier": "mid-range", "tags": ["history", "culture"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Thames River Walk", "location": "London", "price_tier": "free", "tags": ["outdoor", "sightseeing"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "West End Show", "location": "London", "price_tier": "luxury", "tags": ["entertainment", "culture"], "wheelchair_accessible": True, "child_friendly": False},
        
        # Rome activities
        {"title": "Colosseum Tour", "location": "Rome", "price_tier": "mid-range", "tags": ["history", "culture"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Vatican Museums", "location": "Rome", "price_tier": "mid-range", "tags": ["culture", "art", "spiritual"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Trevi Fountain", "location": "Rome", "price_tier": "free", "tags": ["sightseeing", "culture"], "wheelchair_accessible": True, "child_friendly": True},
        {"title": "Roman Forum", "location": "Rome", "price_tier": "mid-range", "tags": ["history", "culture"], "wheelchair_accessible": True, "child_friendly": True}
    ]
    
    activities = []
    for activity_data in activities_data:
        activity = Activity(
            title=activity_data["title"],
            description=f"Experience {activity_data['title']} in {activity_data['location']}",
            address=f"Various locations in {activity_data['location']}",
            latitude=Decimal(str(random.uniform(-90, 90))),
            longitude=Decimal(str(random.uniform(-180, 180))),
            price_tier=activity_data["price_tier"],
            duration_hours=Decimal(str(random.uniform(1, 4))),
            tags=activity_data["tags"],
            wheelchair_accessible=activity_data["wheelchair_accessible"],
            child_friendly=activity_data["child_friendly"],
            created_at=datetime.now()
        )
        db.add(activity)
        activities.append(activity)
    
    db.commit()
    return activities

def create_sample_restaurants(db: Session):
    """Create sample restaurants"""
    restaurants_data = [
        # Paris restaurants
        {"name": "Le Comptoir du Relais", "location": "Paris", "cuisine": "French", "price_tier": "upscale", "dietary": ["vegetarian"], "wheelchair_accessible": True, "child_friendly": True},
        {"name": "L'As du Fallafel", "location": "Paris", "cuisine": "Middle Eastern", "price_tier": "budget", "dietary": ["vegan", "vegetarian"], "wheelchair_accessible": False, "child_friendly": True},
        {"name": "Le Jules Verne", "location": "Paris", "cuisine": "French", "price_tier": "fine_dining", "dietary": ["vegetarian"], "wheelchair_accessible": True, "child_friendly": False},
        
        # Tokyo restaurants
        {"name": "Sukiyabashi Jiro", "location": "Tokyo", "cuisine": "Japanese", "price_tier": "fine_dining", "dietary": [], "wheelchair_accessible": False, "child_friendly": False},
        {"name": "Tsukiji Outer Market", "location": "Tokyo", "cuisine": "Japanese", "price_tier": "budget", "dietary": [], "wheelchair_accessible": False, "child_friendly": True},
        {"name": "Tofuya Ukai", "location": "Tokyo", "cuisine": "Japanese", "price_tier": "upscale", "dietary": ["vegetarian", "vegan"], "wheelchair_accessible": True, "child_friendly": True},
        
        # New York restaurants
        {"name": "Eleven Madison Park", "location": "New York", "cuisine": "American", "price_tier": "fine_dining", "dietary": ["vegetarian", "vegan"], "wheelchair_accessible": True, "child_friendly": False},
        {"name": "Joe's Pizza", "location": "New York", "cuisine": "Italian", "price_tier": "budget", "dietary": ["vegetarian"], "wheelchair_accessible": True, "child_friendly": True},
        {"name": "Katz's Delicatessen", "location": "New York", "cuisine": "Jewish", "price_tier": "mid-range", "dietary": [], "wheelchair_accessible": True, "child_friendly": True},
        
        # London restaurants
        {"name": "The Ledbury", "location": "London", "cuisine": "British", "price_tier": "fine_dining", "dietary": ["vegetarian"], "wheelchair_accessible": True, "child_friendly": False},
        {"name": "Borough Market", "location": "London", "cuisine": "International", "price_tier": "budget", "dietary": ["vegetarian", "vegan"], "wheelchair_accessible": True, "child_friendly": True},
        {"name": "Dishoom", "location": "London", "cuisine": "Indian", "price_tier": "mid-range", "dietary": ["vegetarian", "vegan"], "wheelchair_accessible": True, "child_friendly": True},
        
        # Rome restaurants
        {"name": "La Pergola", "location": "Rome", "cuisine": "Italian", "price_tier": "fine_dining", "dietary": ["vegetarian"], "wheelchair_accessible": True, "child_friendly": False},
        {"name": "Roscioli", "location": "Rome", "cuisine": "Italian", "price_tier": "upscale", "dietary": ["vegetarian"], "wheelchair_accessible": True, "child_friendly": True},
        {"name": "Pizzeria da Baffetto", "location": "Rome", "cuisine": "Italian", "price_tier": "budget", "dietary": ["vegetarian"], "wheelchair_accessible": False, "child_friendly": True}
    ]
    
    restaurants = []
    for restaurant_data in restaurants_data:
        restaurant = Restaurant(
            name=restaurant_data["name"],
            description=f"Excellent {restaurant_data['cuisine']} cuisine in {restaurant_data['location']}",
            address=f"Various locations in {restaurant_data['location']}",
            latitude=Decimal(str(random.uniform(-90, 90))),
            longitude=Decimal(str(random.uniform(-180, 180))),
            price_tier=restaurant_data["price_tier"],
            cuisine_type=restaurant_data["cuisine"],
            dietary_options=restaurant_data["dietary"],
            wheelchair_accessible=restaurant_data["wheelchair_accessible"],
            child_friendly=restaurant_data["child_friendly"],
            rating=Decimal(str(random.uniform(3.5, 5.0))),
            created_at=datetime.now()
        )
        db.add(restaurant)
        restaurants.append(restaurant)
    
    db.commit()
    return restaurants

def create_sample_events(db: Session):
    """Create sample local events"""
    events_data = [
        {"title": "Paris Fashion Week", "location": "Paris", "event_type": "Fashion", "price_tier": "luxury"},
        {"title": "Tokyo Cherry Blossom Festival", "location": "Tokyo", "event_type": "Cultural", "price_tier": "free"},
        {"title": "New York Food Festival", "location": "New York", "event_type": "Food", "price_tier": "mid-range"},
        {"title": "London Theatre Festival", "location": "London", "event_type": "Entertainment", "price_tier": "luxury"},
        {"title": "Rome Historical Tour", "location": "Rome", "event_type": "Cultural", "price_tier": "budget"},
        {"title": "Barcelona Music Festival", "location": "Barcelona", "event_type": "Music", "price_tier": "mid-range"},
        {"title": "Amsterdam Tulip Festival", "location": "Amsterdam", "event_type": "Cultural", "price_tier": "free"},
        {"title": "Sydney Opera House Concert", "location": "Sydney", "event_type": "Music", "price_tier": "luxury"},
        {"title": "San Francisco Tech Conference", "location": "San Francisco", "event_type": "Technology", "price_tier": "mid-range"},
        {"title": "Berlin Art Exhibition", "location": "Berlin", "event_type": "Art", "price_tier": "budget"}
    ]
    
    events = []
    for event_data in events_data:
        event_date = date.today() + timedelta(days=random.randint(1, 30))
        start_time = time(hour=random.randint(9, 18), minute=0)
        end_time = time(hour=start_time.hour + random.randint(2, 4), minute=0)
        
        event = LocalEvent(
            title=event_data["title"],
            description=f"Join us for {event_data['title']} in {event_data['location']}",
            event_date=event_date,
            start_time=start_time,
            end_time=end_time,
            location=f"Various venues in {event_data['location']}",
            latitude=Decimal(str(random.uniform(-90, 90))),
            longitude=Decimal(str(random.uniform(-180, 180))),
            price_tier=event_data["price_tier"],
            event_type=event_data["event_type"],
            tags=[event_data["event_type"].lower(), "local"],
            created_at=datetime.now()
        )
        db.add(event)
        events.append(event)
    
    db.commit()
    return events

def create_sample_weather_data(db: Session):
    """Create sample weather data"""
    locations = ["Paris", "Tokyo", "New York", "London", "Rome", "Barcelona", "Amsterdam", "Sydney", "San Francisco", "Berlin"]
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Snowy", "Foggy"]
    
    weather_records = []
    for location in locations:
        for i in range(7):  # 7 days of weather data
            weather_date = date.today() + timedelta(days=i)
            
            weather = WeatherData(
                location=location,
                date=weather_date,
                temperature_high=random.randint(15, 35),
                temperature_low=random.randint(-5, 20),
                conditions=random.choice(conditions),
                precipitation_chance=random.randint(0, 100),
                wind_speed=random.randint(0, 30),
                created_at=datetime.now()
            )
            db.add(weather)
            weather_records.append(weather)
    
    db.commit()
    return weather_records

if __name__ == "__main__":
    create_sample_data()
