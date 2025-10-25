import os
from tavily import TavilyClient
from typing import List, Dict, Any, Optional
from models import WeatherData, LocalEvent, ActivityCard, RestaurantRecommendation
import json
from datetime import datetime, date

class TavilyService:
    def __init__(self):
        self.client = TavilyClient(api_key=os.getenv('TAVILY_API_KEY'))
    
    def search_weather(self, location: str, date_range: tuple) -> List[WeatherData]:
        try:
            query = f"Weather forecast for {location} from {date_range[0]} to {date_range[1]}"
            
            response = self.client.search(
                query=query,
                search_depth="basic",
                max_results=3
            )
            
            weather_data = []
            for result in response.get('results', []):
                content = result.get('content', '')
                if 'temperature' in content.lower() or 'weather' in content.lower():
                    weather_data.append(WeatherData(
                        temperature=self._extract_temperature(content),
                        condition=self._extract_condition(content),
                        humidity=self._extract_humidity(content),
                        wind_speed=self._extract_wind_speed(content),
                        description=content[:200] + "..." if len(content) > 200 else content
                    ))
            
            return weather_data
            
        except Exception as e:
            print(f"Error searching weather: {e}")
            return []
    
    def search_local_events(self, location: str, date_range: tuple) -> List[LocalEvent]:
        try:
            query = f"Events happening in {location} from {date_range[0]} to {date_range[1]} festivals concerts shows"
            
            response = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=5
            )
            
            events = []
            for result in response.get('results', []):
                title = result.get('title', '')
                content = result.get('content', '')
                url = result.get('url', '')
                
                if title and any(keyword in content.lower() for keyword in ['event', 'festival', 'concert', 'show', 'exhibition']):
                    events.append(LocalEvent(
                        title=title,
                        date=date_range[0],  
                        time="TBD",
                        location=location,
                        description=content[:300] + "..." if len(content) > 300 else content,
                        category="general"
                    ))
            
            return events
            
        except Exception as e:
            print(f"Error searching local events: {e}")
            return []
    
    def search_activities(self, location: str, interests: List[str], mobility_needs: str) -> List[ActivityCard]:
        try:
            interests_str = ", ".join(interests) if interests else "general attractions"
            query = f"Things to do in {location} {interests_str} attractions activities"
            
            if mobility_needs == "wheelchair_accessible":
                query += " wheelchair accessible"
            
            response = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=8
            )
            
            activities = []
            for result in response.get('results', []):
                title = result.get('title', '')
                content = result.get('content', '')
                url = result.get('url', '')
                
                if title and any(keyword in content.lower() for keyword in ['attraction', 'museum', 'park', 'garden', 'monument', 'landmark']):
                    activities.append(ActivityCard(
                        title=title,
                        address=self._extract_address(content, location),
                        price_tier=self._extract_price_tier(content),
                        duration_hours=self._extract_duration(content),
                        tags=self._extract_tags(content, interests),
                        wheelchair_accessible="wheelchair" in content.lower() or "accessible" in content.lower(),
                        child_friendly=self._is_child_friendly(content),
                        description=content[:200] + "..." if len(content) > 200 else content,
                        booking_url=url if 'book' in url.lower() or 'ticket' in url.lower() else None
                    ))
            
            return activities
            
        except Exception as e:
            print(f"Error searching activities: {e}")
            return []
    
    def search_restaurants(self, location: str, dietary_restrictions: List[str], cuisine_preferences: List[str] = None) -> List[RestaurantRecommendation]:
        try:
            dietary_str = ", ".join(dietary_restrictions) if dietary_restrictions else ""
            cuisine_str = ", ".join(cuisine_preferences) if cuisine_preferences else ""
            
            query = f"Best restaurants in {location} {dietary_str} {cuisine_str} dining food"
            
            response = self.client.search(
                query=query,
                search_depth="advanced",
                max_results=6
            )
            
            restaurants = []
            for result in response.get('results', []):
                title = result.get('title', '')
                content = result.get('content', '')
                url = result.get('url', '')
                
                if title and any(keyword in content.lower() for keyword in ['restaurant', 'cafe', 'dining', 'food', 'cuisine']):
                    restaurants.append(RestaurantRecommendation(
                        name=title,
                        address=self._extract_address(content, location),
                        cuisine_type=self._extract_cuisine_type(content),
                        price_tier=self._extract_price_tier(content),
                        dietary_accommodations=self._extract_dietary_accommodations(content, dietary_restrictions),
                        rating=self._extract_rating(content),
                        description=content[:200] + "..." if len(content) > 200 else content,
                        booking_url=url if 'reservation' in url.lower() or 'book' in url.lower() else None
                    ))
            
            return restaurants
            
        except Exception as e:
            print(f"Error searching restaurants: {e}")
            return []
    
    def search_packing_tips(self, location: str, date_range: tuple, activities: List[str]) -> List[str]:
        try:
            activities_str = ", ".join(activities) if activities else "general travel"
            query = f"Packing list for {location} {date_range[0]} to {date_range[1]} {activities_str} travel essentials"
            
            response = self.client.search(
                query=query,
                search_depth="basic",
                max_results=3
            )
            
            packing_tips = []
            for result in response.get('results', []):
                content = result.get('content', '')
                if content:
                    lines = content.split('\n')
                    for line in lines:
                        if any(keyword in line.lower() for keyword in ['pack', 'bring', 'essential', 'clothing', 'shoes']):
                            packing_tips.append(line.strip())
            
            return packing_tips[:10]  
            
        except Exception as e:
            print(f"Error searching packing tips: {e}")
            return []
    
    def _extract_temperature(self, content: str) -> float:
        import re
        temp_match = re.search(r'(\d+)\s*°?[CF]', content)
        return float(temp_match.group(1)) if temp_match else 20.0
    
    def _extract_condition(self, content: str) -> str:
        conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy', 'clear', 'overcast']
        for condition in conditions:
            if condition in content.lower():
                return condition.title()
        return "Unknown"
    
    def _extract_humidity(self, content: str) -> float:
        import re
        humidity_match = re.search(r'humidity[:\s]*(\d+)%?', content, re.IGNORECASE)
        return float(humidity_match.group(1)) if humidity_match else 50.0
    
    def _extract_wind_speed(self, content: str) -> float:
        import re
        wind_match = re.search(r'wind[:\s]*(\d+)\s*(?:mph|km/h|m/s)', content, re.IGNORECASE)
        return float(wind_match.group(1)) if wind_match else 5.0
    
    def _extract_address(self, content: str, location: str) -> str:
        import re
        address_match = re.search(r'(\d+\s+[^,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)[^,]*)', content)
        if address_match:
            return f"{address_match.group(1)}, {location}"
        return location
    
    def _extract_price_tier(self, content: str) -> str:
        content_lower = content.lower()
        if any(word in content_lower for word in ['expensive', 'luxury', 'premium', 'high-end', '$$$']):
            return "luxury"
        elif any(word in content_lower for word in ['budget', 'cheap', 'affordable', '$']):
            return "budget"
        else:
            return "moderate"
    
    def _extract_duration(self, content: str) -> float:
        import re
        duration_match = re.search(r'(\d+)\s*(?:hours?|hrs?)', content, re.IGNORECASE)
        if duration_match:
            return float(duration_match.group(1))
        
        if any(word in content.lower() for word in ['quick', 'brief', 'short']):
            return 1.0
        elif any(word in content.lower() for word in ['half day', 'morning', 'afternoon']):
            return 4.0
        elif any(word in content.lower() for word in ['full day', 'day trip']):
            return 8.0
        else:
            return 2.0
    
    def _extract_tags(self, content: str, interests: List[str]) -> List[str]:
        tags = []
        content_lower = content.lower()
        
        tag_keywords = {
            'outdoor': ['outdoor', 'nature', 'park', 'garden', 'hiking', 'walking'],
            'culture': ['museum', 'art', 'culture', 'history', 'heritage', 'gallery'],
            'entertainment': ['entertainment', 'show', 'theater', 'concert', 'performance'],
            'family': ['family', 'kids', 'children', 'child-friendly'],
            'romantic': ['romantic', 'couple', 'date', 'intimate'],
            'adventure': ['adventure', 'thrilling', 'exciting', 'extreme']
        }
        
        for tag, keywords in tag_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                tags.append(tag)
        
        for interest in interests:
            if interest in content_lower:
                tags.append(interest)
        
        return tags[:5]  
    
    def _is_child_friendly(self, content: str) -> bool:
        child_keywords = ['child', 'kid', 'family', 'children', 'playground', 'play']
        return any(keyword in content.lower() for keyword in child_keywords)
    
    def _extract_cuisine_type(self, content: str) -> str:
        cuisine_keywords = {
            'italian': ['italian', 'pasta', 'pizza'],
            'chinese': ['chinese', 'asian', 'dim sum'],
            'mexican': ['mexican', 'taco', 'burrito'],
            'indian': ['indian', 'curry', 'spicy'],
            'french': ['french', 'bistro', 'cafe'],
            'japanese': ['japanese', 'sushi', 'ramen'],
            'american': ['american', 'burger', 'steak'],
            'mediterranean': ['mediterranean', 'greek', 'middle eastern']
        }
        
        content_lower = content.lower()
        for cuisine, keywords in cuisine_keywords.items():
            if any(keyword in content_lower for keyword in keywords):
                return cuisine.title()
        
        return "International"
    
    def _extract_dietary_accommodations(self, content: str, dietary_restrictions: List[str]) -> List[str]:
        accommodations = []
        content_lower = content.lower()
        
        for restriction in dietary_restrictions:
            if restriction.lower() in content_lower:
                accommodations.append(restriction)
        
        return accommodations
    
    def _extract_rating(self, content: str) -> Optional[float]:
        import re
        rating_match = re.search(r'(\d+\.?\d*)\s*\/\s*5', content)
        if rating_match:
            return float(rating_match.group(1))
        
        rating_match = re.search(r'(\d+\.?\d*)\s*stars?', content, re.IGNORECASE)
        if rating_match:
            return float(rating_match.group(1))
        
        return None
