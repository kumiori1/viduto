# Video AI Backend Project Structure

```
video-ai-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Configuration
│   │   ├── database.py            # Database connection
│   │   └── security.py            # Auth utilities
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py        # FastAPI dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── api.py             # Main API router
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── videos.py      # Video endpoints
│   │           ├── revisions.py   # Revision endpoints
│   │           └── webhooks.py    # Webhook endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   ├── video.py               # Video model
│   │   ├── scene.py               # Scene model
│   │   └── music.py               # Music model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── video.py               # Video schemas
│   │   ├── scene.py               # Scene schemas
│   │   └── base.py                # Base schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── video_generation/
│   │   │   ├── __init__.py
│   │   │   ├── main_pipeline.py   # Main video generation
│   │   │   └── revision_pipeline.py # Revision pipeline
│   │   ├── ai_clients/
│   │   │   ├── __init__.py
│   │   │   ├── fal_client.py      # FAL AI client
│   │   │   ├── elevenlabs_client.py # ElevenLabs client
│   │   │   ├── openai_client.py   # OpenAI client
│   │   │   └── lyria_client.py    # Lyria music client
│   │   ├── storage/
│   │   │   ├── __init__.py
│   │   │   └── file_storage.py    # File storage service
│   │   └── base44_integration.py  # Base44 callbacks
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py          # Celery configuration
│   │   ├── video_tasks.py         # Video generation tasks
│   │   └── revision_tasks.py      # Revision tasks
│   └── utils/
│       ├── __init__.py
│       ├── errors.py              # Custom exceptions
│       └── logging.py             # Logging configuration
├── migrations/                    # Alembic migrations
├── tests/                        # Test files
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── requirements.txt
```