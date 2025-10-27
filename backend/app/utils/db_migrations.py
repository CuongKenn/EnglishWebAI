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
    try:
        ensure_discussions_columns()
    except Exception as e:
        print(f"[migrations] ensure discussions columns failed: {e}")
    # Ensure new public courses tables exist (idempotent)
    try:
        from app.models.course import Course, CourseExercise, CourseSubmission
        Course.__table__.create(bind=engine, checkfirst=True)
        CourseExercise.__table__.create(bind=engine, checkfirst=True)
        CourseSubmission.__table__.create(bind=engine, checkfirst=True)
    except Exception as e:
        # Avoid crashing startup; only log
        print(f"[migrations] ensure courses tables failed: {e}")
    # Ensure required columns exist for older local DBs
    try:
        ensure_courses_columns()
        ensure_course_exercises_columns()
        ensure_course_submissions_columns()
        ensure_course_units_tables()
        ensure_course_units_columns()
        ensure_course_questions_columns()
    except Exception as e:
        print(f"[migrations] ensure courses columns failed: {e}")


def ensure_discussions_columns() -> None:
    """Ensure columns exist for discussion features on local SQLite DBs.

    Adds missing columns to:
      - discussion_threads: subject (VARCHAR), views (INTEGER DEFAULT 0)
    Safe to run multiple times.
    """
    with engine.begin() as conn:
        t = "discussion_threads"
        if not _has_column(t, "subject"):
            conn.execute(text("ALTER TABLE discussion_threads ADD COLUMN subject VARCHAR"))
        if not _has_column(t, "views"):
            conn.execute(text("ALTER TABLE discussion_threads ADD COLUMN views INTEGER DEFAULT 0"))


def ensure_courses_columns() -> None:
    with engine.begin() as conn:
        t = "courses"
        # Base columns
        if not _has_column(t, "title"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN title VARCHAR"))
        if not _has_column(t, "description"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN description TEXT"))
        if not _has_column(t, "grade"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN grade INTEGER"))
        if not _has_column(t, "skill"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN skill VARCHAR"))
        if not _has_column(t, "category"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN category VARCHAR"))
        if not _has_column(t, "level"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN level VARCHAR"))
        if not _has_column(t, "total_cups"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN total_cups INTEGER DEFAULT 0 NOT NULL"))
        if not _has_column(t, "is_premium"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN is_premium BOOLEAN DEFAULT 0 NOT NULL"))
        if not _has_column(t, "is_active"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT 1"))
        if not _has_column(t, "created_by"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN created_by INTEGER"))
        if not _has_column(t, "created_at"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN created_at DATETIME"))
        if not _has_column(t, "updated_at"):
            conn.execute(text("ALTER TABLE courses ADD COLUMN updated_at DATETIME"))


def ensure_course_exercises_columns() -> None:
    with engine.begin() as conn:
        t = "course_exercises"
        if not _has_column(t, "course_id"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN course_id INTEGER"))
        if not _has_column(t, "title"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN title VARCHAR"))
        if not _has_column(t, "description"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN description TEXT"))
        if not _has_column(t, "type"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN type VARCHAR DEFAULT 'assignment'"))
        if not _has_column(t, "max_score"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN max_score INTEGER"))
        if not _has_column(t, "order_index"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN order_index INTEGER"))
        if not _has_column(t, "created_at"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN created_at DATETIME"))
        if not _has_column(t, "content_json"):
            conn.execute(text("ALTER TABLE course_exercises ADD COLUMN content_json TEXT"))


def ensure_course_submissions_columns() -> None:
    with engine.begin() as conn:
        t = "course_submissions"
        if not _has_column(t, "exercise_id"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN exercise_id INTEGER"))
        if not _has_column(t, "student_id"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN student_id INTEGER"))
        if not _has_column(t, "content_text"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN content_text TEXT"))
        if not _has_column(t, "content_url"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN content_url VARCHAR"))
        if not _has_column(t, "score"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN score INTEGER"))
        if not _has_column(t, "feedback"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN feedback TEXT"))
        if not _has_column(t, "status"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN status VARCHAR DEFAULT 'submitted'"))
        if not _has_column(t, "submitted_at"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN submitted_at DATETIME"))
        if not _has_column(t, "graded_at"):
            conn.execute(text("ALTER TABLE course_submissions ADD COLUMN graded_at DATETIME"))


def ensure_course_units_tables() -> None:
    """Create course_units and course_questions if missing."""
    from app.models.course import CourseUnit, CourseQuestion
    CourseUnit.__table__.create(bind=engine, checkfirst=True)
    CourseQuestion.__table__.create(bind=engine, checkfirst=True)


def ensure_course_units_columns() -> None:
    with engine.begin() as conn:
        t = "course_units"
        if not _has_column(t, "course_id"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN course_id INTEGER"))
        if not _has_column(t, "title"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN title VARCHAR"))
        if not _has_column(t, "description"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN description TEXT"))
        if not _has_column(t, "week_index"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN week_index INTEGER"))
        if not _has_column(t, "order_index"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN order_index INTEGER"))
        if not _has_column(t, "unit_type"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN unit_type VARCHAR DEFAULT 'lesson' NOT NULL"))
        if not _has_column(t, "max_cups"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN max_cups INTEGER DEFAULT 2 NOT NULL"))
        if not _has_column(t, "created_at"):
            conn.execute(text("ALTER TABLE course_units ADD COLUMN created_at DATETIME"))


def ensure_course_questions_columns() -> None:
    with engine.begin() as conn:
        t = "course_questions"
        if not _has_column(t, "unit_id"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN unit_id INTEGER"))
        if not _has_column(t, "type"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN type VARCHAR"))
        if not _has_column(t, "prompt"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN prompt TEXT"))
        if not _has_column(t, "options_json"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN options_json TEXT"))
        if not _has_column(t, "answer_json"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN answer_json TEXT"))
        if not _has_column(t, "media_url"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN media_url VARCHAR"))
        if not _has_column(t, "points"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN points INTEGER"))
        if not _has_column(t, "order_index"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN order_index INTEGER"))
        if not _has_column(t, "created_at"):
            conn.execute(text("ALTER TABLE course_questions ADD COLUMN created_at DATETIME"))
