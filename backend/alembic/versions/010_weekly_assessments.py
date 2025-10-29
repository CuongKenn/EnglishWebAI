"""add weekly assessments table

Revision ID: 010_weekly_assessments
Revises: 009_ai_grading_features
Create Date: 2024-10-29

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = '010_weekly_assessments'
down_revision = '009_ai_grading_features'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create weekly_assessments table
    op.create_table(
        'weekly_assessments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('class_id', sa.Integer(), nullable=False),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('week_number', sa.Integer(), nullable=False),
        sa.Column('skill_type', sa.String(), nullable=False),  # reading, writing, listening, speaking
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('worksheet_id', sa.Integer(), nullable=True),  # Link to worksheet if generated
        sa.Column('content', sa.JSON(), nullable=True),  # Assessment content
        sa.Column('rubrics', sa.JSON(), nullable=True),  # Grading rubrics
        sa.Column('max_score', sa.Float(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),  # Duration in minutes
        sa.Column('ai_generated', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['class_id'], ['classes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['worksheet_id'], ['worksheets.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_weekly_assessments_class_id', 'weekly_assessments', ['class_id'])
    op.create_index('ix_weekly_assessments_teacher_id', 'weekly_assessments', ['teacher_id'])
    op.create_index('ix_weekly_assessments_week_skill', 'weekly_assessments', ['class_id', 'week_number', 'skill_type'])


def downgrade() -> None:
    op.drop_index('ix_weekly_assessments_week_skill', table_name='weekly_assessments')
    op.drop_index('ix_weekly_assessments_teacher_id', table_name='weekly_assessments')
    op.drop_index('ix_weekly_assessments_class_id', table_name='weekly_assessments')
    op.drop_table('weekly_assessments')

