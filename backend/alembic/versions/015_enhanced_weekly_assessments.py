"""Add enhanced weekly assessments tables

Revision ID: 015_enhanced_weekly_assess
Revises: 014_weekly_submissions
Create Date: 2025-11-02

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
revision = '015_enhanced_weekly_assess'
down_revision = '014_weekly_submissions'
branch_labels = None
depends_on = None


def upgrade():
    # Create enhanced_weekly_assessments table if not exists
    if not table_exists('enhanced_weekly_assessments'):
        op.create_table(
        'enhanced_weekly_assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('assessment_type', sa.String(), nullable=False),
        sa.Column('week_number', sa.Integer(), nullable=True),
        sa.Column('semester_period', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        
        # 4-Skills Content Structure
        sa.Column('listening_content', sa.JSON(), nullable=True),
        sa.Column('reading_content', sa.JSON(), nullable=True),
        sa.Column('writing_content', sa.JSON(), nullable=True),
        sa.Column('speaking_content', sa.JSON(), nullable=True),
        
        # Scoring Configuration
        sa.Column('listening_max_score', sa.Float(), nullable=True, default=25.0),
        sa.Column('reading_max_score', sa.Float(), nullable=True, default=25.0),
        sa.Column('writing_max_score', sa.Float(), nullable=True, default=25.0),
        sa.Column('speaking_max_score', sa.Float(), nullable=True, default=25.0),
        sa.Column('total_max_score', sa.Float(), nullable=False, default=100.0),
        
        # Rubrics for each skill
        sa.Column('listening_rubrics', sa.JSON(), nullable=True),
        sa.Column('reading_rubrics', sa.JSON(), nullable=True),
        sa.Column('writing_rubrics', sa.JSON(), nullable=True),
        sa.Column('speaking_rubrics', sa.JSON(), nullable=True),
        
        # Timing
        sa.Column('listening_duration', sa.Integer(), nullable=True),
        sa.Column('reading_duration', sa.Integer(), nullable=True),
        sa.Column('writing_duration', sa.Integer(), nullable=True),
        sa.Column('speaking_duration', sa.Integer(), nullable=True),
        sa.Column('total_duration', sa.Integer(), nullable=True),
        
        # Settings
        sa.Column('skills_enabled', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('ai_generated', sa.Boolean(), default=False),
        sa.Column('auto_grade_enabled', sa.Boolean(), default=True),
        
        # Scheduling
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        )
        
        # Create indexes
        op.create_index('ix_enhanced_weekly_assessments_id', 'enhanced_weekly_assessments', ['id'])
        op.create_index('ix_enhanced_weekly_assessments_class_id', 'enhanced_weekly_assessments', ['class_id'])
        op.create_index('ix_enhanced_weekly_assessments_teacher_id', 'enhanced_weekly_assessments', ['teacher_id'])

    # Create enhanced_weekly_submissions table if not exists
    if not table_exists('enhanced_weekly_submissions'):
        op.create_table(
        'enhanced_weekly_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        
        # Answers for each skill
        sa.Column('listening_answers', sa.JSON(), nullable=True),
        sa.Column('reading_answers', sa.JSON(), nullable=True),
        sa.Column('writing_answers', sa.JSON(), nullable=True),
        sa.Column('speaking_answers', sa.JSON(), nullable=True),
        
        # Scores for each skill
        sa.Column('listening_score', sa.Float(), nullable=True),
        sa.Column('reading_score', sa.Float(), nullable=True),
        sa.Column('writing_score', sa.Float(), nullable=True),
        sa.Column('speaking_score', sa.Float(), nullable=True),
        sa.Column('total_score', sa.Float(), nullable=True),
        
        # AI Scores
        sa.Column('listening_ai_score', sa.Float(), nullable=True),
        sa.Column('reading_ai_score', sa.Float(), nullable=True),
        sa.Column('writing_ai_score', sa.Float(), nullable=True),
        sa.Column('speaking_ai_score', sa.Float(), nullable=True),
        sa.Column('total_ai_score', sa.Float(), nullable=True),
        
        # Detailed scoring by rubrics
        sa.Column('listening_rubric_scores', sa.JSON(), nullable=True),
        sa.Column('reading_rubric_scores', sa.JSON(), nullable=True),
        sa.Column('writing_rubric_scores', sa.JSON(), nullable=True),
        sa.Column('speaking_rubric_scores', sa.JSON(), nullable=True),
        
        # Feedback for each skill
        sa.Column('listening_feedback', sa.Text(), nullable=True),
        sa.Column('reading_feedback', sa.Text(), nullable=True),
        sa.Column('writing_feedback', sa.Text(), nullable=True),
        sa.Column('speaking_feedback', sa.Text(), nullable=True),
        sa.Column('overall_feedback', sa.Text(), nullable=True),
        
        # AI Feedback
        sa.Column('listening_ai_feedback', sa.Text(), nullable=True),
        sa.Column('reading_ai_feedback', sa.Text(), nullable=True),
        sa.Column('writing_ai_feedback', sa.Text(), nullable=True),
        sa.Column('speaking_ai_feedback', sa.Text(), nullable=True),
        sa.Column('overall_ai_feedback', sa.Text(), nullable=True),
        
        # Error Analysis for each skill
        sa.Column('listening_error_analysis', sa.JSON(), nullable=True),
        sa.Column('reading_error_analysis', sa.JSON(), nullable=True),
        sa.Column('writing_error_analysis', sa.JSON(), nullable=True),
        sa.Column('speaking_error_analysis', sa.JSON(), nullable=True),
        
        # Status tracking
        sa.Column('status', sa.String(), default='not_started'),
        sa.Column('submission_progress', sa.JSON(), nullable=True),
        
        # Timestamps
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        
        # Time spent on each skill (in minutes)
        sa.Column('listening_time_spent', sa.Integer(), nullable=True),
        sa.Column('reading_time_spent', sa.Integer(), nullable=True),
        sa.Column('writing_time_spent', sa.Integer(), nullable=True),
        sa.Column('speaking_time_spent', sa.Integer(), nullable=True),
        sa.Column('total_time_spent', sa.Integer(), nullable=True),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['assessment_id'], ['enhanced_weekly_assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        )
        
        # Create indexes
        op.create_index('ix_enhanced_weekly_submissions_id', 'enhanced_weekly_submissions', ['id'])
        op.create_index('ix_enhanced_weekly_submissions_assessment_id', 'enhanced_weekly_submissions', ['assessment_id'])
        op.create_index('ix_enhanced_weekly_submissions_student_id', 'enhanced_weekly_submissions', ['student_id'])


def downgrade():
    # Drop tables and indexes
    op.drop_index('ix_enhanced_weekly_submissions_student_id', table_name='enhanced_weekly_submissions')
    op.drop_index('ix_enhanced_weekly_submissions_assessment_id', table_name='enhanced_weekly_submissions')
    op.drop_index('ix_enhanced_weekly_submissions_id', table_name='enhanced_weekly_submissions')
    op.drop_table('enhanced_weekly_submissions')
    
    op.drop_index('ix_enhanced_weekly_assessments_teacher_id', table_name='enhanced_weekly_assessments')
    op.drop_index('ix_enhanced_weekly_assessments_class_id', table_name='enhanced_weekly_assessments')
    op.drop_index('ix_enhanced_weekly_assessments_id', table_name='enhanced_weekly_assessments')
    op.drop_table('enhanced_weekly_assessments')