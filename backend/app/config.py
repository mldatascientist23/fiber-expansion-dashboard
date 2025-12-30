"""Application configuration settings."""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "GVTC Fiber Expansion Intelligence Platform"
    debug: bool = False
    
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://feip:feip@localhost:5432/feip"
    )
    
    # JWT Authentication
    secret_key: str = os.getenv(
        "SECRET_KEY", 
        "gvtc-fiber-expansion-secret-key-change-in-production"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # CORS
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # File uploads
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    upload_directory: str = "uploads"
    
    # GVTC Texas Counties (13-county footprint)
    gvtc_counties: list = [
        "Bexar", "Comal", "Guadalupe", "Kendall", "Blanco",
        "Hays", "Gillespie", "Kerr", "Medina", "Bandera",
        "Real", "Edwards", "Uvalde"
    ]
    
    class Config:
        env_file = ".env"


@lru_cache
def get_settings():
    """Get cached settings instance."""
    return Settings()
