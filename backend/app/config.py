import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv(BASE_DIR / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "BuildGuard AI API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root@localhost:3306/buildguard"
    )

    # AI Agent Chatbot API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    BLUEPRINT_UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads") / "blueprints"
    SITE_PHOTO_UPLOAD_DIR: Path = BASE_DIR / os.getenv("UPLOAD_DIR", "uploads") / "site_photos"
    
    # CORS
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure upload folders exist
settings.BLUEPRINT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.SITE_PHOTO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
