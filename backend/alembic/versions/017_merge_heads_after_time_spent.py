"""merge heads after adding time_spent column

Revision ID: 017_merge_heads_after_time_spent
Revises: bd54d8070a70, 016_time_spent_course_subs
Create Date: 2025-11-07 04:50:00.000000
"""

# revision identifiers, used by Alembic.
revision = '017_merge_heads_after_time_spent'
down_revision = ('bd54d8070a70', '016_time_spent_course_subs')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
