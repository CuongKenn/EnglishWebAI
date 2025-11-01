"""Add grading queue system

Revision ID: 013
Revises: 012
Create Date: 2025-11-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sys
import os

# Add parent directory to path to import migration_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import table_exists, column_exists

# revision identifiers, used by Alembic.
revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    # Create grading_queue table if not exists
    if not table_exists('grading_queue'):
        op.create_table(
        'grading_queue',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['submission_id'], ['exercise_submissions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('submission_id')
        )
        
        # Create indexes for grading_queue
        op.create_index('idx_queue_next_pending', 'grading_queue', ['status', 'priority', 'created_at'])
        op.create_index('idx_queue_student', 'grading_queue', ['student_id', 'status'])
        op.create_index('idx_queue_exercise', 'grading_queue', ['exercise_id', 'status'])
        op.create_index(op.f('ix_grading_queue_id'), 'grading_queue', ['id'])
        op.create_index(op.f('ix_grading_queue_status'), 'grading_queue', ['status'])
        op.create_index(op.f('ix_grading_queue_priority'), 'grading_queue', ['priority'])
    
    # Add new columns to exercise_submissions table if they don't exist
    if not column_exists('exercise_submissions', 'grading_status'):
        op.add_column('exercise_submissions', sa.Column('grading_status', sa.String(length=50), nullable=False, server_default='pending'))
    if not column_exists('exercise_submissions', 'teacher_reviewed'):
        op.add_column('exercise_submissions', sa.Column('teacher_reviewed', sa.Boolean(), nullable=False, server_default='false'))
    if not column_exists('exercise_submissions', 'teacher_reviewed_at'):
        op.add_column('exercise_submissions', sa.Column('teacher_reviewed_at', sa.DateTime(timezone=True), nullable=True))
    if not column_exists('exercise_submissions', 'teacher_reviewed_by'):
        op.add_column('exercise_submissions', sa.Column('teacher_reviewed_by', sa.Integer(), nullable=True))
    if not column_exists('exercise_submissions', 'teacher_notes'):
        op.add_column('exercise_submissions', sa.Column('teacher_notes', sa.Text(), nullable=True))
    if not column_exists('exercise_submissions', 'original_ai_score'):
        op.add_column('exercise_submissions', sa.Column('original_ai_score', sa.Float(), nullable=True))
    
    # Add foreign key for teacher_reviewed_by
    op.create_foreign_key(
        'fk_submission_teacher_reviewed_by',
        'exercise_submissions', 'users',
        ['teacher_reviewed_by'], ['id'],
        ondelete='SET NULL'
    )
    
    # Create indexes for new columns
    op.create_index(op.f('ix_submissions_grading_status'), 'exercise_submissions', ['grading_status'])
    op.create_index(op.f('ix_submissions_teacher_reviewed'), 'exercise_submissions', ['teacher_reviewed'])
    op.create_index('idx_submissions_review_pending', 'exercise_submissions', ['grading_status', 'teacher_reviewed', 'submitted_at'])


def downgrade():
    # Drop indexes from exercise_submissions
    op.drop_index('idx_submissions_review_pending', table_name='exercise_submissions')
    op.drop_index(op.f('ix_submissions_teacher_reviewed'), table_name='exercise_submissions')
    op.drop_index(op.f('ix_submissions_grading_status'), table_name='exercise_submissions')
    
    # Drop foreign key
    op.drop_constraint('fk_submission_teacher_reviewed_by', 'exercise_submissions', type_='foreignkey')
    
    # Drop new columns from exercise_submissions
    op.drop_column('exercise_submissions', 'original_ai_score')
    op.drop_column('exercise_submissions', 'teacher_notes')
    op.drop_column('exercise_submissions', 'teacher_reviewed_by')
    op.drop_column('exercise_submissions', 'teacher_reviewed_at')
    op.drop_column('exercise_submissions', 'teacher_reviewed')
    op.drop_column('exercise_submissions', 'grading_status')
    
    # Drop indexes from grading_queue
    op.drop_index(op.f('ix_grading_queue_priority'), table_name='grading_queue')
    op.drop_index(op.f('ix_grading_queue_status'), table_name='grading_queue')
    op.drop_index(op.f('ix_grading_queue_id'), table_name='grading_queue')
    op.drop_index('idx_queue_exercise', table_name='grading_queue')
    op.drop_index('idx_queue_student', table_name='grading_queue')
    op.drop_index('idx_queue_next_pending', table_name='grading_queue')
    
    # Drop grading_queue table
    op.drop_table('grading_queue')

