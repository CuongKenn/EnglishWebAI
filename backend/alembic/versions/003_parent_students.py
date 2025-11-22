"""Add parent_students table

Revision ID: 003
Revises: 002
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
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create parent_students table if not exists
    if not table_exists('parent_students'):
        op.create_table(
        'parent_students',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['parent_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('parent_id', 'student_id', name='uq_parent_student')
        )
        op.create_index(op.f('ix_parent_students_id'), 'parent_students', ['id'], unique=False)
        op.create_index(op.f('ix_parent_students_parent_id'), 'parent_students', ['parent_id'], unique=False)
        op.create_index(op.f('ix_parent_students_student_id'), 'parent_students', ['student_id'], unique=False)


def downgrade() -> None:
    # Drop parent_students table
    op.drop_index(op.f('ix_parent_students_student_id'), table_name='parent_students')
    op.drop_index(op.f('ix_parent_students_parent_id'), table_name='parent_students')
    op.drop_index(op.f('ix_parent_students_id'), table_name='parent_students')
    op.drop_table('parent_students')
