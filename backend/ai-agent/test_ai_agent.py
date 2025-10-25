#!/usr/bin/env python3

import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ollama_ai_agent import OllamaAIAgent
from models import AIAgentRequest, BookingContext, TravelerPreferences, MobilityNeeds, DietaryRestrictions, PartyType
from datetime import datetime

async def test_ai_agent():
    try:
        print("Testing OllamaAIAgent...")
        
        ai_agent = OllamaAIAgent()
        print("AI agent created successfully")
        
        booking_context = BookingContext(
            location="Paris",
            check_in=datetime.now().date(),
            check_out=(datetime.now().date().replace(day=datetime.now().day + 3)),
            party_type=PartyType.FAMILY,
            guest_count=2
        )
        
        preferences = TravelerPreferences(
            interests=["culture", "food", "outdoor"],
            dietary_restrictions=[DietaryRestrictions.VEGETARIAN],
            mobility_needs=MobilityNeeds.FULL_MOBILITY,
            children_count=0,
            budget_range="moderate"
        )
        
        ai_request = AIAgentRequest(
            booking_context=booking_context,
            preferences=preferences,
            user_query="Hello! I need help planning my trip to Paris",
            conversation_history=[]
        )
        
        print("Test request created successfully")
        
        response = await ai_agent._generate_ai_response(ai_request, [], [])
        print(f"AI response generated: {response[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"Error testing AI agent: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_ai_agent())
