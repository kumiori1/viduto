import asyncio
from celery import current_task
from loguru import logger

from app.tasks.celery_app import celery_app
from app.services.video_generation.main_pipeline import VideoGenerationPipeline
from app.core.database import async_session_maker
from app.models.video import Video, VideoStatus


@celery_app.task(bind=True, max_retries=3)
def generate_video(self, video_id: str):
    """
    Celery task for video generation
    Equivalent to the entire n8n Main Video Ad workflow
    """
    
    logger.info(f"Starting video generation task for {video_id}")
    
    try:
        # Update task progress
        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 7, "status": "Starting video generation..."}
        )
        
        # Run the async pipeline
        pipeline = VideoGenerationPipeline()
        final_video_url = asyncio.run(pipeline.generate_video(video_id))
        
        logger.info(f"Video generation completed for {video_id}: {final_video_url}")
        
        return {
            "video_id": video_id,
            "final_video_url": final_video_url,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Video generation failed for {video_id}: {e}")
        
        # Update video status to failed
        async def update_failed_status():
            async with async_session_maker() as db:
                video = await db.get(Video, video_id)
                if video:
                    video.status = VideoStatus.FAILED
                    video.error_message = str(e)
                    await db.commit()
        
        asyncio.run(update_failed_status())
        
        # Retry if not exceeded max retries
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying video generation for {video_id} (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60, exc=e)
        
        raise e


@celery_app.task(bind=True)
def check_video_status(self, video_id: str):
    """Check video generation status"""
    
    async def get_status():
        async with async_session_maker() as db:
            video = await db.get(Video, video_id)
            if not video:
                return {"error": "Video not found"}
            
            return {
                "video_id": video_id,
                "status": video.status.value,
                "final_video_url": video.final_video_url,
                "error_message": video.error_message,
                "progress": _get_status_progress(video.status)
            }
    
    return asyncio.run(get_status())


@celery_app.task
def cleanup_old_videos():
    """Cleanup old video records and files"""
    
    from datetime import datetime, timedelta
    from sqlalchemy import select
    
    async def cleanup():
        async with async_session_maker() as db:
            # Delete videos older than 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            result = await db.execute(
                select(Video).where(Video.created_at < cutoff_date)
            )
            old_videos = result.scalars().all()
            
            for video in old_videos:
                # TODO: Delete associated files from storage
                await db.delete(video)
            
            await db.commit()
            logger.info(f"Cleaned up {len(old_videos)} old videos")
    
    asyncio.run(cleanup())


def _get_status_progress(status: VideoStatus) -> dict:
    """Get progress information based on status"""
    
    status_map = {
        VideoStatus.PENDING: {"current": 0, "total": 7, "message": "Video queued for processing"},
        VideoStatus.PROCESSING_SCRIPT: {"current": 1, "total": 7, "message": "Generating video script..."},
        VideoStatus.PROCESSING_IMAGES: {"current": 2, "total": 7, "message": "Processing images..."},
        VideoStatus.GENERATING_SCENES: {"current": 3, "total": 7, "message": "Generating scene videos..."},
        VideoStatus.GENERATING_VOICEOVERS: {"current": 4, "total": 7, "message": "Creating voiceovers..."},
        VideoStatus.GENERATING_MUSIC: {"current": 5, "total": 7, "message": "Generating background music..."},
        VideoStatus.COMPOSING_VIDEO: {"current": 6, "total": 7, "message": "Composing final video..."},
        VideoStatus.ADDING_CAPTIONS: {"current": 7, "total": 7, "message": "Adding captions..."},
        VideoStatus.COMPLETED: {"current": 7, "total": 7, "message": "Video generation completed!"},
        VideoStatus.FAILED: {"current": 0, "total": 7, "message": "Video generation failed"},
    }
    
    return status_map.get(status, {"current": 0, "total": 7, "message": "Unknown status"})


# Periodic task to monitor queue health
@celery_app.task
def monitor_queue_health():
    """Monitor Celery queue health"""
    
    inspect = celery_app.control.inspect()
    
    # Get queue stats
    stats = inspect.stats()
    active_tasks = inspect.active()
    
    logger.info(f"Queue stats: {stats}")
    logger.info(f"Active tasks: {len(active_tasks) if active_tasks else 0}")
    
    return {
        "stats": stats,
        "active_tasks": active_tasks,
        "timestamp": asyncio.get_event_loop().time()
    }
