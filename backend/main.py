from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.routers import auth, users

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

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    print("🚀 Starting EnglishWebAI Backend...")
    
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
