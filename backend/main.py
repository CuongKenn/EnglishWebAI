import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine

# Import all models to ensure they're registered with SQLAlchemy metadata
from app.models import *
from app.routers import admin as admin_router
from app.routers import (
    ai_analytics,
    ai_conversation,
    ai_flashcard,
    ai_listening,
    ai_reading,
    ai_usage,
    ai_writing,
    auth,
    classes,
    course_content,
    discussions,
    enhanced_weekly_assessments,
    error_analysis_export,
    exam_assessments,
    exercises,
    exports,
    lesson_plans,
    lessons,
    materials,
    media,
    messages,
    news,
    notifications,
    otp,
    parent,
    student_profile,
    teacher_analytics,
    teacher_dashboard,
    translation,
    users,
    weekly_assessments,
    worksheets,
)
from app.routers import courses as courses_router
from app.routers import question_bank as question_bank_router
from app.routers import teacher_grading as teacher_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create all tables from models (PostgreSQL handles IF NOT EXISTS internally)
# This ensures all tables exist regardless of migration state
try:
    Base.metadata.create_all(bind=engine, checkfirst=True)
    logger.info("All database tables created/verified")
except Exception as e:
    logger.warning(f"Could not create all tables: {e}")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# Health check endpoint for Docker
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "english-learning-api"}

# Increase recursion limit for large files
sys.setrecursionlimit(5000)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    # Allow all origins to avoid dev CORS issues (uses token auth, not cookies)
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers (match frontend API paths)
app.include_router(auth.router, prefix="/api/users", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_PREFIX}/users", tags=["Users"])
app.include_router(admin_router.router, prefix=f"{settings.API_PREFIX}/admin", tags=["Admin"])
app.include_router(otp.router, prefix=f"{settings.API_PREFIX}/otp", tags=["OTP"])
app.include_router(parent.router, prefix=f"{settings.API_PREFIX}/parent", tags=["Parent"])

