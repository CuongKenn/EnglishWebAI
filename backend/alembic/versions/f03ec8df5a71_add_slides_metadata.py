"""add_slides_metadata

Revision ID: f03ec8df5a71
Revises: f03ec8df5a70
Create Date: 2025-11-22 11:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f03ec8df5a71'
down_revision: Union[str, None] = 'f03ec8df5a70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('video_lessons', sa.Column('slides_metadata', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('video_lessons', 'slides_metadata')
