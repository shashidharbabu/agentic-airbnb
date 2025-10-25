#!/usr/bin/env python3


import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    if sys.version_info < (3, 8):
        print("Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"Python version: {sys.version.split()[0]}")

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_file = Path(".env")
    if not env_file.exists():
        print(".env file not found")
        print("Please copy env.example to .env and configure your API keys")
        print("Run: cp env.example .env")
        sys.exit(1)
    
    from dotenv import load_dotenv
    load_dotenv()
    
    required_vars = ["OPENAI_API_KEY", "TAVILY_API_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"Missing required environment variables: {', '.join(missing_vars)}")
        print("Please configure your .env file with the required API keys")
        sys.exit(1)
    
    print("Environment variables configured")

def check_dependencies():
    try:
        import fastapi
        import uvicorn
        import langchain
        import tavily
        import mysql
        print("All required packages are installed")
    except ImportError as e:
        print(f"Missing required package: {e}")
        print("Please install dependencies: pip install -r requirements.txt")
        sys.exit(1)

def check_database_connection():
    try:
        from database import DatabaseManager
        db = DatabaseManager()
        if db.get_connection():
            print("Database connection successful")
        else:
            print("Database connection failed")
            print("Please check your database configuration in .env")
            sys.exit(1)
    except Exception as e:
        print(f"Database error: {e}")
        print("Please ensure MySQL is running and configured correctly")
        sys.exit(1)

def start_server():
    print("\nStarting AI Travel Agent Backend...")
    print("=" * 50)
    
    try:
        from main import app
        import uvicorn
        
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", 8000))
        
        print(f"Server starting on http://{host}:{port}")
        print(f"API Documentation: http://{host}:{port}/docs")
        print(f"Health Check: http://{host}:{port}/health")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 50)
        
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=True,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")
    except Exception as e:
        print(f"\n Server error: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("AI Travel Agent Backend Startup")
    print("=" * 40)
    
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    check_python_version()
    check_env_file()
    check_dependencies()
    check_database_connection()
    
    start_server()

if __name__ == "__main__":
    main()
