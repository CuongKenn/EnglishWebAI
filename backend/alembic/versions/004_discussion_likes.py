"""Add discussion_likes table

Revision ID: 004
Revises: 003
Create Date: 2025-10-24

"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to path to import migration_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import table_exists

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Create discussion_likes table if not exists
    if not table_exists('discussion_likes'):
        op.create_table(
        'discussion_likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('thread_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['thread_id'], ['discussion_threads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('thread_id', 'user_id', name='unique_thread_user_like')
        )
        op.create_index('ix_discussion_likes_id', 'discussion_likes', ['id'])
        op.create_index('ix_discussion_likes_thread_id', 'discussion_likes', ['thread_id'])


def downgrade():
    op.drop_index('ix_discussion_likes_thread_id', table_name='discussion_likes')
    op.drop_index('ix_discussion_likes_id', table_name='discussion_likes')
    op.drop_table('discussion_likes')
