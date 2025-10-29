"""Add student progress tracking tables

Revision ID: 011_student_progress_tracking
Revises: 010_weekly_assessments
Create Date: 2025-10-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '011_student_progress_tracking'
down_revision = '010_weekly_assessments'
branch_labels = None
depends_on = None


def upgrade():
    # Create student_progress_snapshots table
    op.create_table(
        'student_progress_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=True),
        sa.Column('snapshot_date', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('period_type', sa.String(), nullable=True),
        sa.Column('period_label', sa.String(), nullable=True),
        sa.Column('total_submissions', sa.Integer(), nullable=True),
        sa.Column('graded_submissions', sa.Integer(), nullable=True),
        sa.Column('average_score', sa.Float(), nullable=True),
        sa.Column('completion_rate', sa.Float(), nullable=True),
        sa.Column('reading_score', sa.Float(), nullable=True),
        sa.Column('writing_score', sa.Float(), nullable=True),
        sa.Column('listening_score', sa.Float(), nullable=True),
        sa.Column('speaking_score', sa.Float(), nullable=True),
        sa.Column('reading_count', sa.Integer(), nullable=True),
        sa.Column('writing_count', sa.Integer(), nullable=True),
        sa.Column('listening_count', sa.Integer(), nullable=True),
        sa.Column('speaking_count', sa.Integer(), nullable=True),
        sa.Column('trend', sa.String(), nullable=True),
        sa.Column('attendance_rate', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('extra_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], )
    )
    op.create_index(op.f('ix_student_progress_snapshots_id'), 'student_progress_snapshots', ['id'], unique=False)
    op.create_index(op.f('ix_student_progress_snapshots_student_id'), 'student_progress_snapshots', ['student_id'], unique=False)
    op.create_index(op.f('ix_student_progress_snapshots_class_id'), 'student_progress_snapshots', ['class_id'], unique=False)
    op.create_index(op.f('ix_student_progress_snapshots_snapshot_date'), 'student_progress_snapshots', ['snapshot_date'], unique=False)

    # Create student_skill_progress table
    op.create_table(
        'student_skill_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('skill_type', sa.String(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('max_score', sa.Float(), nullable=True),
        sa.Column('percentage', sa.Float(), nullable=True),
        sa.Column('exercise_id', sa.Integer(), nullable=True),
        sa.Column('submission_id', sa.Integer(), nullable=True),
        sa.Column('assessment_date', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('strengths', sa.JSON(), nullable=True),
        sa.Column('weaknesses', sa.JSON(), nullable=True),
        sa.Column('teacher_notes', sa.Text(), nullable=True),
        sa.Column('ai_feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ),
        sa.ForeignKeyConstraint(['submission_id'], ['exercise_submissions.id'], )
    )
    op.create_index(op.f('ix_student_skill_progress_id'), 'student_skill_progress', ['id'], unique=False)
    op.create_index(op.f('ix_student_skill_progress_student_id'), 'student_skill_progress', ['student_id'], unique=False)
    op.create_index(op.f('ix_student_skill_progress_assessment_date'), 'student_skill_progress', ['assessment_date'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_student_skill_progress_assessment_date'), table_name='student_skill_progress')
    op.drop_index(op.f('ix_student_skill_progress_student_id'), table_name='student_skill_progress')
    op.drop_index(op.f('ix_student_skill_progress_id'), table_name='student_skill_progress')
    op.drop_table('student_skill_progress')
    
    op.drop_index(op.f('ix_student_progress_snapshots_snapshot_date'), table_name='student_progress_snapshots')
    op.drop_index(op.f('ix_student_progress_snapshots_class_id'), table_name='student_progress_snapshots')
    op.drop_index(op.f('ix_student_progress_snapshots_student_id'), table_name='student_progress_snapshots')
    op.drop_index(op.f('ix_student_progress_snapshots_id'), table_name='student_progress_snapshots')
    op.drop_table('student_progress_snapshots')

