"""
Utility functions for Alembic migrations
Helps handle idempotent migrations on existing databases
"""
from sqlalchemy import text
from alembic import op


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    conn = op.get_bind()
    result = conn.execute(text(
        f"SELECT 1 FROM information_schema.tables WHERE table_name = '{table_name}'"
    ))
    return result.fetchone() is not None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    conn = op.get_bind()
    result = conn.execute(text(
        f"SELECT 1 FROM information_schema.columns "
        f"WHERE table_name = '{table_name}' AND column_name = '{column_name}'"
    ))
    return result.fetchone() is not None


def get_column_data_type(table_name: str, column_name: str) -> str | None:
    """Return the data type of a column (as reported by information_schema)"""
    conn = op.get_bind()
    result = conn.execute(text(
        "SELECT data_type FROM information_schema.columns "
        "WHERE table_name = :table AND column_name = :column"
    ), {"table": table_name, "column": column_name})
    row = result.fetchone()
    return row[0] if row else None


def enum_type_exists(enum_name: str) -> bool:
    """Check if an ENUM type exists in PostgreSQL"""
    conn = op.get_bind()
    result = conn.execute(text(
        f"SELECT 1 FROM pg_type WHERE typname = '{enum_name}'"
    ))
    return result.fetchone() is not None


def index_exists(index_name: str) -> bool:
    """Check if an index exists"""
    conn = op.get_bind()
    result = conn.execute(text(
        f"SELECT 1 FROM pg_indexes WHERE indexname = '{index_name}'"
    ))
    return result.fetchone() is not None


def constraint_exists(constraint_name: str) -> bool:
    """Check if a constraint exists"""
    conn = op.get_bind()
    result = conn.execute(text(
        f"SELECT 1 FROM information_schema.table_constraints "
        f"WHERE constraint_name = '{constraint_name}'"
    ))
    return result.fetchone() is not None
