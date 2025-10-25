"""update news table

Revision ID: 007
Revises: 006
Create Date: 2025-10-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to news_posts table
    op.add_column('news_posts', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('news_posts', sa.Column('category', sa.String(), nullable=False, server_default='Thông báo'))
    op.add_column('news_posts', sa.Column('icon', sa.String(), nullable=True, server_default='📰'))
    op.add_column('news_posts', sa.Column('type', sa.String(), nullable=False, server_default='announcement'))
    op.add_column('news_posts', sa.Column('image', sa.String(), nullable=True))
    op.add_column('news_posts', sa.Column('views', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('news_posts', sa.Column('likes', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('news_posts', sa.Column('reading_time', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('news_posts', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    # Remove added columns
    op.drop_column('news_posts', 'updated_at')
    op.drop_column('news_posts', 'reading_time')
    op.drop_column('news_posts', 'likes')
    op.drop_column('news_posts', 'views')
    op.drop_column('news_posts', 'image')
    op.drop_column('news_posts', 'type')
    op.drop_column('news_posts', 'icon')
    op.drop_column('news_posts', 'category')
    op.drop_column('news_posts', 'description')

