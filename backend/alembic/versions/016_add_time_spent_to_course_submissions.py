"""add time_spent column to course_submissions

Revision ID: 016_time_spent_course_subs
Revises: 015_enhanced_weekly_assess
Create Date: 2025-11-07 04:45:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '016_time_spent_course_subs'
down_revision = '015_enhanced_weekly_assess'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # op.add_column(
    #     'course_submissions',
    #     sa.Column('time_spent', sa.Integer(), nullable=True)
    # )
    pass


def downgrade() -> None:
    op.drop_column('course_submissions', 'time_spent')
