"""update notifications with related fields

Revision ID: 012
Revises: 011b
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to import migration utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import column_exists


# revision identifiers, used by Alembic.
revision = '012'
down_revision = '011b'
branch_labels = None
depends_on = None


def upgrade():
    # Add related_id and related_type columns to notifications table
    if not column_exists('notifications', 'related_id'):
        op.add_column('notifications', sa.Column('related_id', sa.Integer(), nullable=True))
    if not column_exists('notifications', 'related_type'):
        op.add_column('notifications', sa.Column('related_type', sa.String(), nullable=True))


def downgrade():
    # Remove related_id and related_type columns
    if column_exists('notifications', 'related_type'):
        op.drop_column('notifications', 'related_type')
    if column_exists('notifications', 'related_id'):
        op.drop_column('notifications', 'related_id')

