"""Add course_progress and unit_attempts tables

Revision ID: 010_course_progress
Revises: 009_ai_grading_features
Create Date: 2024-01-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func


# revision identifiers, used by Alembic.
revision = '010_course_progress'
down_revision = '009_ai_grading_features'
branch_labels = None
depends_on = None


def upgrade():
    # Create course_progress table
    op.create_table(
        'course_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('cups_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['unit_id'], ['course_units.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_course_progress_id', 'course_progress', ['id'])
    op.create_index('ix_course_progress_user_id', 'course_progress', ['user_id'])
    op.create_index('ix_course_progress_course_id', 'course_progress', ['course_id'])
    op.create_index('ix_course_progress_unit_id', 'course_progress', ['unit_id'])

    # Create unit_attempts table
    op.create_table(
        'unit_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('answers_json', sa.Text(), nullable=True),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('max_score', sa.Integer(), nullable=True),
        sa.Column('cups_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_passed', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['unit_id'], ['course_units.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_unit_attempts_id', 'unit_attempts', ['id'])
    op.create_index('ix_unit_attempts_user_id', 'unit_attempts', ['user_id'])
    op.create_index('ix_unit_attempts_unit_id', 'unit_attempts', ['unit_id'])


def downgrade():
    op.drop_index('ix_unit_attempts_unit_id', 'unit_attempts')
    op.drop_index('ix_unit_attempts_user_id', 'unit_attempts')
    op.drop_index('ix_unit_attempts_id', 'unit_attempts')
    op.drop_table('unit_attempts')
    
    op.drop_index('ix_course_progress_unit_id', 'course_progress')
    op.drop_index('ix_course_progress_course_id', 'course_progress')
    op.drop_index('ix_course_progress_user_id', 'course_progress')
    op.drop_index('ix_course_progress_id', 'course_progress')
    op.drop_table('course_progress')