# Student routers
app.include_router(classes.router, prefix=f"{settings.API_PREFIX}/classes", tags=["Classes"])
app.include_router(lessons.router, prefix=f"{settings.API_PREFIX}/lessons", tags=["Lessons"])
app.include_router(exercises.router, prefix=f"{settings.API_PREFIX}/exercises", tags=["Exercises"])
app.include_router(materials.router, prefix=f"{settings.API_PREFIX}/materials", tags=["Materials"])
app.include_router(discussions.router, prefix=f"{settings.API_PREFIX}/discussions", tags=["Discussions"])
app.include_router(news.router, prefix=f"{settings.API_PREFIX}/news", tags=["News"])
app.include_router(notifications.router, prefix=f"{settings.API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(messages.router, prefix=f"{settings.API_PREFIX}/messages", tags=["Messages"])
app.include_router(courses_router.router, prefix=f"{settings.API_PREFIX}/courses", tags=["Courses"])
app.include_router(ai_conversation.router, tags=["AI Conversation"])
app.include_router(ai_writing.router, tags=["AI Writing"])
app.include_router(ai_reading.router, prefix=f"{settings.API_PREFIX}/ai/reading", tags=["AI Reading"])
app.include_router(ai_listening.router, prefix=f"{settings.API_PREFIX}/ai/listening", tags=["AI Listening"])
app.include_router(ai_flashcard.router, prefix=f"{settings.API_PREFIX}/ai", tags=["AI Flashcard"])
app.include_router(ai_usage.router, tags=["AI Usage"])
app.include_router(ai_analytics.router, tags=["AI Analytics (Admin)"])
app.include_router(student_profile.router)
app.include_router(question_bank_router.router, prefix=f"{settings.API_PREFIX}/question-bank", tags=["Question Bank"])
app.include_router(exports.router, tags=["Exports"])
app.include_router(teacher_router.router, prefix=f"{settings.API_PREFIX}/teacher", tags=["Teacher"])
app.include_router(teacher_analytics.router, prefix=f"{settings.API_PREFIX}/teacher", tags=["Teacher Analytics"])
app.include_router(teacher_dashboard.router, tags=["Teacher Dashboard"])
app.include_router(course_content.router, prefix=f"{settings.API_PREFIX}/content", tags=["Course Content"])

app.include_router(lesson_plans.router, tags=["Lesson Plans"])
app.include_router(worksheets.router, tags=["Worksheets"])
app.include_router(weekly_assessments.router, tags=["Weekly Assessments"])
app.include_router(enhanced_weekly_assessments.router, tags=["Enhanced Weekly Assessments"])
app.include_router(exam_assessments.router, tags=["Exam Assessments"])
app.include_router(translation.router, prefix=f"{settings.API_PREFIX}/translation", tags=["Translation"])
app.include_router(error_analysis_export.router, tags=["Error Analysis Export"])
app.include_router(media.router, prefix=f"{settings.API_PREFIX}/media", tags=["Media"])

# Serve media files if available (e.g., uploaded materials)
try:
    app.mount("/media", StaticFiles(directory="media", check_dir=False), name="media")
except Exception:
    # If StaticFiles fails due to version mismatch or other issues, skip mounting
    pass

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting EnglishWebAI Backend...")

    # Note: Alembic migrations are run by docker-compose.yml before server starts
    # This ensures database schema is up-to-date before application startup
    # See docker-compose.yml command: "alembic upgrade head"

    # Fallback: lightweight schema ensure (for non-Docker environments)
    try:
        from app.utils.db_migrations import ensure_schema
        ensure_schema()
        logger.info("Schema ensured (light migration)")
    except Exception as e:
        logger.warning(f"Schema ensure failed: {e}")

    # Auto-seed database if empty
    from app.models.user import User
    from app.utils.seed import seed_users

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            logger.info("Database is empty. Running auto-seed...")
            seed_users(db, force=False)
            logger.info("Auto-seed completed!")
        else:
            logger.info(f"Database already has {user_count} users. Skipping auto-seed.")

        # Initialize default system configurations
        from app.services.system_config_service import SystemConfigService
        SystemConfigService.initialize_default_configs(db)
        logger.info("System configurations initialized!")

        # Seed public courses if none exist
        try:
            from app.utils.seed import seed_course_units_questions, seed_courses
            seed_courses(db)
            seed_course_units_questions(db)
        except Exception as se:
            logger.warning(f"Course seeding skipped: {se}")

    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
    finally:
        db.close()

    # Start background grading queue worker
    import asyncio

    from app.services.grading_queue_service import GradingQueueService

    async def run_grading_worker():
        """Background task to process grading queue"""
        grading_service = GradingQueueService()
        while True:
            try:
                db = SessionLocal()
                try:
                    # Process next pending item
                    processed = await grading_service.process_next_pending(db)

                    if not processed:
                        # No items in queue, wait before checking again
                        await asyncio.sleep(10)  # Check every 10 seconds
                    else:
                        # Item processed, check for next immediately
                        await asyncio.sleep(1)

                except Exception as e:
                    logger.error(f"Grading worker error: {e}")
                    await asyncio.sleep(30)  # Wait longer on error
                finally:
                    db.close()

            except Exception as e:
                logger.critical(f"Grading worker critical error: {e}")
                await asyncio.sleep(60)

    # Start worker task in background
    asyncio.create_task(run_grading_worker())
    logger.info("Grading queue worker started!")

@app.get("/")
async def root():
    return {
        "message": "Welcome to EnglishWebAI API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_PREFIX}/docs"
    }

if __name__ == "__main__":
    import uvicorn

    # Configure for large file uploads (50MB)
    config = uvicorn.Config(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        timeout_keep_alive=120,
        limit_concurrency=100,
        limit_max_requests=1000,
        # Allow large file uploads (50MB)
        h11_max_incomplete_event_size=50 * 1024 * 1024
    )
    server = uvicorn.Server(config)
    server.run()
