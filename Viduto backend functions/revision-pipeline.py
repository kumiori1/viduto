from typing import List, Dict, Any, Optional
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import async_session_maker
from app.models.video import Video, Scene, Music, VideoStatus, VideoRevision
from app.services.ai_clients.openai_client import OpenAIClient
from app.services.ai_clients.fal_client import FALClient
from app.services.ai_clients.elevenlabs_client import ElevenLabsClient
from app.services.ai_clients.lyria_client import LyriaClient
from app.services.base44_integration import Base44Service


class RevisionPipeline:
    """Video revision pipeline - equivalent to n8n Revision workflow"""
    
    def __init__(self):
        self.openai = OpenAIClient()
        self.fal = FALClient()
        self.elevenlabs = ElevenLabsClient()
        self.lyria = LyriaClient()
        self.base44 = Base44Service()
    
    async def process_revision(self, video_id: str, revision_request: str, new_video_id: str) -> str:
        """Process video revision - equivalent to entire n8n Revision workflow"""
        
        try:
            async with async_session_maker() as db:
                # Get original video and scenes
                original_video = await self._get_video(db, video_id)
                if not original_video:
                    raise ValueError(f"Original video {video_id} not found")
                
                # Create revision record
                revision = VideoRevision(
                    video_id=video_id,
                    revision_request=revision_request,
                    revision_type="general"
                )
                db.add(revision)
                await db.commit()
                
                logger.info(f"Starting revision for video {video_id} with request: {revision_request}")
                
                # Get all existing scenes
                scenes = await self._get_video_scenes(db, video_id)
                scene_dicts = [self._scene_to_dict(scene) for scene in scenes]
                
                # Phase 1: Analyze revision request using AI
                changes = await self.openai.analyze_revision_request(
                    revision_request, 
                    scene_dicts, 
                    video_id
                )
                
                logger.info(f"AI identified changes: {changes}")
                
                # Phase 2: Apply changes to scenes
                updated_scenes = []
                needs_video_regeneration = False
                needs_voiceover_regeneration = False  
                needs_music_regeneration = False
                
                for change in changes:
                    scene_number = change.get("scene_number")
                    changed_fields = change.get("changed", {})
                    
                    scene = next((s for s in scenes if s.scene_number == scene_number), None)
                    if not scene:
                        logger.warning(f"Scene {scene_number} not found for revision")
                        continue
                    
                    # Apply changes to scene
                    for field, _ in changed_fields.items():
                        if field == "visual_description":
                            needs_video_regeneration = True
                        elif field == "voiceover":
                            needs_voiceover_regeneration = True
                        elif field in ["music_direction", "sound_effects"]:
                            needs_music_regeneration = True
                    
                    updated_scenes.append((scene, changed_fields))
                
                # Phase 3: Regenerate affected content
                if needs_video_regeneration:
                    await self._regenerate_scene_videos(db, updated_scenes, original_video.image_url)
                
                if needs_voiceover_regeneration:
                    await self._regenerate_voiceovers(db, updated_scenes)
                
                if needs_music_regeneration:
                    await self._regenerate_background_music(db, video_id, scenes)
                
                # Phase 4: Recompose final video
                final_video_url = await self._recompose_video(db, video_id)
                
                # Phase 5: Add captions
                captioned_video_url = await self.fal.add_captions(final_video_url)
                
                # Update revision record
                revision.status = "completed"
                revision.result_video_url = captioned_video_url
                await db.commit()
                
                # Notify Base44
                await self.base44.notify_video_completion(
                    new_video_id, 
                    captioned_video_url, 
                    is_revision=True
                )
                
                logger.info(f"Revision completed: {captioned_video_url}")
                return captioned_video_url
                
        except Exception as e:
            logger.error(f"Error processing revision for {video_id}: {e}")
            async with async_session_maker() as db:
                revision.status = "failed"
                await db.commit()
            raise
    
    async def _regenerate_scene_videos(
        self, 
        db: AsyncSession, 
        updated_scenes: List[tuple], 
        base_image_url: str
    ):
        """Regenerate videos for scenes with visual changes"""
        
        for scene, changed_fields in updated_scenes:
            if "visual_description" in changed_fields:
                try:
                    logger.info(f"Regenerating video for scene {scene.scene_number}")
                    
                    # Get the current scene data (which should be updated by AI)
                    await db.refresh(scene)
                    
                    # Generate new video
                    video_prompt = f"Do not add caption to the video voiceover:{scene.voiceover} visual_description:{scene.visual_description}"
                    new_video_url = await self.fal.generate_video_from_image(
                        scene.image_url or base_image_url,
                        video_prompt,
                        duration="6",
                        resolution="768P"
                    )
                    
                    # Update scene
                    scene.scene_clip_url = new_video_url
                    await db.commit()
                    
                    logger.info(f"Regenerated video for scene {scene.scene_number}: {new_video_url}")
                    
                except Exception as e:
                    logger.error(f"Error regenerating video for scene {scene.scene_number}: {e}")
    
    async def _regenerate_voiceovers(self, db: AsyncSession, updated_scenes: List[tuple]):
        """Regenerate voiceovers for scenes with voiceover changes"""
        
        voiceover_tasks = []
        scenes_to_update = []
        
        for scene, changed_fields in updated_scenes:
            if "voiceover" in changed_fields:
                await db.refresh(scene)  # Get latest data
                if scene.voiceover:
                    voiceover_tasks.append(self.elevenlabs.text_to_speech(scene.voiceover))
                    scenes_to_update.append(scene)
        
        if voiceover_tasks:
            try:
                audio_urls = await asyncio.gather(*voiceover_tasks)
                
                for i, scene in enumerate(scenes_to_update):
                    if i < len(audio_urls) and audio_urls[i]:
                        scene.voiceover_url = audio_urls[i]
                        logger.info(f"Regenerated voiceover for scene {scene.scene_number}")
                
                await db.commit()
                
            except Exception as e:
                logger.error(f"Error regenerating voiceovers: {e}")
    
    async def _regenerate_background_music(self, db: AsyncSession, video_id: str, scenes: List[Scene]):
        """Regenerate background music if music directions changed"""
        
        try:
            logger.info(f"Regenerating background music for video {video_id}")
            
            # Get updated scenes
            for scene in scenes:
                await db.refresh(scene)
            
            # Generate new music
            music_url = await self.lyria.generate_music_from_scenes(
                [{"music_direction": scene.music_direction, "sound_effects": scene.sound_effects} 
                 for scene in scenes]
            )
            
            # Normalize audio
            processed_music_url = await self.fal.normalize_audio(music_url, offset=-13)
            
            # Update music record
            music_query = select(Music).where(Music.video_id == video_id)
            result = await db.execute(music_query)
            music = result.scalar_one_or_none()
            
            if music:
                music.music_url = music_url
                music.processed_music_url = processed_music_url
            else:
                music = Music(
                    video_id=video_id,
                    music_url=music_url,
                    processed_music_url=processed_music_url
                )
                db.add(music)
            
            await db.commit()
            logger.info(f"Regenerated background music: {processed_music_url}")
            
        except Exception as e:
            logger.error(f"Error regenerating background music: {e}")
    
    async def _recompose_video(self, db: AsyncSession, video_id: str) -> str:
        """Recompose the final video with all updated elements"""
        
        # Get all scenes and music
        scenes = await self._get_video_scenes(db, video_id)
        
        music_query = select(Music).where(Music.video_id == video_id)
        result = await db.execute(music_query)
        music = result.scalar_one_or_none()
        
        # Compose scene videos
        scene_video_urls = [scene.scene_clip_url for scene in scenes if scene.scene_clip_url]
        merged_video_url = await self.fal.compose_videos(scene_video_urls, mode="concat")
        
        # Add audio tracks
        voiceover_urls = [scene.voiceover_url for scene in scenes if scene.voiceover_url]
        background_music_url = music.processed_music_url if music else None
        
        final_video_url = await self.fal.compose_video_with_audio(
            merged_video_url,
            voiceover_urls,
            background_music_url
        )
        
        logger.info(f"Recomposed video: {final_video_url}")
        return final_video_url
    
    # Helper methods
    async def _get_video(self, db: AsyncSession, video_id: str) -> Optional[Video]:
        """Get video by ID"""
        return await db.get(Video, video_id)
    
    async def _get_video_scenes(self, db: AsyncSession, video_id: str) -> List[Scene]:
        """Get all scenes for a video"""
        result = await db.execute(
            select(Scene).where(Scene.video_id == video_id).order_by(Scene.scene_number)
        )
        return list(result.scalars().all())
    
    def _scene_to_dict(self, scene: Scene) -> Dict[str, Any]:
        """Convert scene to dictionary for AI processing"""
        return {
            "scene_number": scene.scene_number,
            "voiceover": scene.voiceover,
            "visual_description": scene.visual_description,
            "music_direction": scene.music_direction,
            "sound_effects": scene.sound_effects
        }