"""add analytics indexes for performance

Revision ID: 011a
Revises: 010
Create Date: 2025-10-30

"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to import migration utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import index_exists


# revision identifiers, used by Alembic.
revision = '011a'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    """Add indexes for better analytics query performance"""
    
    # Submissions table indexes
    submission_indexes = [
        ('idx_submission_score', ['score']),
        ('idx_submission_status', ['status']),
        ('idx_submission_submitted_at', ['submitted_at']),
        ('idx_submission_graded_at', ['graded_at']),
        ('idx_submission_student_exercise', ['student_id', 'exercise_id']),
        ('idx_submission_graded', ['graded_at', 'score']),
        ('idx_submission_date_range', ['submitted_at', 'exercise_id']),
    ]

    with op.batch_alter_table('exercise_submissions', schema=None) as batch_op:
        for name, columns in submission_indexes:
            if not index_exists(name):
                batch_op.create_index(name, columns, unique=False)

    # Exercises table indexes
    exercise_indexes = [
        ('idx_exercise_type', ['type']),
        ('idx_exercise_skill_type', ['skill_type']),
        ('idx_exercise_due_at', ['due_at']),
        ('idx_exercise_created_at', ['created_at']),
        ('idx_exercise_class_skill', ['class_id', 'skill_type']),
        ('idx_exercise_class_created', ['class_id', 'created_at']),
    ]

    with op.batch_alter_table('exercises', schema=None) as batch_op:
        for name, columns in exercise_indexes:
            if not index_exists(name):
                batch_op.create_index(name, columns, unique=False)


def downgrade():
    """Remove analytics indexes"""
    
    # Remove Submissions indexes
    submission_indexes = [
        'idx_submission_date_range',
        'idx_submission_graded',
        'idx_submission_student_exercise',
        'idx_submission_graded_at',
        'idx_submission_submitted_at',
        'idx_submission_status',
        'idx_submission_score',
    ]

    with op.batch_alter_table('exercise_submissions', schema=None) as batch_op:
        for name in submission_indexes:
            if index_exists(name):
                batch_op.drop_index(name)

    # Remove Exercises indexes
    exercise_indexes = [
        'idx_exercise_class_created',
        'idx_exercise_class_skill',
        'idx_exercise_created_at',
        'idx_exercise_due_at',
        'idx_exercise_skill_type',
        'idx_exercise_type',
    ]

    with op.batch_alter_table('exercises', schema=None) as batch_op:
        for name in exercise_indexes:
            if index_exists(name):
                batch_op.drop_index(name)
