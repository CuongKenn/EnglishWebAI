"""Add OTP table

Revision ID: 002_add_otp_table
Revises: 001_initial
Create Date: 2025-10-24

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_otp_table'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create otps table
    op.create_table(
        'otps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=10), nullable=False),
        sa.Column('purpose', sa.String(length=50), nullable=False),
        sa.Column('is_used', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_otps_id'), 'otps', ['id'], unique=False)


def downgrade() -> None:
    # Drop otps table
    op.drop_index(op.f('ix_otps_id'), table_name='otps')
    op.drop_table('otps')
