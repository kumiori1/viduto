import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.core.database import get_db
from app.models.video import Video, VideoStatus
from app.schemas.video import VideoWebhookRequest, RevisionWebhookRequest
from app.tasks.video_tasks import generate_video
from app.tasks.revision_tasks import process_revision


router = APIRouter()


@router.post("/video-generation")
async def video_generation_webhook(
    request: VideoWebhookRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Video generation webhook - equivalent to n8n Webhook2 (Main Video Ad trigger)
    This replaces: POST https://n8n.example.com/webhook/5d109062-fa9e-406d-b43a-b5df3b385c0c
    """
    
    try:
        logger.info(f"Received video generation webhook for user {request.user_id}")
        
        # Create video record with provided ID or generate new one
        video_id = request.video_id if hasattr(request, 'video_id') and request.video_id else str(uuid.uuid4())
        
        video = Video(
            id=video_id,
            user_id=request.user_id,
            chat_id=request.chat_id,
            prompt=request.prompt,
            image_url=request.image_url,
            status=VideoStatus.PENDING
        )
        
        db.add(video)
        await db.commit()
        
        # Queue video generation
        task = generate_video.delay(video_id)
        
        logger.info(f"Video generation webhook processed: {video_id}, task: {task.id}")
        
        return {
            "video_id": video_id,
            "status": "processing",
            "message": "Video generation started",
            "task_id": task.id
        }
        
    except Exception as e:
        logger.error(f"Error processing video generation webhook: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process video generation webhook: {str(e)}"
        )


@router.post("/revision")
async def revision_webhook(
    request: RevisionWebhookRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Revision webhook - equivalent to n8n Webhook (Revision workflow trigger)  
    This replaces: POST https://n8n.example.com/webhook/1949f7a3-6527-473c-9234-d325606233ee
    """
    
    try:
        logger.info(f"Received revision webhook for video {request.original_video_id}")
        
        # Verify original video exists
        original_video = await db.get(Video, request.original_video_id)
        if not original_video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Original video not found"
            )
        
        # Update original video status
        original_video.status = VideoStatus.PROCESSING_REVISION
        await db.commit()
        
        # Queue revision processing
        task = process_revision.delay(
            request.original_video_id,
            request.revision_request, 
            request.video_id
        )
        
        logger.info(f"Revision webhook processed: {request.original_video_id} -> {request.video_id}, task: {task.id}")
        
        return {
            "original_video_id": request.original_video_id,
            "new_video_id": request.video_id,
            "status": "processing",
            "message": "Revision processing started",
            "task_id": task.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing revision webhook: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process revision webhook: {str(e)}"
        )


@router.post("/status-check")
async def status_check_webhook(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Generic status check webhook
    """
    
    try:
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        return {
            "video_id": video_id,
            "status": video.status.value,
            "final_video_url": video.final_video_url,
            "error_message": video.error_message,
            "created_at": video.created_at.isoformat(),
            "updated_at": video.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in status check webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check status"
        )


@router.post("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    
    try:
        # Could add database connectivity check here
        return {
            "status": "healthy",
            "service": "video-ai-backend",
            "version": "1.0.0"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy"
        )


# Legacy webhook endpoints for backward compatibility with existing Base44 integrations
@router.post("/legacy/main-video-ad")
async def legacy_main_video_webhook(
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Legacy webhook endpoint for backward compatibility
    Maps old n8n webhook format to new format
    """
    
    try:
        # Map legacy request format to new format
        mapped_request = VideoWebhookRequest(
            prompt=request.get("prompt", ""),
            image_url=request.get("image_url", ""),
            user_id=request.get("user_id", ""),
            chat_id=request.get("chat_id"),
            video_id=request.get("video_id", str(uuid.uuid4()))
        )
        
        return await video_generation_webhook(mapped_request, db)
        
    except Exception as e:
        logger.error(f"Error processing legacy webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process legacy webhook: {str(e)}"
        )


@router.post("/legacy/revision")
async def legacy_revision_webhook(
    request: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    Legacy revision webhook for backward compatibility
    """
    
    try:
        # Map legacy request format to new format
        mapped_request = RevisionWebhookRequest(
            revision_request=request.get("revision_request", ""),
            original_video_id=request.get("original_video_id", ""),
            video_id=request.get("video_id", str(uuid.uuid4())),
            chat_id=request.get("chat_id"),
            user_id=request.get("user_id", "")
        )
        
        return await revision_webhook(mapped_request, db)
        
    except Exception as e:
        logger.error(f"Error processing legacy revision webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process legacy revision webhook: {str(e)}"
        )
