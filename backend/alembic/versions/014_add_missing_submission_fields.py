"""add missing submission fields

Revision ID: 014
Revises: 013
Create Date: 2025-11-01

"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to import migration utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import column_exists, index_exists


# revision identifiers, used by Alembic.
revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to exercise_submissions table
    columns = [
        ('queue_position', sa.Integer(), {"nullable": True}),
        ('grading_attempts', sa.Integer(), {"nullable": False, "server_default": '0'}),
        ('last_grading_error', sa.Text(), {"nullable": True}),
        ('teacher_modified_score', sa.Float(), {"nullable": True}),
    ]

    for name, col_type, kwargs in columns:
        if not column_exists('exercise_submissions', name):
            op.add_column('exercise_submissions', sa.Column(name, col_type, **kwargs))
    
    # Create indexes
    if not index_exists(op.f('ix_exercise_submissions_queue_position')):
        op.create_index(op.f('ix_exercise_submissions_queue_position'), 'exercise_submissions', ['queue_position'])
    if not index_exists('idx_submission_queue_status'):
        op.create_index('idx_submission_queue_status', 'exercise_submissions', ['grading_status', 'queue_position'])
    if not index_exists('idx_submission_teacher_review'):
        op.create_index('idx_submission_teacher_review', 'exercise_submissions', ['teacher_reviewed', 'grading_status'])


def downgrade():
    # Drop indexes
    if index_exists('idx_submission_teacher_review'):
        op.drop_index('idx_submission_teacher_review', table_name='exercise_submissions')
    if index_exists('idx_submission_queue_status'):
        op.drop_index('idx_submission_queue_status', table_name='exercise_submissions')
    if index_exists(op.f('ix_exercise_submissions_queue_position')):
        op.drop_index(op.f('ix_exercise_submissions_queue_position'), table_name='exercise_submissions')
    
    # Drop columns
    for name in ['teacher_modified_score', 'last_grading_error', 'grading_attempts', 'queue_position']:
        if column_exists('exercise_submissions', name):
            op.drop_column('exercise_submissions', name)

