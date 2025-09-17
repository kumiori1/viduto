from celery import Celery
from app.core.config import settings

# Create Celery instance
celery_app = Celery(
    "video_ai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.video_tasks",
        "app.tasks.revision_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={
        "app.tasks.video_tasks.generate_video": {"queue": "video_generation"},
        "app.tasks.revision_tasks.process_revision": {"queue": "video_revision"},
    },
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=50,
    task_time_limit=3600,  # 1 hour timeout
    task_soft_time_limit=3300,  # 55 minutes soft timeout
)

# Optional: Add task result expiration
celery_app.conf.result_expires = 3600  # Results expire after 1 hour

if __name__ == "__main__":
    celery_app.start()
