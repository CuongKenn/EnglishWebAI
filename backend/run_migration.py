"""
Script to run database migrations
"""
import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from alembic.config import Config
from alembic import command

def run_migrations():
    """Run all pending migrations"""
    try:
        # Create Alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Run upgrade to head
        print("Running migrations...")
        command.upgrade(alembic_cfg, "head")
        print("✅ Migrations completed successfully!")
        
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()


