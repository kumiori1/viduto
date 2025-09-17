#!/usr/bin/env python3
"""
Migration script to migrate data from n8n/Supabase to new FastAPI backend
Run this script after setting up the new backend to migrate existing data
"""

import asyncio
import os
import sys
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import asyncpg
import httpx

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.video import Video, Scene, Music, VideoStatus
from app.core.config import settings

# Supabase connection details (update these with your actual Supabase credentials)
SUPABASE_URL = "your_supabase_database_url_here"  # e.g., postgresql://postgres:password@db.supabasehost.com:5432/postgres
SUPABASE_TABLE_PREFIX = ""  # Add if you have table prefixes


async def connect_to_supabase():
    """Connect to Supabase database"""
    try:
        conn = await asyncpg.connect(SUPABASE_URL)
        print("✅ Connected to Supabase")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        sys.exit(1)


async def connect_to_new_db():
    """Connect to new FastAPI backend database"""
    try:
        engine = create_async_engine(settings.DATABASE_URL)
        async_session = async_sessionmaker(engine, class_=AsyncSession)
        print("✅ Connected to new database")
        return engine, async_session
    except Exception as e:
        print(f"❌ Failed to connect to new database: {e}")
        sys.exit(1)


async def migrate_videos(supabase_conn, new_db_session):
    """Migrate video records from Supabase to new database"""
    
    print("🔄 Migrating videos...")
    
    try:
        # Fetch videos from Supabase (assuming you have a videos table)
        # Adjust the query based on your actual Supabase schema
        videos_query = """
        SELECT id, user_id, chat_id, prompt, image_url, final_video_url, 
               status, error_message, created_at, updated_at
        FROM videos 
        ORDER BY created_at DESC
        """
        
        supabase_videos = await supabase_conn.fetch(videos_query)
        print(f"📊 Found {len(supabase_videos)} videos in Supabase")
        
        migrated_count = 0
        
        async with new_db_session() as session:
            for video_row in supabase_videos:
                try:
                    # Map Supabase status to new VideoStatus enum
                    status_mapping = {
                        "pending": VideoStatus.PENDING,
                        "processing": VideoStatus.PROCESSING_SCRIPT,
                        "completed": VideoStatus.COMPLETED,
                        "failed": VideoStatus.FAILED,
                        # Add more mappings as needed
                    }
                    
                    status = status_mapping.get(video_row['status'], VideoStatus.PENDING)
                    
                    # Create new Video object
                    video = Video(
                        id=video_row['id'],
                        user_id=video_row['user_id'],
                        chat_id=video_row['chat_id'],
                        prompt=video_row['prompt'],
                        image_url=video_row['image_url'],
                        final_video_url=video_row['final_video_url'],
                        status=status,
                        error_message=video_row['error_message'],
                        created_at=video_row['created_at'],
                        updated_at=video_row['updated_at']
                    )
                    
                    session.add(video)
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"⚠️  Error migrating video {video_row['id']}: {e}")
            
            await session.commit()
            print(f"✅ Migrated {migrated_count} videos")
            
    except Exception as e:
        print(f"❌ Error migrating videos: {e}")


async def migrate_scenes(supabase_conn, new_db_session):
    """Migrate scene records"""
    
    print("🔄 Migrating scenes...")
    
    try:
        scenes_query = """
        SELECT id, video_id, scene_number, visual_description, vioceover as voiceover,
               sound_effects, music_direction, image_url, scene_clip_url, voiceover_url,
               created_at, updated_at
        FROM scenes
        ORDER BY video_id, scene_number
        """
        
        supabase_scenes = await supabase_conn.fetch(scenes_query)
        print(f"📊 Found {len(supabase_scenes)} scenes in Supabase")
        
        migrated_count = 0
        
        async with new_db_session() as session:
            for scene_row in supabase_scenes:
                try:
                    scene = Scene(
                        id=scene_row['id'],
                        video_id=scene_row['video_id'],
                        scene_number=scene_row['scene_number'],
                        visual_description=scene_row['visual_description'],
                        voiceover=scene_row['voiceover'],
                        sound_effects=scene_row['sound_effects'],
                        music_direction=scene_row['music_direction'],
                        image_url=scene_row['image_url'],
                        scene_clip_url=scene_row['scene_clip_url'],
                        voiceover_url=scene_row['voiceover_url'],
                        created_at=scene_row['created_at'],
                        updated_at=scene_row['updated_at']
                    )
                    
                    session.add(scene)
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"⚠️  Error migrating scene {scene_row['id']}: {e}")
            
            await session.commit()
            print(f"✅ Migrated {migrated_count} scenes")
            
    except Exception as e:
        print(f"❌ Error migrating scenes: {e}")


