import sys
from loguru import logger
from app.core.config import settings

def setup_logging():
    """Setup logging configuration"""
    
    # Remove default handler
    logger.remove()
    
    # Add stdout handler with custom format
    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    logger.add(
        sys.stdout,
        format=log_format,
        level=settings.LOG_LEVEL,
        colorize=True,
        backtrace=True,
        diagnose=True
    )
    
    # Add file handler for production
    if not settings.DEBUG:
        logger.add(
            "logs/video_ai_{time:YYYY-MM-DD}.log",
            format=log_format,
            level=settings.LOG_LEVEL,
            rotation="1 day",
            retention="30 days",
            compression="gz"
        )
    
    # Setup Sentry if DSN is provided
    if settings.SENTRY_DSN:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.loguru import LoguruIntegration
            
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                integrations=[
                    LoguruIntegration(level="ERROR", event_level="ERROR")
                ],
                traces_sample_rate=0.1,
                environment="production" if not settings.DEBUG else "development"
            )
            logger.info("Sentry integration enabled")
        except ImportError:
            logger.warning("Sentry SDK not installed, skipping Sentry integration")
    
    logger.info(f"Logging setup completed - Level: {settings.LOG_LEVEL}")
