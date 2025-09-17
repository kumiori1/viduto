import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/video_ai"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # API Keys
    FAL_API_KEY: str = "Key 225b91e5-24b6-48eb-8687-3cb9a239805b:e1047a86c96ac36163a602b47289c707"
    ELEVENLABS_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # Base44 Integration
    BASE44_CALLBACK_URL: str = "https://base44.app/api/apps/68b4aa46f5d6326ab93c3ed0/functions/n8nVideoCallback"
    
    # File Storage
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # App Settings
    DEBUG: bool = False
    PROJECT_NAME: str = "Video AI Backend"
    VERSION: str = "1.0.0"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    SENTRY_DSN: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
