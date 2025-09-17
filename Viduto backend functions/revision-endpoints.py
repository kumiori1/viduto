import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.core.database import get_db
from app.models.video import Video, VideoRevision, VideoStatus
from app.schemas.video import RevisionRequest, RevisionResponse
from app.tasks.revision_tasks import process_revision, check_revision_status


router = APIRouter()


@router.post("/{video_id}/revisions", response_model=RevisionResponse)
async def create_revision(
    video_id: str,
    request: RevisionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a video revision - equivalent to n8n Revision workflow trigger
    """
    
    try:
        # Verify original video exists
        original_video = await db.get(Video, video_id)
        if not original_video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Original video not found"
            )
        
        if original_video.status != VideoStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Original video must be completed before requesting revision"
            )
        
        # Create revision record
        revision_id = str(uuid.uuid4())
        revision = VideoRevision(
            id=revision_id,
            video_id=video_id,
            revision_request=request.revision_request,
            revision_type="general",  # Could be enhanced to detect type
            status="pending"
        )
        
        db.add(revision)
        await db.commit()
        
        # Update original video status
        original_video.status = VideoStatus.REVISION_REQUESTED
        await db.commit()
        
        # Generate new video ID for the revision result
        new_video_id = str(uuid.uuid4())
        
        # Queue revision processing task
        task = process_revision.delay(video_id, request.revision_request, new_video_id)
        
        logger.info(f"Revision queued: {revision_id}, original: {video_id}, new: {new_video_id}, task: {task.id}")
        
        return RevisionResponse(
            revision_id=revision_id,
            status="pending",
            message="Revision processing started"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating revision: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create revision: {str(e)}"
        )


@router.get("/{video_id}/revisions")
async def list_revisions(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    List all revisions for a video
    """
    
    try:
        # Verify video exists
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Get all revisions for this video
        result = await db.execute(
            select(VideoRevision)
            .where(VideoRevision.video_id == video_id)
            .order_by(VideoRevision.created_at.desc())
        )
        revisions = result.scalars().all()
        
        return [
            {
                "revision_id": revision.id,
                "revision_request": revision.revision_request,
                "revision_type": revision.revision_type,
                "status": revision.status,
                "result_video_url": revision.result_video_url,
                "created_at": revision.created_at.isoformat(),
                "completed_at": revision.completed_at.isoformat() if revision.completed_at else None
            }
            for revision in revisions
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing revisions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list revisions"
        )


@router.get("/{video_id}/revisions/{revision_id}/status")
async def get_revision_status(
    video_id: str,
    revision_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get revision status
    """
    
    try:
        # Get revision from database
        revision = await db.get(VideoRevision, revision_id)
        if not revision or revision.video_id != video_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Revision not found"
            )
        
        return {
            "revision_id": revision_id,
            "original_video_id": video_id,
            "status": revision.status,
            "revision_request": revision.revision_request,
            "revision_type": revision.revision_type,
            "result_video_url": revision.result_video_url,
            "created_at": revision.created_at.isoformat(),
            "completed_at": revision.completed_at.isoformat() if revision.completed_at else None,
            "target_scene_number": revision.target_scene_number
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting revision status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get revision status"
        )


@router.post("/{video_id}/revisions/{revision_id}/retry")
async def retry_revision(
    video_id: str,
    revision_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retry a failed revision
    """
    
    try:
        # Get revision
        revision = await db.get(VideoRevision, revision_id)
        if not revision or revision.video_id != video_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Revision not found"
            )
        
        if revision.status != "failed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Revision is not in a failed state"
            )
        
        # Reset revision status
        revision.status = "pending"
        await db.commit()
        
        # Generate new video ID for retry
        new_video_id = str(uuid.uuid4())
        
        # Queue revision processing task
        task = process_revision.delay(video_id, revision.revision_request, new_video_id)
        
        logger.info(f"Revision retry queued: {revision_id}, task: {task.id}")
        
        return {
            "message": "Revision retry started",
            "task_id": task.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying revision: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry revision"
        )


@router.delete("/{video_id}/revisions/{revision_id}")
async def delete_revision(
    video_id: str,
    revision_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a revision record
    """
    
    try:
        revision = await db.get(VideoRevision, revision_id)
        if not revision or revision.video_id != video_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Revision not found"
            )
        
        await db.delete(revision)
        await db.commit()
        
        logger.info(f"Deleted revision {revision_id}")
        
        return {"message": "Revision deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting revision: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete revision"
        )


@router.get("/revisions/analytics")
async def get_revision_analytics(
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """
    Get revision analytics - most common revision types, success rates, etc.
    """
    
    try:
        from datetime import datetime, timedelta
        from sqlalchemy import func
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Most common revision types
        type_stats = await db.execute(
            select(
                VideoRevision.revision_type,
                func.count(VideoRevision.id).label('count')
            )
            .where(VideoRevision.created_at >= cutoff_date)
            .group_by(VideoRevision.revision_type)
            .order_by(func.count(VideoRevision.id).desc())
        )
        
        # Success rate by status
        status_stats = await db.execute(
            select(
                VideoRevision.status,
                func.count(VideoRevision.id).label('count')
            )
            .where(VideoRevision.created_at >= cutoff_date)
            .group_by(VideoRevision.status)
        )
        
        # Average processing time for completed revisions
        completed_revisions = await db.execute(
            select(
                func.avg(
                    func.extract('epoch', VideoRevision.completed_at - VideoRevision.created_at)
                ).label('avg_processing_time_seconds')
            )
            .where(
                VideoRevision.created_at >= cutoff_date,
                VideoRevision.status == "completed",
                VideoRevision.completed_at.isnot(None)
            )
        )
        
        avg_time = completed_revisions.scalar()
        
        return {
            "period_days": days,
            "revision_types": [{"type": row.revision_type, "count": row.count} for row in type_stats],
            "status_distribution": [{"status": row.status, "count": row.count} for row in status_stats],
            "average_processing_time_minutes": round(avg_time / 60, 2) if avg_time else None
        }
        
    except Exception as e:
        logger.error(f"Error getting revision analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get revision analytics"
        )
