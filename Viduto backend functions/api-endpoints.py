import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger

from app.core.database import get_db
from app.models.video import Video, Scene, Music, VideoStatus
from app.schemas.video import (
    VideoGenerationRequest, VideoGenerationResponse, VideoStatusResponse,
    Video as VideoSchema, Scene as SceneSchema, Music as MusicSchema
)
from app.tasks.video_tasks import generate_video, check_video_status


router = APIRouter()


@router.post("/generate", response_model=VideoGenerationResponse)
async def create_video(
    request: VideoGenerationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new video - equivalent to n8n Main Video Ad workflow trigger
    """
    
    try:
        # Create video record
        video_id = str(uuid.uuid4())
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
        
        # Queue video generation task
        task = generate_video.delay(video_id)
        
        logger.info(f"Video generation queued: {video_id}, task: {task.id}")
        
        return VideoGenerationResponse(
            video_id=video_id,
            status=VideoStatus.PENDING,
            message="Video generation started"
        )
        
    except Exception as e:
        logger.error(f"Error creating video: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create video: {str(e)}"
        )


@router.get("/{video_id}/status", response_model=VideoStatusResponse)
async def get_video_status(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get video generation status and details
    """
    
    try:
        # Get video from database
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Get scenes
        scenes_result = await db.execute(
            select(Scene).where(Scene.video_id == video_id).order_by(Scene.scene_number)
        )
        scenes = [SceneSchema.from_orm(scene) for scene in scenes_result.scalars().all()]
        
        # Get music
        music_result = await db.execute(
            select(Music).where(Music.video_id == video_id)
        )
        music_obj = music_result.scalar_one_or_none()
        music = MusicSchema.from_orm(music_obj) if music_obj else None
        
        # Get progress information
        progress = _get_progress_info(video.status)
        
        return VideoStatusResponse(
            video_id=video_id,
            status=video.status,
            final_video_url=video.final_video_url,
            error_message=video.error_message,
            progress=progress,
            scenes=scenes,
            music=music
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get video status"
        )


@router.get("/{video_id}", response_model=VideoSchema)
async def get_video(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get complete video information including scenes and music
    """
    
    try:
        # Get video with relationships
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Load relationships
        await db.refresh(video, ["scenes", "music"])
        
        return VideoSchema.from_orm(video)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting video: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get video"
        )


@router.get("/", response_model=List[VideoSchema])
async def list_videos(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    status_filter: Optional[VideoStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    List videos for a user
    """
    
    try:
        # Build query
        query = select(Video).where(Video.user_id == user_id)
        
        if status_filter:
            query = query.where(Video.status == status_filter)
        
        query = query.order_by(Video.created_at.desc()).limit(limit).offset(offset)
        
        # Execute query
        result = await db.execute(query)
        videos = result.scalars().all()
        
        # Load relationships for each video
        for video in videos:
            await db.refresh(video, ["scenes", "music"])
        
        return [VideoSchema.from_orm(video) for video in videos]
        
    except Exception as e:
        logger.error(f"Error listing videos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list videos"
        )


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a video and all associated data
    """
    
    try:
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        # Delete video (cascades to scenes, music, etc.)
        await db.delete(video)
        await db.commit()
        
        logger.info(f"Deleted video {video_id}")
        
        return {"message": "Video deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting video: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete video"
        )


@router.post("/{video_id}/retry")
async def retry_video_generation(
    video_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retry failed video generation
    """
    
    try:
        video = await db.get(Video, video_id)
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )
        
        if video.status not in [VideoStatus.FAILED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Video is not in a failed state"
            )
        
        # Reset video status
        video.status = VideoStatus.PENDING
        video.error_message = None
        await db.commit()
        
        # Queue new generation task
        task = generate_video.delay(video_id)
        
        logger.info(f"Video generation retry queued: {video_id}, task: {task.id}")
        
        return {
            "message": "Video generation retry started",
            "task_id": task.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying video generation: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry video generation"
        )


def _get_progress_info(status: VideoStatus) -> dict:
    """Get progress information based on video status"""
    
    progress_map = {
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
        VideoStatus.REVISION_REQUESTED: {"current": 0, "total": 5, "message": "Revision requested"},
        VideoStatus.PROCESSING_REVISION: {"current": 2, "total": 5, "message": "Processing revision..."},
    }
    
    return progress_map.get(status, {"current": 0, "total": 7, "message": "Unknown status"})