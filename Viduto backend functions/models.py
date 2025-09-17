import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base


class VideoStatus(str, Enum):
    PENDING = "pending"
    PROCESSING_SCRIPT = "processing_script"
    PROCESSING_IMAGES = "processing_images"
    GENERATING_SCENES = "generating_scenes"
    GENERATING_VOICEOVERS = "generating_voiceovers"
    GENERATING_MUSIC = "generating_music"
    COMPOSING_VIDEO = "composing_video"
    ADDING_CAPTIONS = "adding_captions"
    COMPLETED = "completed"
    FAILED = "failed"
    REVISION_REQUESTED = "revision_requested"
    PROCESSING_REVISION = "processing_revision"


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False)
    chat_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Input data
    prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Status and results
    status: Mapped[VideoStatus] = mapped_column(SQLEnum(VideoStatus), default=VideoStatus.PENDING)
    final_video_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    scenes: Mapped[List["Scene"]] = relationship("Scene", back_populates="video", cascade="all, delete-orphan")
    music: Mapped[Optional["Music"]] = relationship("Music", back_populates="video", uselist=False, cascade="all, delete-orphan")
    revisions: Mapped[List["VideoRevision"]] = relationship("VideoRevision", back_populates="video", cascade="all, delete-orphan")


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id: Mapped[str] = mapped_column(String, ForeignKey("videos.id"), nullable=False)
    scene_number: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Scene content
    visual_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    voiceover: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Keep original typo for compatibility
    sound_effects: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    music_direction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    shot_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Generated assets
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scene_clip_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    voiceover_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    video: Mapped["Video"] = relationship("Video", back_populates="scenes")


class Music(Base):
    __tablename__ = "music"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id: Mapped[str] = mapped_column(String, ForeignKey("videos.id"), nullable=False)
    
    # Music content
    music_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    music_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    processed_music_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Loudnorm processed
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    video: Mapped["Video"] = relationship("Video", back_populates="music")


class VideoRevision(Base):
    __tablename__ = "video_revisions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    video_id: Mapped[str] = mapped_column(String, ForeignKey("videos.id"), nullable=False)
    
    # Revision details
    revision_request: Mapped[str] = mapped_column(Text, nullable=False)
    revision_type: Mapped[str] = mapped_column(String, nullable=False)  # scene, voiceover, music, etc.
    target_scene_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[str] = mapped_column(String, default="pending")
    result_video_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    video: Mapped["Video"] = relationship("Video", back_populates="revisions")
