#!/usr/bin/env python3
"""
Test script for Agent Airbnb API
This script tests the main endpoints and functionality.
"""

import requests
import json
from datetime import date, timedelta

# API base URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_create_user():
    """Test user creation"""
    print("🔍 Testing user creation...")
    try:
        user_data = {
            "email": "test.user@example.com",
            "name": "Test User"
        }
        response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        if response.status_code == 200:
            user = response.json()
            print(f"✅ User created: {user['id']}")
            return user['id']
        else:
            print(f"❌ User creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ User creation error: {str(e)}")
        return None

def test_create_booking(user_id):
    """Test booking creation"""
    print("🔍 Testing booking creation...")
    try:
        booking_data = {
            "user_id": user_id,
            "check_in_date": (date.today() + timedelta(days=7)).isoformat(),
            "check_out_date": (date.today() + timedelta(days=10)).isoformat(),
            "location": "Paris, France",
            "latitude": 48.8566,
            "longitude": 2.3522,
            "party_type": "couple",
            "party_size": 2
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        if response.status_code == 200:
            booking = response.json()
            print(f"✅ Booking created: {booking['id']}")
            return booking['id']
        else:
            print(f"❌ Booking creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Booking creation error: {str(e)}")
        return None

def test_create_preferences(booking_id):
    """Test preferences creation"""
    print("🔍 Testing preferences creation...")
    try:
        preferences_data = {
            "booking_id": booking_id,
            "budget_tier": "mid-range",
            "interests": ["culture", "food", "art"],
            "mobility_needs": ["wheelchair_accessible"],
            "dietary_restrictions": ["vegetarian"],
            "special_requirements": "First time visiting Paris"
        }
        response = requests.post(f"{BASE_URL}/api/preferences", json=preferences_data)
        if response.status_code == 200:
            preferences = response.json()
            print(f"✅ Preferences created: {preferences['id']}")
            return True
        else:
            print(f"❌ Preferences creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Preferences creation error: {str(e)}")
        return False

def test_concierge_endpoint():
    """Test main concierge endpoint"""
    print("🔍 Testing concierge endpoint...")
    try:
        concierge_data = {
            "booking_context": {
                "check_in_date": (date.today() + timedelta(days=7)).isoformat(),
                "check_out_date": (date.today() + timedelta(days=10)).isoformat(),
                "location": "Paris, France",
                "latitude": 48.8566,
                "longitude": 2.3522,
                "party_type": "couple",
                "party_size": 2
            },
            "preferences": {
                "budget_tier": "mid-range",
                "interests": ["culture", "food", "art"],
                "mobility_needs": ["wheelchair_accessible"],
                "dietary_restrictions": ["vegetarian"],
                "special_requirements": "First time visiting Paris"
            },
            "user_message": "We're visiting Paris for the first time, love art and vegetarian food, need wheelchair accessible places"
        }
        
        response = requests.post(f"{BASE_URL}/api/concierge", json=concierge_data)
        if response.status_code == 200:
            result = response.json()
            print("✅ Concierge endpoint working!")
            print(f"📅 Day-by-day plan: {len(result.get('day_by_day_plan', []))} days")
            print(f"🎯 Activities: {len(result.get('activity_cards', []))} activities")
            print(f"🍽️ Restaurants: {len(result.get('restaurant_recommendations', []))} restaurants")
            print(f"🎒 Packing items: {len(result.get('packing_checklist', []))} items")
            return True
        else:
            print(f"❌ Concierge endpoint failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Concierge endpoint error: {str(e)}")
        return False

def test_search_endpoints():
    """Test search endpoints"""
    print("🔍 Testing search endpoints...")
    
    # Test activities search
    try:
        response = requests.get(f"{BASE_URL}/api/search/activities?location=Paris&interests=culture,art")
        if response.status_code == 200:
            print("✅ Activities search working")
        else:
            print(f"❌ Activities search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Activities search error: {str(e)}")
    
    # Test restaurants search
    try:
        response = requests.get(f"{BASE_URL}/api/search/restaurants?location=Paris&dietary=vegetarian")
        if response.status_code == 200:
            print("✅ Restaurants search working")
        else:
            print(f"❌ Restaurants search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Restaurants search error: {str(e)}")
    
    # Test events search
    try:
        response = requests.get(f"{BASE_URL}/api/search/events?location=Paris")
        if response.status_code == 200:
            print("✅ Events search working")
        else:
            print(f"❌ Events search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Events search error: {str(e)}")
    
    # Test weather search
    try:
        response = requests.get(f"{BASE_URL}/api/search/weather?location=Paris")
        if response.status_code == 200:
            print("✅ Weather search working")
        else:
            print(f"❌ Weather search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Weather search error: {str(e)}")

def run_all_tests():
    """Run all tests"""
    print("🧪 Starting Agent Airbnb API Tests")
    print("=" * 50)
    
    # Test health check
    if not test_health_check():
        print("❌ Health check failed, stopping tests")
        return
    
    # Test user creation
    user_id = test_create_user()
    if not user_id:
        print("❌ User creation failed, stopping tests")
        return
    
    # Test booking creation
    booking_id = test_create_booking(user_id)
    if not booking_id:
        print("❌ Booking creation failed, stopping tests")
        return
    
    # Test preferences creation
    if not test_create_preferences(booking_id):
        print("❌ Preferences creation failed, stopping tests")
        return
    
    # Test concierge endpoint
    if not test_concierge_endpoint():
        print("❌ Concierge endpoint failed")
    
    # Test search endpoints
    test_search_endpoints()
    
    print("=" * 50)
    print("🎉 All tests completed!")

if __name__ == "__main__":
    run_all_tests()
