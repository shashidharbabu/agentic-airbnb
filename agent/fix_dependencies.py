#!/usr/bin/env python3
"""
Dependency fix script for Agent Airbnb
This script resolves common dependency conflicts.
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def fix_dependencies():
    """Fix dependency conflicts"""
    print("🔧 Fixing Agent Airbnb Dependencies")
    print("=" * 50)
    
    # Upgrade pip first
    run_command("python -m pip install --upgrade pip", "Upgrading pip")
    
    # Install core dependencies one by one to avoid conflicts
    dependencies = [
        "fastapi",
        "uvicorn[standard]",
        "pymysql",
        "sqlalchemy",
        "python-dotenv",
        "pydantic",
        "httpx",
        "requests",
        "python-multipart",
        "openai",
        "tavily-python",
        "langchain",
        "langchain-openai",
        "langchain-community"
    ]
    
    print("📦 Installing dependencies individually...")
    for dep in dependencies:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"⚠️  Failed to install {dep}, continuing...")
    
    print("\n🎉 Dependency installation completed!")
    print("\n📋 Next steps:")
    print("1. Test the installation:")
    print("   python -c 'import fastapi, langchain, tavily'")
    print("2. If successful, continue with:")
    print("   python sample_data.py")
    print("   python run_server.py")

if __name__ == "__main__":
    fix_dependencies()
