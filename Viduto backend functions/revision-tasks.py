import asyncio
from celery import current_task
from loguru import logger

from app.tasks.celery_app import celery_app
from app.services.video_generation.revision_pipeline import RevisionPipeline
from app.core.database import async_session_maker
from app.models.video import VideoRevision


@celery_app.task(bind=True, max_retries=2)
def process_revision(self, original_video_id: str, revision_request: str, new_video_id: str):
    """
    Celery task for video revision
    Equivalent to the entire n8n Revision workflow
    """
    
    logger.info(f"Starting revision task for video {original_video_id}: {revision_request}")
    
    try:
        # Update task progress
        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 5, "status": "Analyzing revision request..."}
        )
        
        # Run the async revision pipeline
        pipeline = RevisionPipeline()
        final_video_url = asyncio.run(
            pipeline.process_revision(original_video_id, revision_request, new_video_id)
        )
        
        logger.info(f"Revision completed for {original_video_id}: {final_video_url}")
        
        return {
            "original_video_id": original_video_id,
            "new_video_id": new_video_id,
            "final_video_url": final_video_url,
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"Revision failed for {original_video_id}: {e}")
        
        # Update revision status to failed
        async def update_failed_status():
            async with async_session_maker() as db:
                from sqlalchemy import select
                result = await db.execute(
                    select(VideoRevision).where(
                        VideoRevision.video_id == original_video_id
                    ).order_by(VideoRevision.created_at.desc())
                )
                revision = result.scalar()
                if revision:
                    revision.status = "failed"
                    await db.commit()
        
        asyncio.run(update_failed_status())
        
        # Retry if not exceeded max retries
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying revision for {original_video_id} (attempt {self.request.retries + 1})")
            raise self.retry(countdown=120, exc=e)
        
        raise e


@celery_app.task(bind=True)
def check_revision_status(self, original_video_id: str, revision_id: str = None):
    """Check revision status"""
    
    async def get_status():
        async with async_session_maker() as db:
            from sqlalchemy import select
            
            if revision_id:
                revision = await db.get(VideoRevision, revision_id)
            else:
                # Get latest revision for the video
                result = await db.execute(
                    select(VideoRevision).where(
                        VideoRevision.video_id == original_video_id
                    ).order_by(VideoRevision.created_at.desc())
                )
                revision = result.scalar()
            
            if not revision:
                return {"error": "Revision not found"}
            
            return {
                "revision_id": revision.id,
                "original_video_id": original_video_id,
                "status": revision.status,
                "revision_request": revision.revision_request,
                "result_video_url": revision.result_video_url,
                "created_at": revision.created_at.isoformat(),
                "completed_at": revision.completed_at.isoformat() if revision.completed_at else None
            }
    
    return asyncio.run(get_status())


@celery_app.task
def batch_process_revisions(revision_data_list):
    """Process multiple revisions in batch"""
    
    results = []
    
    for revision_data in revision_data_list:
        try:
            result = process_revision.delay(
                revision_data["original_video_id"],
                revision_data["revision_request"], 
                revision_data["new_video_id"]
            )
            
            results.append({
                "original_video_id": revision_data["original_video_id"],
                "task_id": result.id,
                "status": "queued"
            })
            
        except Exception as e:
            logger.error(f"Error queuing revision for {revision_data['original_video_id']}: {e}")
            results.append({
                "original_video_id": revision_data["original_video_id"],
                "error": str(e),
                "status": "failed_to_queue"
            })
    
    return results


@celery_app.task
def analyze_revision_patterns():
    """Analyze common revision patterns for optimization"""
    
    from sqlalchemy import select, func
    from datetime import datetime, timedelta
    
    async def analyze():
        async with async_session_maker() as db:
            # Get revision patterns from last 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            
            result = await db.execute(
                select(
                    VideoRevision.revision_type,
                    func.count(VideoRevision.id).label('count')
                ).where(
                    VideoRevision.created_at >= cutoff_date
                ).group_by(VideoRevision.revision_type)
            )
            
            patterns = {row.revision_type: row.count for row in result}
            
            logger.info(f"Revision patterns (last 30 days): {patterns}")
            
            return patterns
    
    return asyncio.run(analyze())
