import asyncio
import httpx
from typing import Dict, List, Optional, Any
from loguru import logger
from app.core.config import settings


class FALClient:
    """Client for FAL AI services - handles image processing, video generation, and composition"""
    
    def __init__(self):
        self.api_key = settings.FAL_API_KEY
        self.base_url = "https://queue.fal.run"
        self.headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request with retry logic"""
        async with httpx.AsyncClient() as client:
            response = await client.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()
            return response.json()
    
    async def _wait_for_completion(self, request_id: str, endpoint: str, max_wait: int = 300) -> Dict[str, Any]:
        """Wait for FAL request to complete"""
        status_url = f"{self.base_url}/{endpoint}/requests/{request_id}/status"
        result_url = f"{self.base_url}/{endpoint}/requests/{request_id}"
        
        start_time = asyncio.get_event_loop().time()
        
        while True:
            current_time = asyncio.get_event_loop().time()
            if current_time - start_time > max_wait:
                raise TimeoutError(f"Request {request_id} timed out after {max_wait} seconds")
            
            try:
                status_response = await self._make_request("GET", status_url)
                status = status_response.get("status")
                
                logger.info(f"FAL request {request_id} status: {status}")
                
                if status == "COMPLETED":
                    result = await self._make_request("GET", result_url)
                    return result
                elif status == "FAILED":
                    raise Exception(f"FAL request failed: {status_response}")
                elif status in ["IN_PROGRESS", "IN_QUEUE"]:
                    await asyncio.sleep(10)  # Wait 10 seconds before checking again
                else:
                    await asyncio.sleep(5)
                    
            except Exception as e:
                logger.error(f"Error checking status for request {request_id}: {e}")
                await asyncio.sleep(5)
    
    async def reframe_image(self, image_url: str, aspect_ratio: str = "9:16") -> str:
        """Reframe image to 9:16 aspect ratio using Luma Photon"""
        payload = {
            "image_url": image_url,
            "aspect_ratio": aspect_ratio,
            "prompt": "Resize this image to a 9:16 aspect ratio. Automatically detect the background and extend it seamlessly to fill the extra space, keeping the subject untouched. Do not stretch or distort the subject, only expand the natural background so the final image looks natural and consistent."
        }
        
        url = f"{self.base_url}/fal-ai/luma-photon/reframe"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/luma-photon")
        return result["images"][0]["url"]
    
    async def enhance_image_with_gemini(self, image_url: str, visual_description: str) -> str:
        """Enhance image using Gemini 2.5 Flash"""
        payload = {
            "prompt": visual_description,
            "image_urls": [image_url],
            "aspect_ratio": "9:16"
        }
        
        url = f"{self.base_url}/fal-ai/gemini-25-flash-image/edit"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/gemini-25-flash-image")
        return result["images"][0]["url"]
    
    async def generate_video_from_image(
        self, 
        image_url: str, 
        prompt: str, 
        duration: str = "6",
        resolution: str = "768P"
    ) -> str:
        """Generate video from image using Minimax Hailuo"""
        payload = {
            "prompt": prompt.replace('"', '\\"').replace('\n', ' '),
            "image_url": image_url,
            "duration": duration,
            "prompt_optimizer": True,
            "resolution": resolution
        }
        
        url = f"{self.base_url}/fal-ai/minimax/hailuo-02/standard/image-to-video"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/minimax/hailuo-02/standard/image-to-video", max_wait=600)
        return result["video"]["url"]
    
    async def compose_videos(self, video_urls: List[str], mode: str = "concat") -> str:
        """Compose multiple videos into one"""
        if mode == "concat":
            keyframes = []
            for i, url in enumerate(video_urls):
                keyframes.append({
                    "url": url,
                    "timestamp": i * 6,
                    "duration": 6
                })
            
            tracks = [{
                "id": "main",
                "type": "video", 
                "keyframes": keyframes
            }]
        else:
            tracks = []
            for i, url in enumerate(video_urls):
                tracks.append({
                    "id": f"video{i + 1}",
                    "type": "video",
                    "keyframes": [{
                        "url": url,
                        "timestamp": i * 6,
                        "duration": 6
                    }]
                })
        
        payload = {
            "compose_mode": mode,
            "tracks": tracks
        }
        
        url = f"{self.base_url}/fal-ai/ffmpeg-api/compose"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/ffmpeg-api", max_wait=600)
        return result["video_url"]
    
    async def compose_video_with_audio(
        self, 
        video_url: str, 
        audio_urls: List[str], 
        background_music_url: Optional[str] = None
    ) -> str:
        """Compose video with voiceover and background music"""
        tracks = [
            {
                "id": "video_main",
                "type": "video",
                "keyframes": [{
                    "url": video_url,
                    "timestamp": 0,
                    "duration": 36,
                    "include_audio": False
                }]
            },
            {
                "id": "voiceover",
                "type": "audio",
                "keyframes": [
                    {"url": audio_urls[i], "timestamp": i * 6, "duration": 6, "volume": 1.0}
                    for i in range(min(5, len(audio_urls)))
                ]
            }
        ]
        
        if background_music_url:
            tracks.append({
                "id": "background_music",
                "type": "audio",
                "keyframes": [{
                    "url": background_music_url,
                    "timestamp": 0,
                    "duration": 36,
                    "volume": 0.1
                }]
            })
        
        payload = {
            "compose_mode": "timeline",
            "tracks": tracks
        }
        
        url = f"{self.base_url}/fal-ai/ffmpeg-api/compose"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/ffmpeg-api", max_wait=600)
        return result["video_url"]
    
    async def add_captions(
        self,
        video_url: str,
        font_url: str = "https://nvrjvjxtfwdtuyvysnyz.supabase.co/storage/v1/object/public/font/Poppins-Bold.ttf",
        font_size: int = 35
    ) -> str:
        """Add auto-generated captions to video"""
        payload = {
            "video_url": video_url,
            "txt_color": "white",
            "txt_font": font_url,
            "font_size": font_size,
            "stroke_width": 1,
            "left_align": "center",
            "top_align": "center",
            "refresh_interval": 0.6
        }
        
        url = f"{self.base_url}/fal-ai/auto-caption"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/auto-caption", max_wait=600)
        return result["video_url"]
    
    async def normalize_audio(self, audio_url: str, offset: int = -15) -> str:
        """Normalize audio levels using loudnorm"""
        payload = {
            "audio_url": audio_url,
            "offset": offset
        }
        
        url = f"{self.base_url}/fal-ai/ffmpeg-api/loudnorm"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id, "fal-ai/ffmpeg-api")
        return result["audio"]["url"]