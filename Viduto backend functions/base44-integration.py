import httpx
from typing import Optional
from loguru import logger
from app.core.config import settings
from app.core.database import async_session_maker
from app.models.video import Video


class Base44Service:
    """Service for Base44 integration - handles callbacks and notifications"""
    
    def __init__(self):
        self.callback_url = settings.BASE44_CALLBACK_URL
    
    async def notify_video_completion(
        self, 
        video_id: str, 
        video_url: str,
        is_revision: bool = False
    ):
        """Notify Base44 when video is completed - equivalent to n8n HTTP Request33"""
        
        try:
            # Get video details from database
            async with async_session_maker() as db:
                video = await db.get(Video, video_id)
                if not video:
                    logger.error(f"Video {video_id} not found for Base44 callback")
                    return
                
                # Prepare callback payload
                payload = {
                    "video_id": video_id,
                    "chat_id": video.chat_id,
                    "user_id": video.user_id,
                    "video_url": video_url,
                    "is_revision": is_revision
                }
                
                # For file upload callback (original n8n used multipart form)
                # We'll use JSON for simplicity, but can be changed to multipart if needed
                if not is_revision:
                    # This was the original HTTP Request33 format
                    async with httpx.AsyncClient() as client:
                        # Download the video file
                        video_response = await client.get(video_url)
                        video_response.raise_for_status()
                        
                        # Upload as multipart form data
                        files = {"file": ("video.mp4", video_response.content, "video/mp4")}
                        data = {
                            "video_id": video_id,
                            "chat_id": video.chat_id or "",
                            "user_id": video.user_id
                        }
                        
                        response = await client.post(
                            self.callback_url,
                            files=files,
                            data=data,
                            timeout=120.0
                        )
                        response.raise_for_status()
                        
                        logger.info(f"Successfully notified Base44 for video {video_id}")
                else:
                    # For revisions, send JSON payload
                    async with httpx.AsyncClient() as client:
                        response = await client.post(
                            self.callback_url,
                            json=payload,
                            timeout=60.0
                        )
                        response.raise_for_status()
                        
                        logger.info(f"Successfully notified Base44 for revision {video_id}")
                
        except Exception as e:
            logger.error(f"Error notifying Base44 for video {video_id}: {e}")
            # Don't raise exception - video generation succeeded, just callback failed
    
    async def notify_video_error(self, video_id: str, error_message: str):
        """Notify Base44 when video generation fails"""
        
        try:
            async with async_session_maker() as db:
                video = await db.get(Video, video_id)
                if not video:
                    return
                
                payload = {
                    "video_id": video_id,
                    "chat_id": video.chat_id,
                    "user_id": video.user_id,
                    "error": error_message,
                    "status": "failed"
                }
                
                async with httpx.AsyncClient() as client:
                    # Assuming Base44 has an error endpoint
                    error_url = self.callback_url.replace("n8nVideoCallback", "n8nVideoError") 
                    response = await client.post(
                        error_url,
                        json=payload,
                        timeout=60.0
                    )
                    
                    logger.info(f"Notified Base44 of error for video {video_id}")
                    
        except Exception as e:
            logger.error(f"Error notifying Base44 of error for video {video_id}: {e}")
