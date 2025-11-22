"""merge multiple heads

Revision ID: b77415890953
Revises: 014_performance_indexes, 015_enhanced_weekly_assessments, bd54d8070a70
Create Date: 2025-11-02 01:38:59.522623

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b77415890953'
down_revision: Union[str, None] = ('014_performance_indexes', '015_enhanced_weekly_assess', 'bd54d8070a70')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
