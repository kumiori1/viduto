import asyncio
import httpx
from typing import Dict, List, Any
from loguru import logger
from app.core.config import settings


class LyriaClient:
    """Client for Lyria2 music generation via FAL"""
    
    def __init__(self):
        self.api_key = settings.FAL_API_KEY
        self.base_url = "https://queue.fal.run"
        self.headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def _make_request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request"""
        async with httpx.AsyncClient() as client:
            response = await client.request(method, url, headers=self.headers, **kwargs)
            response.raise_for_status()
            return response.json()
    
    async def _wait_for_completion(self, request_id: str, max_wait: int = 300) -> Dict[str, Any]:
        """Wait for Lyria request to complete"""
        status_url = f"{self.base_url}/fal-ai/lyria2/requests/{request_id}/status"
        result_url = f"{self.base_url}/fal-ai/lyria2/requests/{request_id}"
        
        start_time = asyncio.get_event_loop().time()
        
        while True:
            current_time = asyncio.get_event_loop().time()
            if current_time - start_time > max_wait:
                raise TimeoutError(f"Lyria request {request_id} timed out")
            
            try:
                status_response = await self._make_request("GET", status_url)
                status = status_response.get("status")
                
                logger.info(f"Lyria request {request_id} status: {status}")
                
                if status == "COMPLETED":
                    result = await self._make_request("GET", result_url)
                    return result
                elif status == "FAILED":
                    raise Exception(f"Lyria request failed: {status_response}")
                elif status in ["IN_PROGRESS", "IN_QUEUE"]:
                    await asyncio.sleep(10)
                else:
                    await asyncio.sleep(5)
                    
            except Exception as e:
                logger.error(f"Error checking Lyria status for {request_id}: {e}")
                await asyncio.sleep(5)
    
    async def generate_music(
        self, 
        prompt: str, 
        negative_prompt: str = "vocals, slow tempo",
        duration: int = 30
    ) -> str:
        """Generate background music using Lyria2"""
        
        # Combine all music directions into one prompt
        combined_prompt = f"{prompt} (no words only melody)"
        
        payload = {
            "prompt": combined_prompt,
            "negative_prompt": negative_prompt
        }
        
        url = f"{self.base_url}/fal-ai/lyria2"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id)
        return result["audio"]["url"]
    
    async def generate_music_from_scenes(self, scenes: List[Dict[str, Any]]) -> str:
        """Generate music from scene music directions"""
        
        # Extract music directions from all scenes
        music_directions = []
        for scene in scenes:
            music_direction = scene.get('music_direction', '')
            sound_effects = scene.get('sound_effects', '')
            if music_direction:
                music_directions.append(music_direction)
            if sound_effects and 'music' in sound_effects.lower():
                music_directions.append(sound_effects)
        
        # Combine all directions
        combined_prompt = " ".join(music_directions)
        
        # Clean up the prompt
        if not combined_prompt.strip():
            combined_prompt = "cinematic orchestral background music, uplifting and premium atmosphere"
        
        return await self.generate_music(combined_prompt)
