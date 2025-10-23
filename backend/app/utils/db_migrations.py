from sqlalchemy import inspect, text
from app.core.database import engine


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = inspect(engine)
    try:
        cols = [c["name"] for c in inspector.get_columns(table_name)]
        return column_name in cols
    except Exception:
        return False


def ensure_classes_columns() -> None:
    """Ensure columns exist on classes table for newer features.

    This is a lightweight, SQLite-friendly migration helper so existing
    databases created from earlier schemas don't crash when backend adds
    new fields. Safe to run multiple times.
    """
    with engine.begin() as conn:
        if not _has_column("classes", "max_students"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN max_students INTEGER"))
        if not _has_column("classes", "schedule"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN schedule VARCHAR"))
        if not _has_column("classes", "grade"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN grade INTEGER"))
        if not _has_column("classes", "skill"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN skill VARCHAR"))
        if not _has_column("classes", "status"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN status VARCHAR DEFAULT 'active'"))
        if not _has_column("classes", "is_active"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        if not _has_column("classes", "created_at"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN created_at DATETIME"))
        if not _has_column("classes", "updated_at"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN updated_at DATETIME"))


def ensure_schema() -> None:
    ensure_classes_columns()