async def migrate_music(supabase_conn, new_db_session):
    """Migrate music records"""
    
    print("🔄 Migrating music...")
    
    try:
        music_query = """
        SELECT id, video_id, user_id, music_url, created_at
        FROM music
        ORDER BY created_at
        """
        
        supabase_music = await supabase_conn.fetch(music_query)
        print(f"📊 Found {len(supabase_music)} music records in Supabase")
        
        migrated_count = 0
        
        async with new_db_session() as session:
            for music_row in supabase_music:
                try:
                    music = Music(
                        id=music_row['id'],
                        video_id=music_row['video_id'],
                        music_url=music_row['music_url'],
                        created_at=music_row['created_at']
                    )
                    
                    session.add(music)
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"⚠️  Error migrating music {music_row['id']}: {e}")
            
            await session.commit()
            print(f"✅ Migrated {migrated_count} music records")
            
    except Exception as e:
        print(f"❌ Error migrating music: {e}")


async def verify_migration(new_db_session):
    """Verify the migration was successful"""
    
    print("🔍 Verifying migration...")
    
    async with new_db_session() as session:
        from sqlalchemy import select, func
        
        # Count records
        video_count = await session.scalar(select(func.count(Video.id)))
        scene_count = await session.scalar(select(func.count(Scene.id)))
        music_count = await session.scalar(select(func.count(Music.id)))
        
        print(f"📊 Migration Summary:")
        print(f"   Videos: {video_count}")
        print(f"   Scenes: {scene_count}")
        print(f"   Music: {music_count}")
        
        # Check for any videos with missing scenes
        videos_without_scenes = await session.execute(
            select(Video.id).where(
                ~Video.id.in_(select(Scene.video_id).distinct())
            )
        )
        orphaned_videos = videos_without_scenes.scalars().all()
        
        if orphaned_videos:
            print(f"⚠️  Found {len(orphaned_videos)} videos without scenes")
            print("   This might be normal for failed or incomplete videos")
        
        print("✅ Migration verification completed")


async def update_base44_webhooks():
    """Update Base44 webhooks to point to new backend"""
    
    print("🔄 Updating Base44 webhook URLs...")
    
    # This would require Base44 API access to update webhook endpoints
    # For now, just print instructions
    
    print("📝 Manual steps required:")
    print("   1. Update Base44 webhook URLs to point to your new backend:")
    print(f"      Main Video Generation: https://your-domain.com/api/v1/webhooks/video-generation")
    print(f"      Revision: https://your-domain.com/api/v1/webhooks/revision")
    print("   2. Update any hardcoded n8n webhook URLs in Base44 functions")
    print("   3. Test webhook endpoints with sample requests")


async def main():
    """Main migration function"""
    
    print("🚀 Starting n8n to FastAPI migration...")
    print("=" * 50)
    
    # Check if new database is set up
    if not settings.DATABASE_URL:
        print("❌ DATABASE_URL not set. Please configure your .env file first.")
        sys.exit(1)
    
    # Connect to databases
    supabase_conn = await connect_to_supabase()
    new_engine, new_db_session = await connect_to_new_db()
    
    try:
        # Run migrations
        await migrate_videos(supabase_conn, new_db_session)
        await migrate_scenes(supabase_conn, new_db_session)
        await migrate_music(supabase_conn, new_db_session)
        
        # Verify migration
        await verify_migration(new_db_session)
        
        # Update webhook info
        await update_base44_webhooks()
        
        print("=" * 50)
        print("✅ Migration completed successfully!")
        print("")
        print("🔥 Next steps:")
        print("   1. Test the new API endpoints")
        print("   2. Update Base44 webhook URLs")
        print("   3. Run a test video generation")
        print("   4. Monitor logs for any issues")
        print("   5. Keep the old n8n workflow as backup until fully tested")
        
    finally:
        # Cleanup connections
        await supabase_conn.close()
        await new_engine.dispose()


if __name__ == "__main__":
    # Check for Supabase URL
    if SUPABASE_URL == "your_supabase_database_url_here":
        print("❌ Please update SUPABASE_URL in this script with your actual Supabase database URL")
        print("   You can find this in your Supabase project settings under Database")
        sys.exit(1)
    
    asyncio.run(main())
