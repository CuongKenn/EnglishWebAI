from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, users, otp, parent, test
from app.routers import admin as admin_router
from app.routers import classes, lessons, exercises, materials, discussions, news, notifications, messages
from app.routers import courses as courses_router
from app.routers import ai_conversation, ai_writing, ai_reading, ai_listening, ai_flashcard
from app.routers import question_bank as question_bank_router
from app.routers import ai_usage, ai_analytics
from app.routers import student_profile
from app.routers import teacher_grading as teacher_router
from app.routers import teacher_analytics
from app.routers import exports
from app.routers import lesson_plans, worksheets, weekly_assessments
from app.models import User

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

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
app.include_router(test.router, prefix=f"{settings.API_PREFIX}/test", tags=["Test"])
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

app.include_router(lesson_plans.router, tags=["Lesson Plans"])
app.include_router(worksheets.router, tags=["Worksheets"])
app.include_router(weekly_assessments.router, tags=["Weekly Assessments"]) 

# Serve media files if available (e.g., uploaded materials)
try:
    app.mount("/media", StaticFiles(directory="media", check_dir=False), name="media")
except Exception:
    # If StaticFiles fails due to version mismatch or other issues, skip mounting
    pass

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("[STARTUP] Starting EnglishWebAI Backend...")
    
    # Auto-migrate lightweight schema (SQLite add columns if missing)
    try:
        from app.utils.db_migrations import ensure_schema
        ensure_schema()
        print("[SUCCESS] Schema ensured (light migration)")
    except Exception as e:
        print(f"[WARNING] Schema ensure failed: {e}")

    # Auto-seed database if empty
    from app.utils.seed import seed_users
    from app.models.user import User
    
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("[INFO] Database is empty. Running auto-seed...")
            seed_users(db, force=False)
            print("[SUCCESS] Auto-seed completed!")
        else:
            print(f"[INFO] Database already has {user_count} users. Skipping auto-seed.")

        # Initialize default system configurations
        from app.services.system_config_service import SystemConfigService
        SystemConfigService.initialize_default_configs(db)
        print("[SUCCESS] System configurations initialized!")

        # Seed public courses if none exist
        try:
            from app.utils.seed import seed_courses, seed_course_units_questions
            seed_courses(db)
            seed_course_units_questions(db)
        except Exception as se:
            print(f"[WARNING] Course seeding skipped: {se}")
        
    except Exception as e:
        print(f"[ERROR] Startup error: {str(e)}")
    finally:
        db.close()

@app.get("/")
async def root():
    return {
        "message": "Welcome to EnglishWebAI API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_PREFIX}/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
