"""add_video_lessons_table

Revision ID: 018_add_video_lessons
Revises: 017_merge_heads_after_time_spent
Create Date: 2025-06-01 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '018_add_video_lessons'
down_revision: Union[str, None] = '28c2fd37876a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create video_lessons table"""
    op.create_table(
        'video_lessons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lesson_id', sa.Integer(), nullable=True),
        sa.Column('teacher_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('video_url', sa.String(length=500), nullable=True),
        sa.Column('ppt_file_path', sa.String(length=500), nullable=True),
        sa.Column('slides_count', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('voice_type', sa.String(length=100), nullable=True, server_default='vi-VN-HoaiMyNeural'),
        sa.Column('language', sa.String(length=10), nullable=True, server_default='vi'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create indexes for better query performance
    op.create_index('ix_video_lessons_teacher_id', 'video_lessons', ['teacher_id'])
    op.create_index('ix_video_lessons_lesson_id', 'video_lessons', ['lesson_id'])
    op.create_index('ix_video_lessons_status', 'video_lessons', ['status'])
    op.create_index('ix_video_lessons_created_at', 'video_lessons', ['created_at'])


def downgrade() -> None:
    """Drop video_lessons table"""
    op.drop_index('ix_video_lessons_created_at', table_name='video_lessons')
    op.drop_index('ix_video_lessons_status', table_name='video_lessons')
    op.drop_index('ix_video_lessons_lesson_id', table_name='video_lessons')
    op.drop_index('ix_video_lessons_teacher_id', table_name='video_lessons')
    op.drop_table('video_lessons')
