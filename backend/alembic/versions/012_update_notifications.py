"""update notifications with related fields

Revision ID: 012
Revises: 011b
Create Date: 2025-10-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '012'
down_revision = '011b'
branch_labels = None
depends_on = None


def upgrade():
    # Add related_id and related_type columns to notifications table
    op.add_column('notifications', sa.Column('related_id', sa.Integer(), nullable=True))
    op.add_column('notifications', sa.Column('related_type', sa.String(), nullable=True))


def downgrade():
    # Remove related_id and related_type columns
    op.drop_column('notifications', 'related_type')
    op.drop_column('notifications', 'related_id')

