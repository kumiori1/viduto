from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.video import VideoStatus


# Base schemas
class SceneBase(BaseModel):
    scene_number: int
    visual_description: Optional[str] = None
    voiceover: Optional[str] = None
    sound_effects: Optional[str] = None
    music_direction: Optional[str] = None
    shot_type: Optional[str] = None


class SceneCreate(SceneBase):
    pass


class SceneUpdate(BaseModel):
    visual_description: Optional[str] = None
    voiceover: Optional[str] = None
    sound_effects: Optional[str] = None
    music_direction: Optional[str] = None
    shot_type: Optional[str] = None
    image_url: Optional[str] = None
    scene_clip_url: Optional[str] = None
    voiceover_url: Optional[str] = None


class Scene(SceneBase):
    id: str
    video_id: str
    image_url: Optional[str] = None
    scene_clip_url: Optional[str] = None
    voiceover_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Music schemas
class MusicBase(BaseModel):
    music_prompt: Optional[str] = None


class MusicCreate(MusicBase):
    pass


class MusicUpdate(BaseModel):
    music_url: Optional[str] = None
    processed_music_url: Optional[str] = None


class Music(MusicBase):
    id: str
    video_id: str
    music_url: Optional[str] = None
    processed_music_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Video schemas
class VideoBase(BaseModel):
    prompt: Optional[str] = None
    image_url: Optional[str] = None


class VideoCreate(VideoBase):
    user_id: str
    chat_id: Optional[str] = None


class VideoUpdate(BaseModel):
    status: Optional[VideoStatus] = None
    final_video_url: Optional[str] = None
    error_message: Optional[str] = None


class Video(VideoBase):
    id: str
    user_id: str
    chat_id: Optional[str] = None
    status: VideoStatus
    final_video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    scenes: List[Scene] = []
    music: Optional[Music] = None

    class Config:
        from_attributes = True


# Request/Response schemas
class VideoGenerationRequest(BaseModel):
    prompt: str = Field(..., description="Video generation prompt")
    image_url: str = Field(..., description="Base image URL")
    user_id: str = Field(..., description="User ID")
    chat_id: Optional[str] = Field(None, description="Chat ID for callback")


class VideoGenerationResponse(BaseModel):
    video_id: str
    status: VideoStatus
    message: str = "Video generation started"


class VideoStatusResponse(BaseModel):
    video_id: str
    status: VideoStatus
    final_video_url: Optional[str] = None
    error_message: Optional[str] = None
    progress: Optional[dict] = None
    scenes: List[Scene] = []
    music: Optional[Music] = None


class RevisionRequest(BaseModel):
    revision_request: str = Field(..., description="What to change in the video")
    video_id: str = Field(..., description="Original video ID")


class RevisionResponse(BaseModel):
    revision_id: str
    status: str
    message: str = "Revision processing started"


# AI Agent Response Schema (from n8n AI Agent1)
class AISceneOutput(BaseModel):
    scene_number: int
    visual_description: str
    voiceover: str
    shot_type: str = ""
    sound_effects: str
    music_direction: str


class AIScriptOutput(BaseModel):
    scenes: List[AISceneOutput]


# Webhook schemas (matching n8n webhooks)
class VideoWebhookRequest(BaseModel):
    prompt: str
    image_url: str
    user_id: str
    chat_id: Optional[str] = None
    video_id: str


class RevisionWebhookRequest(BaseModel):
    revision_request: str
    original_video_id: str
    video_id: str
    chat_id: Optional[str] = None
    user_id: str


# Callback schemas
class VideoCompletionCallback(BaseModel):
    video_id: str
    chat_id: Optional[str] = None
    user_id: str
    video_url: str
    is_revision: bool = False
