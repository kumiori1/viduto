import asyncio
import httpx
from typing import Dict, List, Any
from loguru import logger
from app.core.config import settings


class ElevenLabsClient:
    """Client for ElevenLabs text-to-speech via FAL"""
    
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
    
    async def _wait_for_completion(self, request_id: str, max_wait: int = 120) -> Dict[str, Any]:
        """Wait for ElevenLabs request to complete"""
        status_url = f"{self.base_url}/fal-ai/elevenlabs/requests/{request_id}/status"
        result_url = f"{self.base_url}/fal-ai/elevenlabs/requests/{request_id}"
        
        start_time = asyncio.get_event_loop().time()
        
        while True:
            current_time = asyncio.get_event_loop().time()
            if current_time - start_time > max_wait:
                raise TimeoutError(f"ElevenLabs request {request_id} timed out")
            
            try:
                status_response = await self._make_request("GET", status_url)
                status = status_response.get("status")
                
                logger.info(f"ElevenLabs request {request_id} status: {status}")
                
                if status == "COMPLETED":
                    result = await self._make_request("GET", result_url)
                    return result
                elif status == "FAILED":
                    raise Exception(f"ElevenLabs request failed: {status_response}")
                elif status in ["IN_PROGRESS", "IN_QUEUE"]:
                    await asyncio.sleep(5)
                else:
                    await asyncio.sleep(3)
                    
            except Exception as e:
                logger.error(f"Error checking ElevenLabs status for {request_id}: {e}")
                await asyncio.sleep(3)
    
    async def text_to_speech(
        self, 
        text: str, 
        voice: str = "Rachel",
        output_format: str = "mp3"
    ) -> str:
        """Convert text to speech using ElevenLabs TTS Turbo v2.5"""
        payload = {
            "text": text,
            "voice": voice,
            "output_format": output_format
        }
        
        url = f"{self.base_url}/fal-ai/elevenlabs/tts/turbo-v2.5"
        response = await self._make_request("POST", url, json=payload)
        request_id = response["request_id"]
        
        result = await self._wait_for_completion(request_id)
        return result["audio"]["url"]
    
    async def batch_text_to_speech(self, texts: List[str], voice: str = "Rachel") -> List[str]:
        """Convert multiple texts to speech in batch"""
        tasks = []
        for text in texts:
            tasks.append(self.text_to_speech(text, voice))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        audio_urls = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Failed to generate TTS for text {i}: {result}")
                audio_urls.append(None)
            else:
                audio_urls.append(result)
        
        return audio_urls
