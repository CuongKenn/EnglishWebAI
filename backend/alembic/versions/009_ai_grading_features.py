"""Add AI grading features

Revision ID: 009
Revises: 008
Create Date: 2025-01-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sys
import os

# Add parent directory to import migration utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import column_exists, get_column_data_type

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to exercises table
    exercise_columns = [
        ('skill_type', sa.String(), {"nullable": True}),
        ('enable_ai_grading', sa.Boolean(), {"server_default": 'false', "nullable": True}),
        ('rubrics', sa.JSON(), {"nullable": True}),
        ('content', sa.JSON(), {"nullable": True}),
    ]

    for name, col_type, kwargs in exercise_columns:
        if not column_exists('exercises', name):
            op.add_column('exercises', sa.Column(name, col_type, **kwargs))

    # Change max_score from Integer to Float
    if column_exists('exercises', 'max_score'):
        data_type = get_column_data_type('exercises', 'max_score')
        if data_type not in ('double precision', 'numeric', 'real'):
            op.alter_column('exercises', 'max_score',
                            existing_type=sa.Integer(),
                            type_=sa.Float(),
                            existing_nullable=True)

    # Add new columns to exercise_submissions table
    submission_columns = [
        ('ai_feedback', sa.Text(), {"nullable": True}),
        ('ai_score', sa.Float(), {"nullable": True}),
        ('rubrics_scores', sa.JSON(), {"nullable": True}),
        ('error_analysis', sa.JSON(), {"nullable": True}),
        ('ai_graded_at', sa.DateTime(timezone=True), {"nullable": True}),
    ]

    for name, col_type, kwargs in submission_columns:
        if not column_exists('exercise_submissions', name):
            op.add_column('exercise_submissions', sa.Column(name, col_type, **kwargs))

    # Change score from Integer to Float
    if column_exists('exercise_submissions', 'score'):
        data_type = get_column_data_type('exercise_submissions', 'score')
        if data_type not in ('double precision', 'numeric', 'real'):
            op.alter_column('exercise_submissions', 'score',
                            existing_type=sa.Integer(),
                            type_=sa.Float(),
                            existing_nullable=True)

    # Add new columns to lessons table
    lesson_columns = [
        ('session_number', sa.Integer(), {"nullable": True}),
        ('lesson_date', sa.Date(), {"nullable": True}),
    ]

    for name, col_type, kwargs in lesson_columns:
        if not column_exists('lessons', name):
            op.add_column('lessons', sa.Column(name, col_type, **kwargs))


def downgrade():
    # Remove columns from lessons table
    if column_exists('lessons', 'lesson_date'):
        op.drop_column('lessons', 'lesson_date')
    if column_exists('lessons', 'session_number'):
        op.drop_column('lessons', 'session_number')

    # Remove columns from exercise_submissions table
    if column_exists('exercise_submissions', 'score'):
        data_type = get_column_data_type('exercise_submissions', 'score')
        if data_type in ('double precision', 'numeric', 'real'):
            op.alter_column('exercise_submissions', 'score',
                            existing_type=sa.Float(),
                            type_=sa.Integer(),
                            existing_nullable=True)

    for name in ['ai_graded_at', 'error_analysis', 'rubrics_scores', 'ai_score', 'ai_feedback']:
        if column_exists('exercise_submissions', name):
            op.drop_column('exercise_submissions', name)

    # Remove columns from exercises table
    if column_exists('exercises', 'max_score'):
        data_type = get_column_data_type('exercises', 'max_score')
        if data_type in ('double precision', 'numeric', 'real'):
            op.alter_column('exercises', 'max_score',
                            existing_type=sa.Float(),
                            type_=sa.Integer(),
                            existing_nullable=True)

    for name in ['content', 'rubrics', 'enable_ai_grading', 'skill_type']:
        if column_exists('exercises', name):
            op.drop_column('exercises', name)
