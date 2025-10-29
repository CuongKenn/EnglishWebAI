"""add thumbnail_url to courses

Revision ID: 011_add_thumbnail
Revises: 010_course_progress
Create Date: 2025-10-28

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '011_add_thumbnail'
down_revision = '010_course_progress'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add thumbnail_url column to courses table
    op.add_column('courses', sa.Column('thumbnail_url', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove thumbnail_url column from courses table
    op.drop_column('courses', 'thumbnail_url')


