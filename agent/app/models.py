from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, Boolean, Numeric, Enum, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class PartyType(str, enum.Enum):
    SOLO = "solo"
    COUPLE = "couple"
    FAMILY = "family"
    GROUP = "group"
    BUSINESS = "business"

class BudgetTier(str, enum.Enum):
    BUDGET = "budget"
    MID_RANGE = "mid-range"
    LUXURY = "luxury"

class PriceTier(str, enum.Enum):
    FREE = "free"
    BUDGET = "budget"
    MID_RANGE = "mid-range"
    LUXURY = "luxury"

class TimeBlock(str, enum.Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"

class PackingCategory(str, enum.Enum):
    CLOTHING = "clothing"
    TOILETRIES = "toiletries"
    ELECTRONICS = "electronics"
    DOCUMENTS = "documents"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    # Relationships
    bookings = relationship("Booking", back_populates="user")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    party_type = Column(Enum(PartyType), nullable=False)
    party_size = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    preferences = relationship("UserPreferences", back_populates="booking", uselist=False)
    itineraries = relationship("Itinerary", back_populates="booking")
    packing_checklists = relationship("PackingChecklist", back_populates="booking")
    conversations = relationship("AgentConversation", back_populates="booking")

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    budget_tier = Column(Enum(BudgetTier), nullable=False)
    interests = Column(JSON)
    mobility_needs = Column(JSON)
    dietary_restrictions = Column(JSON)
    special_requirements = Column(Text)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="preferences")

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    address = Column(String(500))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    price_tier = Column(Enum(PriceTier), nullable=False)
    duration_hours = Column(Numeric(3, 1))
    tags = Column(JSON)
    wheelchair_accessible = Column(Boolean, default=False)
    child_friendly = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    itineraries = relationship("Itinerary", back_populates="activity")

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    address = Column(String(500))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    price_tier = Column(Enum(PriceTier), nullable=False)
    cuisine_type = Column(String(100))
    dietary_options = Column(JSON)
    wheelchair_accessible = Column(Boolean, default=False)
    child_friendly = Column(Boolean, default=False)
    rating = Column(Numeric(2, 1))
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    itineraries = relationship("Itinerary", back_populates="restaurant")

class LocalEvent(Base):
    __tablename__ = "local_events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    event_date = Column(Date, nullable=False)
    start_time = Column(Time)
    end_time = Column(Time)
    location = Column(String(500))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    price_tier = Column(Enum(PriceTier), nullable=False)
    event_type = Column(String(100))
    tags = Column(JSON)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    itineraries = relationship("Itinerary", back_populates="event")

class WeatherData(Base):
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    location = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    temperature_high = Column(Integer)
    temperature_low = Column(Integer)
    conditions = Column(String(100))
    precipitation_chance = Column(Integer)
    wind_speed = Column(Integer)
    created_at = Column(DateTime, nullable=False)

class Itinerary(Base):
    __tablename__ = "itineraries"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    time_block = Column(Enum(TimeBlock), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"))
    event_id = Column(Integer, ForeignKey("local_events.id"))
    custom_activity = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="itineraries")
    activity = relationship("Activity", back_populates="itineraries")
    restaurant = relationship("Restaurant", back_populates="itineraries")
    event = relationship("LocalEvent", back_populates="itineraries")

class PackingChecklist(Base):
    __tablename__ = "packing_checklists"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    item_name = Column(String(255), nullable=False)
    category = Column(Enum(PackingCategory), nullable=False)
    is_essential = Column(Boolean, default=False)
    weather_dependent = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="packing_checklists")

class AgentConversation(Base):
    __tablename__ = "agent_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    user_message = Column(Text, nullable=False)
    agent_response = Column(Text)
    intent = Column(String(100))
    entities = Column(JSON)
    created_at = Column(DateTime, nullable=False)
    
    # Relationships
    booking = relationship("Booking", back_populates="conversations")
