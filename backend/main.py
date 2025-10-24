from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, users, otp, parent
from app.routers import admin as admin_router
from app.routers import classes, lessons, exercises, materials, discussions, news
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
    allow_origins=["*"],  # Cho phép tất cả origins trong development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# Serve media files if available (e.g., uploaded materials)
try:
    app.mount("/media", StaticFiles(directory="media", check_dir=False), name="media")
except Exception:
    # If StaticFiles fails due to version mismatch or other issues, skip mounting
    pass

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("🚀 Starting EnglishWebAI Backend...")
    
    # Auto-migrate lightweight schema (SQLite add columns if missing)
    try:
        from app.utils.db_migrations import ensure_schema
        ensure_schema()
        print("✅ Schema ensured (light migration)")
    except Exception as e:
        print(f"⚠️  Schema ensure failed: {e}")

    # Auto-seed database if empty
    from app.utils.seed import seed_users
    from app.models.user import User
    
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("📊 Database is empty. Running auto-seed...")
            seed_users(db, force=False)
            print("✅ Auto-seed completed!")
        else:
            print(f"📊 Database already has {user_count} users. Skipping auto-seed.")
    except Exception as e:
        print(f"⚠️  Auto-seed error: {str(e)}")
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
