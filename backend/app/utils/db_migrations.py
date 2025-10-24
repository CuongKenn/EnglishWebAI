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
        # Ensure teacher_id exists (older DBs might not have it)
        if not _has_column("classes", "teacher_id"):
            conn.execute(text("ALTER TABLE classes ADD COLUMN teacher_id INTEGER"))
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


def ensure_enrollments_columns() -> None:
    """Ensure columns on class_enrollments exist.

    Older local SQLite databases may miss these columns, causing queries like
    `Enrollment.status == "active"` to fail with "no such column".
    """
    with engine.begin() as conn:
        if not _has_column("class_enrollments", "role"):
            conn.execute(text("ALTER TABLE class_enrollments ADD COLUMN role VARCHAR DEFAULT 'student'"))
        if not _has_column("class_enrollments", "status"):
            conn.execute(text("ALTER TABLE class_enrollments ADD COLUMN status VARCHAR DEFAULT 'active'"))
        if not _has_column("class_enrollments", "joined_at"):
            conn.execute(text("ALTER TABLE class_enrollments ADD COLUMN joined_at DATETIME"))


def ensure_schema() -> None:
    ensure_classes_columns()
    ensure_enrollments_columns()
