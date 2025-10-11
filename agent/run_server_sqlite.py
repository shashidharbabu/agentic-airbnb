#!/usr/bin/env python3
"""
SQLite server startup script for Agent Airbnb
This script starts the FastAPI server with SQLite configuration.
"""

import uvicorn
from app.config_sqlite import settings

if __name__ == "__main__":
    print("🚀 Starting Agent Airbnb - AI Travel Concierge (SQLite)")
    print(f"📍 Server will run on {settings.HOST}:{settings.PORT}")
    print(f"🗄️  Database: {settings.DB_NAME}")
    print("🔗 API Documentation: http://localhost:8000/docs")
    print("🔗 Alternative docs: http://localhost:8000/redoc")
    
    uvicorn.run(
        "app.main_sqlite:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
