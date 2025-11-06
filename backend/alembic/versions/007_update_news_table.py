"""update news table

Revision ID: 007
Revises: 006
Create Date: 2025-10-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to path to import migration_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import column_exists


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to news_posts table
    columns = [
        ('description', sa.Text(), {"nullable": True}),
        ('category', sa.String(), {"nullable": False, "server_default": 'Thông báo'}),
        ('icon', sa.String(), {"nullable": True, "server_default": '📰'}),
        ('type', sa.String(), {"nullable": False, "server_default": 'announcement'}),
        ('image', sa.String(), {"nullable": True}),
        ('views', sa.Integer(), {"nullable": False, "server_default": '0'}),
        ('likes', sa.Integer(), {"nullable": False, "server_default": '0'}),
        ('reading_time', sa.Integer(), {"nullable": False, "server_default": '5'}),
        ('updated_at', sa.DateTime(timezone=True), {"nullable": True}),
    ]

    for name, col_type, kwargs in columns:
        if not column_exists('news_posts', name):
            op.add_column('news_posts', sa.Column(name, col_type, **kwargs))


def downgrade():
    # Remove added columns
    columns = [
        'updated_at',
        'reading_time',
        'likes',
        'views',
        'image',
        'type',
        'icon',
        'category',
        'description',
    ]

    for name in columns:
        if column_exists('news_posts', name):
            op.drop_column('news_posts', name)

