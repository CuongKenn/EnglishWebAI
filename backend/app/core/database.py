from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

# Create database directory in a stable, absolute location (inside backend)
_base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))  # .../backend
db_dir = os.path.join(_base_dir, 'data')
os.makedirs(db_dir, exist_ok=True)

# Absolute SQLite database path to avoid CWD issues
abs_db_path = os.path.join(db_dir, 'englishwebai.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{abs_db_path}"

# Create database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=settings.DEBUG
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
