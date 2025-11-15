"""
Add google_id column to users table

Revision ID: 019_add_google_id_to_users
Revises: 018_exam_proctoring
Create Date: 2025-11-16
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '019_add_google_id_to_users'
down_revision = '018_exam_proctoring'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add google_id column to users table"""
    # Add google_id column
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    
    # Create index for faster lookup
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=False)


def downgrade() -> None:
    """Remove google_id column from users table"""
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_column('users', 'google_id')
