"""Add AI grading features

Revision ID: 009
Revises: 008
Create Date: 2025-01-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to exercises table
    op.add_column('exercises', sa.Column('skill_type', sa.String(), nullable=True))
    op.add_column('exercises', sa.Column('enable_ai_grading', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('exercises', sa.Column('rubrics', sa.JSON(), nullable=True))
    op.add_column('exercises', sa.Column('content', sa.JSON(), nullable=True))
    
    # Change max_score from Integer to Float
    op.alter_column('exercises', 'max_score',
               existing_type=sa.Integer(),
               type_=sa.Float(),
               existing_nullable=True)
    
    # Add new columns to exercise_submissions table
    op.add_column('exercise_submissions', sa.Column('ai_feedback', sa.Text(), nullable=True))
    op.add_column('exercise_submissions', sa.Column('ai_score', sa.Float(), nullable=True))
    op.add_column('exercise_submissions', sa.Column('rubrics_scores', sa.JSON(), nullable=True))
    op.add_column('exercise_submissions', sa.Column('error_analysis', sa.JSON(), nullable=True))
    op.add_column('exercise_submissions', sa.Column('ai_graded_at', sa.DateTime(timezone=True), nullable=True))
    
    # Change score from Integer to Float
    op.alter_column('exercise_submissions', 'score',
               existing_type=sa.Integer(),
               type_=sa.Float(),
               existing_nullable=True)
    
    # Add new columns to lessons table
    op.add_column('lessons', sa.Column('session_number', sa.Integer(), nullable=True))
    op.add_column('lessons', sa.Column('lesson_date', sa.Date(), nullable=True))


def downgrade():
    # Remove columns from lessons table
    op.drop_column('lessons', 'lesson_date')
    op.drop_column('lessons', 'session_number')
    
    # Remove columns from exercise_submissions table
    op.alter_column('exercise_submissions', 'score',
               existing_type=sa.Float(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.drop_column('exercise_submissions', 'ai_graded_at')
    op.drop_column('exercise_submissions', 'error_analysis')
    op.drop_column('exercise_submissions', 'rubrics_scores')
    op.drop_column('exercise_submissions', 'ai_score')
    op.drop_column('exercise_submissions', 'ai_feedback')
    
    # Remove columns from exercises table
    op.alter_column('exercises', 'max_score',
               existing_type=sa.Float(),
               type_=sa.Integer(),
               existing_nullable=True)
    op.drop_column('exercises', 'content')
    op.drop_column('exercises', 'rubrics')
    op.drop_column('exercises', 'enable_ai_grading')
    op.drop_column('exercises', 'skill_type')

