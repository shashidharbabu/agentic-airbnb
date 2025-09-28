#!/usr/bin/env python3
"""
SQLite setup script for Agent Airbnb
This script creates the database tables and sample data using SQLite.
"""

import os
import sys
from sqlalchemy import create_engine
from app.config_sqlite import settings
from app.database_sqlite import Base, engine
from app.models import *

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

def create_sample_data():
    """Create sample data"""
    try:
        from sample_data import create_sample_data
        create_sample_data()
        return True
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        return False

def main():
    """Main setup function"""
    print("🗄️  Setting up Agent Airbnb with SQLite")
    print("=" * 50)
    
    # Create tables
    if not create_tables():
        return
    
    # Create sample data
    print("\n📊 Creating sample data...")
    if not create_sample_data():
        return
    
    print("\n🎉 SQLite setup completed!")
    print(f"📁 Database file: {settings.DB_NAME}")
    print("\n📋 Next steps:")
    print("1. Start the server:")
    print("   python run_server_sqlite.py")
    print("2. Test the API:")
    print("   python test_api.py")

if __name__ == "__main__":
    main()
