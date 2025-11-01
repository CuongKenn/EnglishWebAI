"""Initial migration - create users table

Revision ID: 001
Revises: 
Create Date: 2025-10-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM type if not exists (handle existing database)
    from sqlalchemy import text
    conn = op.get_bind()
    
    # Check if enum already exists
    result = conn.execute(text(
        "SELECT 1 FROM pg_type WHERE typname = 'userrole'"
    ))
    enum_exists = result.fetchone() is not None
    
    if not enum_exists:
        # Create enum type
        op.execute("CREATE TYPE userrole AS ENUM ('user', 'parent', 'teacher', 'admin', 'superadmin')")
    
    # Check if table already exists
    result = conn.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'users'"
    ))
    table_exists = result.fetchone() is not None
    
    if not table_exists:
        # Create users table
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('username', sa.String(), nullable=False),
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('role', sa.Enum('user', 'parent', 'teacher', 'admin', 'superadmin', name='userrole', create_type=False), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
            sa.Column('is_verified', sa.Boolean(), nullable=True, server_default='false'),
            sa.Column('phone', sa.String(), nullable=True),
            sa.Column('avatar_url', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
