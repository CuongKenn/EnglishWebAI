"""add system_configs table

Revision ID: 008
Revises: 007
Create Date: 2025-10-25

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    # Create system_configs table
    op.create_table(
        'system_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_system_configs_id', 'system_configs', ['id'], unique=False)
    op.create_index('ix_system_configs_key', 'system_configs', ['key'], unique=True)


def downgrade():
    op.drop_index('ix_system_configs_key', table_name='system_configs')
    op.drop_index('ix_system_configs_id', table_name='system_configs')
    op.drop_table('system_configs')
