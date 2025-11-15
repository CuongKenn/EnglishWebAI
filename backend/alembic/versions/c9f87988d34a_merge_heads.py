"""merge_heads

Revision ID: c9f87988d34a
Revises: 018_exam_proctoring, 28c2fd37876a
Create Date: 2025-11-15 07:32:42.670976

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9f87988d34a'
down_revision: Union[str, None] = ('018_exam_proctoring', '28c2fd37876a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
