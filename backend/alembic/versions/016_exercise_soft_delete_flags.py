"""add soft delete flags to exercises

Revision ID: 016_exercise_soft_delete
Revises: 015_enhanced_weekly_assess
Create Date: 2025-11-08

"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to path to import migration_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import column_exists

# revision identifiers, used by Alembic.
revision = "016_exercise_soft_delete"
down_revision = "015_enhanced_weekly_assess"
branch_labels = None
depends_on = None


def upgrade():
    if not column_exists("exercises", "is_active"):
        op.add_column(
            "exercises",
            sa.Column(
                "is_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            ),
        )
        # ensure existing rows are active by default
        op.execute("UPDATE exercises SET is_active = true WHERE is_active IS NULL")

    if not column_exists("exercises", "is_archived"):
        op.add_column(
            "exercises",
            sa.Column(
                "is_archived",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )
        op.execute("UPDATE exercises SET is_archived = false WHERE is_archived IS NULL")


def downgrade():
    if column_exists("exercises", "is_archived"):
        op.drop_column("exercises", "is_archived")

    if column_exists("exercises", "is_active"):
        op.drop_column("exercises", "is_active")
