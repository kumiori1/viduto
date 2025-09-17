import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.video import Video, Scene, Music, VideoStatus
from app.services.ai_clients.openai_client import OpenAIClient
from app.services.ai_clients.fal_client import FALClient
from app.services.ai_clients.elevenlabs_client import ElevenLabsClient
from app.services.ai_clients.lyria_client import LyriaClient
from app.services.base44_integration import Base44Service
from app.schemas.video import AISceneOutput


class VideoGenerationPipeline:
    """Main video generation pipeline - converts n8n workflow to Python"""
    
    def __init__(self):
        self.openai = OpenAIClient()
        self.fal = FALClient()
        self.elevenlabs = ElevenLabsClient()
        self.lyria = LyriaClient()
        self.base44 = Base44Service()
    
    async def generate_video(self, video_id: str) -> str:
        """Main video generation pipeline - equivalent to the entire n8n Main Video Ad workflow"""
        
        try:
            async with async_session_maker() as db:
                # Get video from database
                video = await self._get_video(db, video_id)
                if not video:
                    raise ValueError(f"Video {video_id} not found")
                
                logger.info(f"Starting video generation for {video_id}")
                
                # Phase 1: Script Generation (AI Agent1 equivalent)
                await self._update_video_status(db, video_id, VideoStatus.PROCESSING_SCRIPT)
                script_output = await self.openai.generate_video_script(video.prompt)
                await self._create_scenes(db, video_id, script_output.scenes)
                
                # Phase 2: Image Processing
                await self._update_video_status(db, video_id, VideoStatus.PROCESSING_IMAGES)
                processed_image_url = await self._process_base_image(video.image_url)
                
                # Phase 3: Scene Image Enhancement and Video Generation
                await self._update_video_status(db, video_id, VideoStatus.GENERATING_SCENES)
                scenes = await self._get_video_scenes(db, video_id)
                await self._generate_scene_videos(db, scenes, processed_image_url)
                
                # Phase 4: Voice Generation
                await self._update_video_status(db, video_id, VideoStatus.GENERATING_VOICEOVERS)
                await self._generate_voiceovers(db, scenes)
                
                # Phase 5: Music Generation
                await self._update_video_status(db, video_id, VideoStatus.GENERATING_MUSIC)
                background_music_url = await self._generate_background_music(db, video_id, scenes)
                
                # Phase 6: Video Composition
                await self._update_video_status(db, video_id, VideoStatus.COMPOSING_VIDEO)
                final_video_url = await self._compose_final_video(db, video_id, scenes, background_music_url)
                
                # Phase 7: Caption Addition
                await self._update_video_status(db, video_id, VideoStatus.ADDING_CAPTIONS)
                captioned_video_url = await self.fal.add_captions(final_video_url)
                
                # Update final video URL
                await self._update_final_video_url(db, video_id, captioned_video_url)
                await self._update_video_status(db, video_id, VideoStatus.COMPLETED)
                
                # Notify Base44 (equivalent to n8n callback)
                await self.base44.notify_video_completion(video_id, captioned_video_url)
                
                logger.info(f"Video generation completed for {video_id}: {captioned_video_url}")
                return captioned_video_url
                
        except Exception as e:
            logger.error(f"Error generating video {video_id}: {e}")
            async with async_session_maker() as db:
                await self._update_video_status(db, video_id, VideoStatus.FAILED, str(e))
            raise
    
    async def _process_base_image(self, image_url: str) -> str:
        """Process the base image - reframe to 9:16 aspect ratio"""
        logger.info(f"Processing base image: {image_url}")
        
        # Step 1: Reframe to 9:16 using Luma Photon (equivalent to HTTP Request35)
        reframed_url = await self.fal.reframe_image(image_url, "9:16")
        logger.info(f"Image reframed: {reframed_url}")
        
        return reframed_url
    
    async def _create_scenes(self, db: AsyncSession, video_id: str, ai_scenes: List[AISceneOutput]):
        """Create scene records in database"""
        for scene_data in ai_scenes:
            scene = Scene(
                video_id=video_id,
                scene_number=scene_data.scene_number,
                visual_description=scene_data.visual_description,
                voiceover=scene_data.voiceover,
                sound_effects=scene_data.sound_effects,
                music_direction=scene_data.music_direction,
                shot_type=scene_data.shot_type
            )
            db.add(scene)
        await db.commit()
        logger.info(f"Created {len(ai_scenes)} scenes for video {video_id}")
    
    async def _generate_scene_videos(self, db: AsyncSession, scenes: List[Scene], base_image_url: str):
        """Generate videos for each scene"""
        tasks = []
        
        for scene in scenes:
            # Enhance image with scene description (equivalent to HTTP Request34)
            task = self._process_single_scene(db, scene, base_image_url)
            tasks.append(task)
        
        # Process all scenes concurrently
        await asyncio.gather(*tasks)
        logger.info(f"Generated videos for {len(scenes)} scenes")
    
    async def _process_single_scene(self, db: AsyncSession, scene: Scene, base_image_url: str):
        """Process a single scene - enhance image and generate video"""
        try:
            # Step 1: Enhance image with scene description
            enhanced_image_url = await self.fal.enhance_image_with_gemini(
                base_image_url, 
                scene.visual_description
            )
            
            # Update scene with enhanced image
            scene.image_url = enhanced_image_url
            await db.commit()
            
            # Step 2: Generate video from enhanced image
            video_prompt = f"Do not add caption to the video voiceover:{scene.voiceover} visual_description:{scene.visual_description}"
            scene_video_url = await self.fal.generate_video_from_image(
                enhanced_image_url,
                video_prompt,
                duration="6",
                resolution="768P"
            )
            
            # Update scene with video URL
            scene.scene_clip_url = scene_video_url
            await db.commit()
            
            logger.info(f"Generated video for scene {scene.scene_number}: {scene_video_url}")
            
        except Exception as e:
            logger.error(f"Error processing scene {scene.scene_number}: {e}")
            raise
    
    async def _generate_voiceovers(self, db: AsyncSession, scenes: List[Scene]):
        """Generate voiceovers for all scenes"""
        # Collect all voiceover texts
        texts = [scene.voiceover for scene in scenes if scene.voiceover]
        
        # Generate all voiceovers in parallel
        audio_urls = await self.elevenlabs.batch_text_to_speech(texts)
        
        # Update scenes with audio URLs
        for i, scene in enumerate(scenes):
            if i < len(audio_urls) and audio_urls[i]:
                scene.voiceover_url = audio_urls[i]
        
        await db.commit()
        logger.info(f"Generated voiceovers for {len(audio_urls)} scenes")
    
    async def _generate_background_music(self, db: AsyncSession, video_id: str, scenes: List[Scene]) -> str:
        """Generate background music from scene music directions"""
        
        # Generate music using Lyria2
        music_url = await self.lyria.generate_music_from_scenes(
            [{"music_direction": scene.music_direction, "sound_effects": scene.sound_effects} 
             for scene in scenes]
        )
        
        # Normalize audio levels
        processed_music_url = await self.fal.normalize_audio(music_url, offset=-13)
        
        # Save to database
        music = Music(
            video_id=video_id,
            music_url=music_url,
            processed_music_url=processed_music_url
        )
        db.add(music)
        await db.commit()
        
        logger.info(f"Generated background music: {processed_music_url}")
        return processed_music_url
    
    async def _compose_final_video(
        self, 
        db: AsyncSession, 
        video_id: str, 
        scenes: List[Scene], 
        background_music_url: str
    ) -> str:
        """Compose the final video with all elements"""
        
        # Step 1: Compose all scene videos into one timeline video
        scene_video_urls = [scene.scene_clip_url for scene in scenes if scene.scene_clip_url]
        merged_video_url = await self.fal.compose_videos(scene_video_urls, mode="concat")
        
        # Step 2: Add voiceovers and background music
        voiceover_urls = [scene.voiceover_url for scene in scenes if scene.voiceover_url]
        final_video_url = await self.fal.compose_video_with_audio(
            merged_video_url,
            voiceover_urls,
            background_music_url
        )
        
        logger.info(f"Composed final video: {final_video_url}")
        return final_video_url
    
    # Helper methods
    async def _get_video(self, db: AsyncSession, video_id: str) -> Optional[Video]:
        """Get video by ID"""
        result = await db.get(Video, video_id)
        return result
    
    async def _get_video_scenes(self, db: AsyncSession, video_id: str) -> List[Scene]:
        """Get all scenes for a video"""
        from sqlalchemy import select
        result = await db.execute(
            select(Scene).where(Scene.video_id == video_id).order_by(Scene.scene_number)
        )
        return list(result.scalars().all())
    
    async def _update_video_status(
        self, 
        db: AsyncSession, 
        video_id: str, 
        status: VideoStatus, 
        error_message: Optional[str] = None
    ):
        """Update video status"""
        video = await db.get(Video, video_id)
        if video:
            video.status = status
            if error_message:
                video.error_message = error_message
            await db.commit()
            logger.info(f"Updated video {video_id} status to {status}")
    
    async def _update_final_video_url(self, db: AsyncSession, video_id: str, video_url: str):
        """Update final video URL"""
        video = await db.get(Video, video_id)
        if video:
            video.final_video_url = video_url
            await db.commit()
