from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, time, datetime
from enum import Enum

# Enums
class PartyType(str, Enum):
    SOLO = "solo"
    COUPLE = "couple"
    FAMILY = "family"
    GROUP = "group"
    BUSINESS = "business"

class BudgetTier(str, Enum):
    BUDGET = "budget"
    MID_RANGE = "mid-range"
    LUXURY = "luxury"

class PriceTier(str, Enum):
    FREE = "free"
    BUDGET = "budget"
    MID_RANGE = "mid-range"
    LUXURY = "luxury"

class TimeBlock(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"

class PackingCategory(str, Enum):
    CLOTHING = "clothing"
    TOILETRIES = "toiletries"
    ELECTRONICS = "electronics"
    DOCUMENTS = "documents"
    OTHER = "other"

# Request Schemas
class BookingContext(BaseModel):
    check_in_date: date
    check_out_date: date
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    party_type: PartyType
    party_size: int

class UserPreferences(BaseModel):
    budget_tier: BudgetTier
    interests: List[str] = []
    mobility_needs: List[str] = []
    dietary_restrictions: List[str] = []
    special_requirements: Optional[str] = None

class ConciergeRequest(BaseModel):
    booking_context: BookingContext
    preferences: UserPreferences
    user_message: Optional[str] = None

# Response Schemas
class ActivityCard(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_tier: PriceTier
    duration_hours: Optional[float] = None
    tags: List[str] = []
    wheelchair_accessible: bool = False
    child_friendly: bool = False

class RestaurantRecommendation(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_tier: PriceTier
    cuisine_type: Optional[str] = None
    dietary_options: List[str] = []
    wheelchair_accessible: bool = False
    child_friendly: bool = False
    rating: Optional[float] = None

class PackingItem(BaseModel):
    item_name: str
    category: PackingCategory
    is_essential: bool = False
    weather_dependent: bool = False

class DayPlan(BaseModel):
    day_number: int
    date: date
    morning: Optional[ActivityCard] = None
    afternoon: Optional[ActivityCard] = None
    evening: Optional[ActivityCard] = None
    restaurants: List[RestaurantRecommendation] = []
    events: List[Dict[str, Any]] = []
    notes: Optional[str] = None

class ConciergeResponse(BaseModel):
    day_by_day_plan: List[DayPlan]
    activity_cards: List[ActivityCard]
    restaurant_recommendations: List[RestaurantRecommendation]
    packing_checklist: List[PackingItem]
    weather_summary: Optional[Dict[str, Any]] = None
    local_events: List[Dict[str, Any]] = []
    agent_notes: Optional[str] = None

# Database Schemas
class UserCreate(BaseModel):
    email: str
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    user_id: Optional[int] = None
    check_in_date: date
    check_out_date: date
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    party_type: PartyType
    party_size: int

class BookingResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    check_in_date: date
    check_out_date: date
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    party_type: PartyType
    party_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserPreferencesCreate(BaseModel):
    booking_id: int
    budget_tier: BudgetTier
    interests: List[str] = []
    mobility_needs: List[str] = []
    dietary_restrictions: List[str] = []
    special_requirements: Optional[str] = None

class UserPreferencesResponse(BaseModel):
    id: int
    booking_id: int
    budget_tier: BudgetTier
    interests: List[str] = []
    mobility_needs: List[str] = []
    dietary_restrictions: List[str] = []
    special_requirements: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
