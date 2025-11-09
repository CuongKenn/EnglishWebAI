import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# PostgreSQL database configuration
POSTGRES_USER = os.getenv("POSTGRES_USER", "englishwebai_user")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "englishwebai_password")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")  # Changed from "db" to "localhost" for local dev
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "englishwebai_db")

# PostgreSQL database URL
SQLALCHEMY_DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Create database engine with optimized connection pool settings
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=20,  # Number of permanent connections (default: 5)
    max_overflow=40,  # Max overflow connections (default: 10)
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_timeout=30,  # Timeout for getting connection from pool
    echo=settings.DEBUG,
    echo_pool=False,  # Don't log pool checkouts/checkins
    connect_args={
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"  # 30 second query timeout
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
