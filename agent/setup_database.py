#!/usr/bin/env python3
"""
Database setup script for Agent Airbnb
This script creates the database tables and sample data.
"""

import os
import sys
from sqlalchemy import create_engine, text
from app.config import settings
from app.database import Base, engine
from app.models import *

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to MySQL server (without database)
        server_url = f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/"
        server_engine = create_engine(server_url)
        
        with server_engine.connect() as conn:
            # Create database if it doesn't exist
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {settings.DB_NAME}"))
            print(f"✅ Database '{settings.DB_NAME}' created or already exists")
        
        return True
    except Exception as e:
        print(f"❌ Error creating database: {str(e)}")
        print("💡 Make sure MySQL is running and credentials are correct in .env file")
        return False

def create_tables():
    """Create all database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🗄️  Setting up Agent Airbnb Database")
    print("=" * 50)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("❌ .env file not found!")
        print("💡 Please create .env file with your database configuration:")
        print("   cp env_example.txt .env")
        print("   # Then edit .env with your MySQL credentials")
        return
    
    # Create database
    if not create_database():
        return
    
    # Create tables
    if not create_tables():
        return
    
    print("\n🎉 Database setup completed!")
    print("\n📋 Next steps:")
    print("1. Create sample data:")
    print("   python sample_data.py")
    print("2. Start the server:")
    print("   python run_server.py")

if __name__ == "__main__":
    main()
