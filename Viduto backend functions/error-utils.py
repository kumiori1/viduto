"""Custom exceptions for the video AI backend"""

class VideoGenerationError(Exception):
    """Base exception for video generation errors"""
    pass

class AIServiceError(VideoGenerationError):
    """Exception for AI service failures"""
    pass

class FALError(AIServiceError):
    """Exception for FAL API errors"""
    pass

class ElevenLabsError(AIServiceError):
    """Exception for ElevenLabs API errors"""
    pass

class OpenAIError(AIServiceError):
    """Exception for OpenAI API errors"""
    pass

class LyriaError(AIServiceError):
    """Exception for Lyria API errors"""
    pass

class VideoProcessingError(VideoGenerationError):
    """Exception for video processing errors"""
    pass

class ImageProcessingError(VideoGenerationError):
    """Exception for image processing errors"""
    pass

class AudioProcessingError(VideoGenerationError):
    """Exception for audio processing errors"""
    pass

class DatabaseError(Exception):
    """Exception for database errors"""
    pass

class ValidationError(Exception):
    """Exception for validation errors"""
    pass

class Base44IntegrationError(Exception):
    """Exception for Base44 integration errors"""
    pass

class RevisionError(VideoGenerationError):
    """Exception for revision processing errors"""
    pass

class TaskExecutionError(Exception):
    """Exception for Celery task execution errors"""
    pass
