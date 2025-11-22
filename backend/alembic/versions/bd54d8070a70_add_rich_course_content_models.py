"""add_rich_course_content_models

Revision ID: bd54d8070a70
Revises: 014
Create Date: 2025-11-01 17:43:24.775959

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sys
import os

# Add parent directory to path to import migration_utils
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from migration_utils import table_exists

# revision identifiers, used by Alembic.
revision: str = 'bd54d8070a70'
down_revision: Union[str, None] = '014'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ============= READING TABLES =============
    
    # Create reading_passages table
    if not table_exists('reading_passages'):
        op.create_table(
        'reading_passages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('subtitle', sa.Text(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('estimated_time', sa.Integer(), nullable=True),
        sa.Column('total_questions', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['unit_id'], ['course_units.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_reading_passages_id'), 'reading_passages', ['id'], unique=False)
        op.create_index(op.f('ix_reading_passages_unit_id'), 'reading_passages', ['unit_id'], unique=False)
    
    # Create reading_paragraphs table
    if not table_exists('reading_paragraphs'):
        op.create_table(
        'reading_paragraphs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('passage_id', sa.Integer(), nullable=False),
        sa.Column('paragraph_id', sa.String(), nullable=False),
        sa.Column('heading', sa.String(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['passage_id'], ['reading_passages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_reading_paragraphs_id'), 'reading_paragraphs', ['id'], unique=False)
        op.create_index(op.f('ix_reading_paragraphs_passage_id'), 'reading_paragraphs', ['passage_id'], unique=False)
    
    # Create reading_questions table
    if not table_exists('reading_questions'):
        op.create_table(
        'reading_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paragraph_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('instruction', sa.Text(), nullable=False),
        sa.Column('options_json', sa.Text(), nullable=True),
        sa.Column('correct_answer', sa.Integer(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['paragraph_id'], ['reading_paragraphs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_reading_questions_id'), 'reading_questions', ['id'], unique=False)
        op.create_index(op.f('ix_reading_questions_paragraph_id'), 'reading_questions', ['paragraph_id'], unique=False)
    
    # ============= WRITING TABLES =============
    
    # Create writing_prompts table
    if not table_exists('writing_prompts'):
        op.create_table(
        'writing_prompts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('instruction', sa.Text(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('additional_instruction', sa.Text(), nullable=True),
        sa.Column('min_words', sa.Integer(), nullable=True, server_default='100'),
        sa.Column('max_words', sa.Integer(), nullable=True, server_default='300'),
        sa.Column('time_limit', sa.Integer(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('sample_answer', sa.Text(), nullable=True),
        sa.Column('hints_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['unit_id'], ['course_units.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_writing_prompts_id'), 'writing_prompts', ['id'], unique=False)
        op.create_index(op.f('ix_writing_prompts_unit_id'), 'writing_prompts', ['unit_id'], unique=False)
    
    # Create writing_rubrics table
    if not table_exists('writing_rubrics'):
        op.create_table(
        'writing_rubrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prompt_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('max_points', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['prompt_id'], ['writing_prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_writing_rubrics_id'), 'writing_rubrics', ['id'], unique=False)
        op.create_index(op.f('ix_writing_rubrics_prompt_id'), 'writing_rubrics', ['prompt_id'], unique=False)
    
    # ============= LISTENING TABLES =============
    
    # Create listening_audios table
    if not table_exists('listening_audios'):
        op.create_table(
        'listening_audios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('audio_url', sa.String(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('topic', sa.String(), nullable=True),
        sa.Column('accent', sa.String(), nullable=True),
        sa.Column('speed', sa.String(), nullable=True),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('has_transcript', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('total_questions', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['unit_id'], ['course_units.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_listening_audios_id'), 'listening_audios', ['id'], unique=False)
        op.create_index(op.f('ix_listening_audios_unit_id'), 'listening_audios', ['unit_id'], unique=False)
    
    # Create listening_questions table
    if not table_exists('listening_questions'):
        op.create_table(
        'listening_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('audio_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('options_json', sa.Text(), nullable=True),
        sa.Column('correct_answer', sa.String(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.Float(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['audio_id'], ['listening_audios.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_listening_questions_id'), 'listening_questions', ['id'], unique=False)
        op.create_index(op.f('ix_listening_questions_audio_id'), 'listening_questions', ['audio_id'], unique=False)
    
    # ============= SPEAKING TABLES =============
    
    # Create speaking_prompts table
    if not table_exists('speaking_prompts'):
        op.create_table(
        'speaking_prompts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('instruction', sa.Text(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('context', sa.Text(), nullable=True),
        sa.Column('preparation_time', sa.Integer(), nullable=True),
        sa.Column('response_time', sa.Integer(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('sample_response', sa.Text(), nullable=True),
        sa.Column('sample_audio_url', sa.String(), nullable=True),
        sa.Column('tips_json', sa.Text(), nullable=True),
        sa.Column('vocabulary_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['unit_id'], ['course_units.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_speaking_prompts_id'), 'speaking_prompts', ['id'], unique=False)
        op.create_index(op.f('ix_speaking_prompts_unit_id'), 'speaking_prompts', ['unit_id'], unique=False)
    
    # Create speaking_criteria table
    if not table_exists('speaking_criteria'):
        op.create_table(
        'speaking_criteria',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prompt_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('max_points', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['prompt_id'], ['speaking_prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_speaking_criteria_id'), 'speaking_criteria', ['id'], unique=False)
        op.create_index(op.f('ix_speaking_criteria_prompt_id'), 'speaking_criteria', ['prompt_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order (to respect foreign keys)
    op.drop_index(op.f('ix_speaking_criteria_prompt_id'), table_name='speaking_criteria')
    op.drop_index(op.f('ix_speaking_criteria_id'), table_name='speaking_criteria')
    op.drop_table('speaking_criteria')
    
    op.drop_index(op.f('ix_speaking_prompts_unit_id'), table_name='speaking_prompts')
    op.drop_index(op.f('ix_speaking_prompts_id'), table_name='speaking_prompts')
    op.drop_table('speaking_prompts')
    
    op.drop_index(op.f('ix_listening_questions_audio_id'), table_name='listening_questions')
    op.drop_index(op.f('ix_listening_questions_id'), table_name='listening_questions')
    op.drop_table('listening_questions')
    
    op.drop_index(op.f('ix_listening_audios_unit_id'), table_name='listening_audios')
    op.drop_index(op.f('ix_listening_audios_id'), table_name='listening_audios')
    op.drop_table('listening_audios')
    
    op.drop_index(op.f('ix_writing_rubrics_prompt_id'), table_name='writing_rubrics')
    op.drop_index(op.f('ix_writing_rubrics_id'), table_name='writing_rubrics')
    op.drop_table('writing_rubrics')
    
    op.drop_index(op.f('ix_writing_prompts_unit_id'), table_name='writing_prompts')
    op.drop_index(op.f('ix_writing_prompts_id'), table_name='writing_prompts')
    op.drop_table('writing_prompts')
    
    op.drop_index(op.f('ix_reading_questions_paragraph_id'), table_name='reading_questions')
    op.drop_index(op.f('ix_reading_questions_id'), table_name='reading_questions')
    op.drop_table('reading_questions')
    
    op.drop_index(op.f('ix_reading_paragraphs_passage_id'), table_name='reading_paragraphs')
    op.drop_index(op.f('ix_reading_paragraphs_id'), table_name='reading_paragraphs')
    op.drop_table('reading_paragraphs')
    
    op.drop_index(op.f('ix_reading_passages_unit_id'), table_name='reading_passages')
    op.drop_index(op.f('ix_reading_passages_id'), table_name='reading_passages')
    op.drop_table('reading_passages')
