"""add exam proctoring tables

Revision ID: 018_exam_proctoring
Revises: 017_merge_heads_after_time_spent
Create Date: 2025-11-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '018_exam_proctoring'
down_revision: Union[str, None] = '017_merge_heads_after_time_spent'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if tables already exist (from auto-creation)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create exam_proctoring_logs table if it doesn't exist
    if 'exam_proctoring_logs' not in existing_tables:
        op.create_table(
            'exam_proctoring_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=False),
            sa.Column('session_token', sa.String(length=64), nullable=True),
            sa.Column('event_type', sa.String(length=50), nullable=False),
            sa.Column('severity', sa.String(length=20), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('confidence_score', sa.Float(), nullable=True),
            sa.Column('event_metadata', sa.Text(), nullable=True),
            sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.ForeignKeyConstraint(['submission_id'], ['course_submissions.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_exam_proctoring_logs_submission_id'), 'exam_proctoring_logs', ['submission_id'], unique=False)
        op.create_index(op.f('ix_exam_proctoring_logs_session_token'), 'exam_proctoring_logs', ['session_token'], unique=False)
        op.create_index(op.f('ix_exam_proctoring_logs_timestamp'), 'exam_proctoring_logs', ['timestamp'], unique=False)
    else:
        # Table exists, check if we need to rename metadata column
        columns = [col['name'] for col in inspector.get_columns('exam_proctoring_logs')]
        if 'metadata' in columns and 'event_metadata' not in columns:
            op.alter_column('exam_proctoring_logs', 'metadata', new_column_name='event_metadata')
    
    # Create exam_monitoring_sessions table if it doesn't exist
    if 'exam_monitoring_sessions' not in existing_tables:
        op.create_table(
            'exam_monitoring_sessions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('submission_id', sa.Integer(), nullable=False),
            sa.Column('student_id', sa.Integer(), nullable=False),
            sa.Column('exam_id', sa.Integer(), nullable=False),
            sa.Column('session_token', sa.String(length=64), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
            sa.Column('warning_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('critical_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('last_identity_check', sa.DateTime(), nullable=True),
            sa.Column('auto_submitted', sa.Boolean(), nullable=False, server_default='0'),
            sa.Column('auto_submit_reason', sa.Text(), nullable=True),
            sa.Column('started_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('ended_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['submission_id'], ['course_submissions.id'], ),
            sa.ForeignKeyConstraint(['student_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_exam_monitoring_sessions_submission_id'), 'exam_monitoring_sessions', ['submission_id'], unique=True)
        op.create_index(op.f('ix_exam_monitoring_sessions_student_id'), 'exam_monitoring_sessions', ['student_id'], unique=False)
        op.create_index(op.f('ix_exam_monitoring_sessions_exam_id'), 'exam_monitoring_sessions', ['exam_id'], unique=False)
        op.create_index(op.f('ix_exam_monitoring_sessions_session_token'), 'exam_monitoring_sessions', ['session_token'], unique=True)
        op.create_index(op.f('ix_exam_monitoring_sessions_is_active'), 'exam_monitoring_sessions', ['is_active'], unique=False)


def downgrade() -> None:
    # Drop exam_monitoring_sessions table
    op.drop_index(op.f('ix_exam_monitoring_sessions_is_active'), table_name='exam_monitoring_sessions')
    op.drop_index(op.f('ix_exam_monitoring_sessions_session_token'), table_name='exam_monitoring_sessions')
    op.drop_index(op.f('ix_exam_monitoring_sessions_exam_id'), table_name='exam_monitoring_sessions')
    op.drop_index(op.f('ix_exam_monitoring_sessions_student_id'), table_name='exam_monitoring_sessions')
    op.drop_index(op.f('ix_exam_monitoring_sessions_submission_id'), table_name='exam_monitoring_sessions')
    op.drop_table('exam_monitoring_sessions')

    # Drop exam_proctoring_logs table
    op.drop_index(op.f('ix_exam_proctoring_logs_timestamp'), table_name='exam_proctoring_logs')
    op.drop_index(op.f('ix_exam_proctoring_logs_session_token'), table_name='exam_proctoring_logs')
    op.drop_index(op.f('ix_exam_proctoring_logs_submission_id'), table_name='exam_proctoring_logs')
    op.drop_table('exam_proctoring_logs')
