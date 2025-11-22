"""Merge exercise soft delete

Revision ID: bde1207b1377
Revises: 016_exercise_soft_delete, 017_merge_heads_after_time_spent, b77415890953
Create Date: 2025-11-08 05:11:37.037228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bde1207b1377'
down_revision: Union[str, None] = ('016_exercise_soft_delete', '017_merge_heads_after_time_spent', 'b77415890953')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
