import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict, Any
from models import BookingContext, TravelerPreferences

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=int(os.getenv('DB_PORT', 3306)),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'airbnb_core'),
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )
            if self.connection.is_connected():
                print("AI Agent Database connected successfully")
        except Error as e:
            print(f"Error connecting to database: {e}")
            self.connection = None
    
    def get_connection(self):
        if not self.connection or not self.connection.is_connected():
            self.connect()
        return self.connection
    
    def get_booking_context(self, booking_id: int) -> Optional[BookingContext]:
        try:
            conn = self.get_connection()
            if not conn:
                return None
                
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT 
                b.check_in_date,
                b.check_out_date,
                b.guest_count,
                p.city,
                p.state,
                p.country,
                p.address
            FROM bookings b
            JOIN properties p ON b.property_id = p.id
            WHERE b.id = %s
            """
            
            cursor.execute(query, (booking_id,))
            booking = cursor.fetchone()
            
            if not booking:
                return None
            
            guest_count = booking['guest_count']
            if guest_count == 1:
                party_type = "solo"
            elif guest_count == 2:
                party_type = "couple"
            elif guest_count <= 4:
                party_type = "family"
            else:
                party_type = "friends"
            
            location = f"{booking['city']}, {booking['state']}, {booking['country']}"
            
            return BookingContext(
                check_in=booking['check_in_date'],
                check_out=booking['check_out_date'],
                location=location,
                party_type=party_type,
                guest_count=guest_count
            )
            
        except Error as e:
            print(f"Error getting booking context: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
    
    def get_traveler_preferences(self, traveler_id: int) -> Optional[TravelerPreferences]:
        try:
            conn = self.get_connection()
            if not conn:
                return None
                
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT 
                tp.about_me,
                tp.city,
                tp.state,
                tp.country,
                tp.languages,
                tp.gender,
                u.name
            FROM traveler_profiles tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.user_id = %s
            """
            
            cursor.execute(query, (traveler_id,))
            profile = cursor.fetchone()
            
            if not profile:
                return None
            
            languages = []
            if profile['languages']:
                try:
                    import json
                    languages = json.loads(profile['languages'])
                except:
                    languages = [profile['languages']] if profile['languages'] else []
            
            interests = []
            about_me = profile['about_me'] or ""
            interest_keywords = {
                'outdoor': ['hiking', 'camping', 'nature', 'outdoor', 'adventure'],
                'culture': ['museum', 'art', 'culture', 'history', 'heritage'],
                'food': ['food', 'restaurant', 'cuisine', 'cooking', 'dining'],
                'nightlife': ['nightlife', 'bar', 'club', 'entertainment'],
                'shopping': ['shopping', 'market', 'mall', 'boutique'],
                'relaxation': ['spa', 'beach', 'relax', 'wellness', 'yoga']
            }
            
            for interest, keywords in interest_keywords.items():
                if any(keyword in about_me.lower() for keyword in keywords):
                    interests.append(interest)
            
            return TravelerPreferences(
                interests=interests,
                mobility_needs="full_mobility",  
                dietary_restrictions=[],  
                children_count=0  
            )
            
        except Error as e:
            print(f"Error getting traveler preferences: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
    
    def save_conversation_history(self, traveler_id: int, conversation: List[Dict[str, str]]):
        try:
            conn = self.get_connection()
            if not conn:
                return False
                
            cursor = conn.cursor()
            
            create_table_query = """
            CREATE TABLE IF NOT EXISTS conversation_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                traveler_id INT NOT NULL,
                role ENUM('user', 'assistant') NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (traveler_id) REFERENCES users(id)
            )
            """
            
            cursor.execute(create_table_query)
            
            for message in conversation:
                insert_query = """
                INSERT INTO conversation_history (traveler_id, role, content)
                VALUES (%s, %s, %s)
                """
                cursor.execute(insert_query, (
                    traveler_id,
                    message['role'],
                    message['content']
                ))
            
            conn.commit()
            return True
            
        except Error as e:
            print(f"Error saving conversation history: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
    
    def get_conversation_history(self, traveler_id: int, limit: int = 20) -> List[Dict[str, str]]:
        try:
            conn = self.get_connection()
            if not conn:
                return []
                
            cursor = conn.cursor(dictionary=True)
            
            query = """
            SELECT role, content, timestamp
            FROM conversation_history
            WHERE traveler_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
            """
            
            cursor.execute(query, (traveler_id, limit))
            history = cursor.fetchall()
            
            conversation = []
            for message in reversed(history):  
                conversation.append({
                    'role': message['role'],
                    'content': message['content']
                })
            
            return conversation
            
        except Error as e:
            print(f"Error getting conversation history: {e}")
            return []
        finally:
            if cursor:
                cursor.close()
    
    def close(self):
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("Database connection closed")
