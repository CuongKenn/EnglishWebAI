"""add exam assessments

Revision ID: 011b
Revises: 011a
Create Date: 2025-10-30

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
revision = '011b'
down_revision = '011a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create exam_assessments table if not exists
    if not table_exists('exam_assessments'):
        op.create_table(
        'exam_assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('exam_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('original_filename', sa.String(), nullable=True),
        sa.Column('file_path', sa.String(), nullable=True),
        sa.Column('content', sa.JSON(), nullable=False),
        sa.Column('answer_key', sa.JSON(), nullable=True),
        sa.Column('rubrics', sa.JSON(), nullable=True),
        sa.Column('total_points', sa.Float(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ai_parsed', sa.Boolean(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
        op.create_index(op.f('ix_exam_assessments_id'), 'exam_assessments', ['id'], unique=False)
        op.create_index(op.f('ix_exam_assessments_class_id'), 'exam_assessments', ['class_id'], unique=False)
        op.create_index(op.f('ix_exam_assessments_teacher_id'), 'exam_assessments', ['teacher_id'], unique=False)

    # Create exam_submissions table if not exists
    if not table_exists('exam_submissions'):
        op.create_table(
        'exam_submissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exam_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('answers', sa.JSON(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('ai_score', sa.Float(), nullable=True),
        sa.Column('rubrics_scores', sa.JSON(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('error_analysis', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('graded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['exam_id'], ['exam_assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_exam_submissions_id'), 'exam_submissions', ['id'], unique=False)
        op.create_index(op.f('ix_exam_submissions_exam_id'), 'exam_submissions', ['exam_id'], unique=False)
        op.create_index(op.f('ix_exam_submissions_student_id'), 'exam_submissions', ['student_id'], unique=False)



def downgrade() -> None:
    op.drop_index(op.f('ix_exam_submissions_student_id'), table_name='exam_submissions')
    op.drop_index(op.f('ix_exam_submissions_exam_id'), table_name='exam_submissions')
    op.drop_index(op.f('ix_exam_submissions_id'), table_name='exam_submissions')
    op.drop_table('exam_submissions')
    
    op.drop_index(op.f('ix_exam_assessments_teacher_id'), table_name='exam_assessments')
    op.drop_index(op.f('ix_exam_assessments_class_id'), table_name='exam_assessments')
    op.drop_index(op.f('ix_exam_assessments_id'), table_name='exam_assessments')
    op.drop_table('exam_assessments')

