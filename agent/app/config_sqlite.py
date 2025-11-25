import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database settings - SQLite for easy setup
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "agent_airbnb.db"  # SQLite file
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    
    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "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")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # External service URLs (for Docker/Kubernetes)
    TRAVELER_API_URL: str = os.getenv("TRAVELER_API_URL", "http://localhost:5001")
    
    @property
    def database_url(self) -> str:
        return f"sqlite:///./{self.DB_NAME}"

settings = Settings()
