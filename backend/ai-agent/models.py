from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

class PartyType(str, Enum):
    SOLO = "solo"
    COUPLE = "couple"
    FAMILY = "family"
    FRIENDS = "friends"
    BUSINESS = "business"

class MobilityNeeds(str, Enum):
    WHEELCHAIR_ACCESSIBLE = "wheelchair_accessible"
    LIMITED_MOBILITY = "limited_mobility"
    FULL_MOBILITY = "full_mobility"

class DietaryRestrictions(str, Enum):
    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"
    GLUTEN_FREE = "gluten_free"
    KETO = "keto"
    HALAL = "halal"
    KOSHER = "kosher"
    NONE = "none"

class PriceTier(str, Enum):
    BUDGET = "budget"
    MODERATE = "moderate"
    LUXURY = "luxury"

class TimeBlock(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"

class BookingContext(BaseModel):
    check_in: date
    check_out: date
    location: str
    party_type: PartyType
    guest_count: int

class TravelerPreferences(BaseModel):
    budget: Optional[str] = None
    interests: List[str] = []
    mobility_needs: MobilityNeeds = MobilityNeeds.FULL_MOBILITY
    dietary_restrictions: List[DietaryRestrictions] = []
    children_count: int = 0
    age_range: Optional[str] = None

class AIAgentRequest(BaseModel):
    booking_context: BookingContext
    preferences: TravelerPreferences
    user_query: Optional[str] = None
    conversation_history: List[Dict[str, str]] = []

class ActivityCard(BaseModel):
    title: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_tier: PriceTier
    duration_hours: float
    tags: List[str] = []
    wheelchair_accessible: bool = False
    child_friendly: bool = False
    description: str = ""
    booking_url: Optional[str] = None

class RestaurantRecommendation(BaseModel):
    name: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    cuisine_type: str
    price_tier: PriceTier
    dietary_accommodations: List[str] = []
    rating: Optional[float] = None
    description: str = ""
    booking_url: Optional[str] = None

class PackingItem(BaseModel):
    item: str
    category: str
    essential: bool = False
    weather_dependent: bool = False
    reason: str = ""

class DayPlan(BaseModel):
    date: date
    time_blocks: Dict[TimeBlock, List[ActivityCard]] = {}
    weather_forecast: Optional[Dict[str, Any]] = None
    notes: str = ""

class PackingChecklist(BaseModel):
    items: List[PackingItem]
    weather_aware: bool = True
    trip_duration_days: int
    destination_climate: str

class AIAgentResponse(BaseModel):
    day_plans: List[DayPlan]
    restaurant_recommendations: List[RestaurantRecommendation]
    packing_checklist: PackingChecklist
    conversation_history: List[Dict[str, str]]
    generated_at: datetime
    total_estimated_cost: Optional[str] = None
    additional_tips: List[str] = []

class ConversationMessage(BaseModel):
    role: str  
    content: str
    timestamp: datetime

class WeatherData(BaseModel):
    temperature: float
    condition: str
    humidity: float
    wind_speed: float
    description: str

class LocalEvent(BaseModel):
    title: str
    date: date
    time: str
    location: str
    description: str
    price: Optional[str] = None
    category: str = "general"
