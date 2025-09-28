#!/usr/bin/env python3
"""
Quick setup script for Agent Airbnb
This script helps set up the project quickly.
"""

import os
import subprocess
import sys

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

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ is required")
        return False
    print(f"✅ Python {sys.version.split()[0]} is compatible")
    return True

def create_env_file():
    """Create .env file from template"""
    if not os.path.exists('.env'):
        if os.path.exists('env_example.txt'):
            with open('env_example.txt', 'r') as f:
                content = f.read()
            with open('.env', 'w') as f:
                f.write(content)
            print("✅ Created .env file from template")
            print("⚠️  Please edit .env file with your actual configuration")
        else:
            print("❌ env_example.txt not found")
            return False
    else:
        print("✅ .env file already exists")
    return True

def main():
    """Main setup function"""
    print("🚀 Agent Airbnb Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        return
    
    # Create virtual environment
    if not os.path.exists('venv'):
        if not run_command('python -m venv venv', 'Creating virtual environment'):
            return
    else:
        print("✅ Virtual environment already exists")
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_cmd = 'venv\\Scripts\\activate'
        pip_cmd = 'venv\\Scripts\\pip'
    else:  # Unix/Linux/Mac
        activate_cmd = 'source venv/bin/activate'
        pip_cmd = 'venv/bin/pip'
    
    # Try installing dependencies with conflict resolution
    if not run_command(f'{pip_cmd} install -r requirements.txt', 'Installing dependencies'):
        print("⚠️  Trying simplified requirements...")
        if not run_command(f'{pip_cmd} install -r requirements-simple.txt', 'Installing simplified dependencies'):
            print("❌ Dependency installation failed. Please install manually:")
            print("   pip install fastapi uvicorn langchain langchain-openai pymysql sqlalchemy python-dotenv pydantic httpx requests tavily-python python-multipart openai")
            return
    
    # Create .env file
    if not create_env_file():
        return
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Edit .env file with your configuration")
    print("2. Set up MySQL database:")
    print("   mysql -u root -p")
    print("   CREATE DATABASE agent_airbnb;")
    print("   exit")
    print("3. Run database schema:")
    print("   mysql -u root -p agent_airbnb < database_schema.sql")
    print("4. Create sample data:")
    print("   python sample_data.py")
    print("5. Start the server:")
    print("   python run_server.py")
    print("\n🔗 API will be available at: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
