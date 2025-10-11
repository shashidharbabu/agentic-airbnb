import httpx
from typing import List, Dict, Any, Optional
from app.config import settings
import json

class TavilyService:
    def __init__(self):
        self.api_key = settings.TAVILY_API_KEY
        self.base_url = "https://api.tavily.com"
        
    async def search_local_activities(self, location: str, interests: List[str] = None) -> List[Dict[str, Any]]:
        """Search for local activities and attractions"""
        query = f"things to do in {location}"
        if interests:
            query += f" {', '.join(interests)}"
            
        return await self._search(query, max_results=10)
    
    async def search_restaurants(self, location: str, dietary_restrictions: List[str] = None, 
                                cuisine_preference: str = None) -> List[Dict[str, Any]]:
        """Search for restaurants with dietary filters"""
        query = f"restaurants in {location}"
        if cuisine_preference:
            query += f" {cuisine_preference}"
        if dietary_restrictions:
            query += f" {' '.join(dietary_restrictions)}"
            
        return await self._search(query, max_results=8)
    
    async def search_local_events(self, location: str, date_range: str = None) -> List[Dict[str, Any]]:
        """Search for local events and happenings"""
        query = f"events in {location}"
        if date_range:
            query += f" {date_range}"
            
        return await self._search(query, max_results=6)
    
    async def search_weather_info(self, location: str, date_range: str = None) -> Dict[str, Any]:
        """Search for weather information"""
        query = f"weather in {location}"
        if date_range:
            query += f" {date_range}"
            
        results = await self._search(query, max_results=3)
        return {
            "location": location,
            "weather_data": results,
            "date_range": date_range
        }
    
    async def search_accessibility_info(self, location: str, mobility_needs: List[str]) -> List[Dict[str, Any]]:
        """Search for accessibility information"""
        query = f"accessible places in {location}"
        if mobility_needs:
            query += f" {' '.join(mobility_needs)}"
            
        return await self._search(query, max_results=5)
    
    async def search_family_friendly_activities(self, location: str, child_ages: List[str] = None) -> List[Dict[str, Any]]:
        """Search for family-friendly activities"""
        query = f"family activities in {location}"
        if child_ages:
            query += f" for ages {' '.join(child_ages)}"
            
        return await self._search(query, max_results=8)
    
    async def _search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform a Tavily search"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/search",
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "search_depth": "basic",
                        "include_answer": True,
                        "include_images": False,
                        "include_raw_content": False,
                        "max_results": max_results,
                        "include_domains": [],
                        "exclude_domains": []
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("results", [])
                else:
                    print(f"Tavily API error: {response.status_code} - {response.text}")
                    return []
                    
        except Exception as e:
            print(f"Error in Tavily search: {str(e)}")
            return []
    
    def extract_activity_info(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract and structure activity information from search results"""
        activities = []
        
        for result in search_results:
            activity = {
                "title": result.get("title", ""),
                "description": result.get("content", ""),
                "url": result.get("url", ""),
                "source": "tavily_search",
                "relevance_score": result.get("score", 0.0)
            }
            activities.append(activity)
            
        return activities
    
    def extract_restaurant_info(self, search_results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract and structure restaurant information from search results"""
        restaurants = []
        
        for result in search_results:
            restaurant = {
                "name": result.get("title", ""),
                "description": result.get("content", ""),
                "url": result.get("url", ""),
                "source": "tavily_search",
                "relevance_score": result.get("score", 0.0)
            }
            restaurants.append(restaurant)
            
        return restaurants

# Global instance
tavily_service = TavilyService()
