"""add analytics indexes for performance

Revision ID: 011
Revises: 010
Create Date: 2025-10-30

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    """Add indexes for better analytics query performance"""
    
    # Submissions table indexes
    with op.batch_alter_table('exercise_submissions', schema=None) as batch_op:
        # Add indexes to frequently queried columns
        batch_op.create_index('idx_submission_score', ['score'], unique=False)
        batch_op.create_index('idx_submission_status', ['status'], unique=False)
        batch_op.create_index('idx_submission_submitted_at', ['submitted_at'], unique=False)
        batch_op.create_index('idx_submission_graded_at', ['graded_at'], unique=False)
        
        # Composite indexes for common query patterns
        batch_op.create_index('idx_submission_student_exercise', ['student_id', 'exercise_id'], unique=False)
        batch_op.create_index('idx_submission_graded', ['graded_at', 'score'], unique=False)
        batch_op.create_index('idx_submission_date_range', ['submitted_at', 'exercise_id'], unique=False)
    
    # Exercises table indexes
    with op.batch_alter_table('exercises', schema=None) as batch_op:
        # Add indexes to frequently queried columns
        batch_op.create_index('idx_exercise_type', ['type'], unique=False)
        batch_op.create_index('idx_exercise_skill_type', ['skill_type'], unique=False)
        batch_op.create_index('idx_exercise_due_at', ['due_at'], unique=False)
        batch_op.create_index('idx_exercise_created_at', ['created_at'], unique=False)
        
        # Composite indexes
        batch_op.create_index('idx_exercise_class_skill', ['class_id', 'skill_type'], unique=False)
        batch_op.create_index('idx_exercise_class_created', ['class_id', 'created_at'], unique=False)


def downgrade():
    """Remove analytics indexes"""
    
    # Remove Submissions indexes
    with op.batch_alter_table('exercise_submissions', schema=None) as batch_op:
        batch_op.drop_index('idx_submission_date_range')
        batch_op.drop_index('idx_submission_graded')
        batch_op.drop_index('idx_submission_student_exercise')
        batch_op.drop_index('idx_submission_graded_at')
        batch_op.drop_index('idx_submission_submitted_at')
        batch_op.drop_index('idx_submission_status')
        batch_op.drop_index('idx_submission_score')
    
    # Remove Exercises indexes
    with op.batch_alter_table('exercises', schema=None) as batch_op:
        batch_op.drop_index('idx_exercise_class_created')
        batch_op.drop_index('idx_exercise_class_skill')
        batch_op.drop_index('idx_exercise_created_at')
        batch_op.drop_index('idx_exercise_due_at')
        batch_op.drop_index('idx_exercise_skill_type')
        batch_op.drop_index('idx_exercise_type')

