# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/video_ai

# Redis
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# API Keys
FAL_API_KEY=Key 225b91e5-24b6-48eb-8687-3cb9a239805b:e1047a86c96ac36163a602b47289c707
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Base44 Integration
BASE44_CALLBACK_URL=https://base44.app/api/apps/68b4aa46f5d6326ab93c3ed0/functions/n8nVideoCallback

# Security
SECRET_KEY=your-super-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App Settings
DEBUG=true
PROJECT_NAME=Video AI Backend
VERSION=1.0.0
LOG_LEVEL=INFO

# File Storage (Optional - for AWS S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_bucket_name
AWS_REGION=us-east-1

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_here
