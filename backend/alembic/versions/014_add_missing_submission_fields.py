"""add missing submission fields

Revision ID: 014
Revises: 013
Create Date: 2025-11-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns to exercise_submissions table
    op.add_column('exercise_submissions', sa.Column('queue_position', sa.Integer(), nullable=True))
    op.add_column('exercise_submissions', sa.Column('grading_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('exercise_submissions', sa.Column('last_grading_error', sa.Text(), nullable=True))
    op.add_column('exercise_submissions', sa.Column('teacher_modified_score', sa.Float(), nullable=True))
    
    # Create indexes
    op.create_index(op.f('ix_exercise_submissions_queue_position'), 'exercise_submissions', ['queue_position'])
    op.create_index('idx_submission_queue_status', 'exercise_submissions', ['grading_status', 'queue_position'])
    op.create_index('idx_submission_teacher_review', 'exercise_submissions', ['teacher_reviewed', 'grading_status'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_submission_teacher_review', table_name='exercise_submissions')
    op.drop_index('idx_submission_queue_status', table_name='exercise_submissions')
    op.drop_index(op.f('ix_exercise_submissions_queue_position'), table_name='exercise_submissions')
    
    # Drop columns
    op.drop_column('exercise_submissions', 'teacher_modified_score')
    op.drop_column('exercise_submissions', 'last_grading_error')
    op.drop_column('exercise_submissions', 'grading_attempts')
    op.drop_column('exercise_submissions', 'queue_position')

