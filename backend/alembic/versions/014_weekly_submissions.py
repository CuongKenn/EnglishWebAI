"""add weekly submissions table

Revision ID: 014_weekly_submissions
Revises: 013_grading_queue
Create Date: 2025-11-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sys
import os

# Add parent directory to path to import migration_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import table_exists

# revision identifiers, used by Alembic.
revision = '014_weekly_submissions'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    # Create weekly_submissions table if not exists
    if not table_exists('weekly_submissions'):
        op.create_table(
        'weekly_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('ai_score', sa.Float(), nullable=True),
        sa.Column('rubrics_scores', sa.JSON(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('error_analysis', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='in_progress'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['weekly_assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        
        # Create indexes
        op.create_index('ix_weekly_submissions_assessment_id', 'weekly_submissions', ['assessment_id'])
        op.create_index('ix_weekly_submissions_student_id', 'weekly_submissions', ['student_id'])
        op.create_index('ix_weekly_submissions_status', 'weekly_submissions', ['status'])


def downgrade():
    op.drop_index('ix_weekly_submissions_status', table_name='weekly_submissions')
    op.drop_index('ix_weekly_submissions_student_id', table_name='weekly_submissions')
    op.drop_index('ix_weekly_submissions_assessment_id', table_name='weekly_submissions')
    op.drop_table('weekly_submissions')

