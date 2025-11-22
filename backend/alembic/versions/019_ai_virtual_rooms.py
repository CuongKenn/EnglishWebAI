"""add ai virtual rooms

Revision ID: 019_ai_virtual_rooms
Revises: 018_exam_proctoring
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '019_ai_virtual_rooms'
down_revision = '018_exam_proctoring'
branch_labels = None
depends_on = None


def upgrade():
    # Create AI Virtual Rooms table
    op.create_table(
        'ai_virtual_rooms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('room_type', sa.String(), nullable=False),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('topic', sa.String(), nullable=True),
        sa.Column('ai_teacher_persona', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('max_participants', sa.Integer(), nullable=True, default=6),
        sa.Column('room_code', sa.String(), nullable=False),
        sa.Column('background_image', sa.String(), nullable=True),
        sa.Column('enable_pronunciation_scoring', sa.Boolean(), nullable=True, default=True),
        sa.Column('enable_grammar_correction', sa.Boolean(), nullable=True, default=True),
        sa.Column('enable_vocabulary_hints', sa.Boolean(), nullable=True, default=True),
        sa.Column('session_duration', sa.Integer(), nullable=True, default=30),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_virtual_rooms_id'), 'ai_virtual_rooms', ['id'], unique=False)
    op.create_index(op.f('ix_ai_virtual_rooms_room_code'), 'ai_virtual_rooms', ['room_code'], unique=True)

    # Create AI Room Participants table
    op.create_table(
        'ai_room_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('nickname', sa.String(), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('left_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_online', sa.Boolean(), nullable=True, default=True),
        sa.Column('is_speaking', sa.Boolean(), nullable=True, default=False),
        sa.Column('is_audio_on', sa.Boolean(), nullable=True, default=False),
        sa.Column('total_speaking_time', sa.Integer(), nullable=True, default=0),
        sa.Column('pronunciation_score', sa.Float(), nullable=True),
        sa.Column('grammar_score', sa.Float(), nullable=True),
        sa.Column('fluency_score', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['room_id'], ['ai_virtual_rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_room_participants_id'), 'ai_room_participants', ['id'], unique=False)

    # Create AI Room Messages table
    op.create_table(
        'ai_room_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=True),
        sa.Column('sender_type', sa.String(), nullable=True, default='user'),
        sa.Column('message_type', sa.String(), nullable=True, default='text'),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('voice_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('transcription', sa.Text(), nullable=True),
        sa.Column('pronunciation_score', sa.Float(), nullable=True),
        sa.Column('grammar_issues', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('suggestions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['room_id'], ['ai_virtual_rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_room_messages_id'), 'ai_room_messages', ['id'], unique=False)

    # Create AI Room Sessions table
    op.create_table(
        'ai_room_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('room_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True, default=0),
        sa.Column('messages_sent', sa.Integer(), nullable=True, default=0),
        sa.Column('words_spoken', sa.Integer(), nullable=True, default=0),
        sa.Column('avg_pronunciation_score', sa.Float(), nullable=True),
        sa.Column('avg_grammar_score', sa.Float(), nullable=True),
        sa.Column('avg_fluency_score', sa.Float(), nullable=True),
        sa.Column('session_summary', sa.Text(), nullable=True),
        sa.Column('strengths', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('areas_to_improve', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('recommended_topics', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['room_id'], ['ai_virtual_rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_room_sessions_id'), 'ai_room_sessions', ['id'], unique=False)

    # Create Conversation Topics table
    op.create_table(
        'conversation_topics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=True),
        sa.Column('keywords', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('sample_questions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_conversation_topics_id'), 'conversation_topics', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_conversation_topics_id'), table_name='conversation_topics')
    op.drop_table('conversation_topics')
    
    op.drop_index(op.f('ix_ai_room_sessions_id'), table_name='ai_room_sessions')
    op.drop_table('ai_room_sessions')
    
    op.drop_index(op.f('ix_ai_room_messages_id'), table_name='ai_room_messages')
    op.drop_table('ai_room_messages')
    
    op.drop_index(op.f('ix_ai_room_participants_id'), table_name='ai_room_participants')
    op.drop_table('ai_room_participants')
    
    op.drop_index(op.f('ix_ai_virtual_rooms_room_code'), table_name='ai_virtual_rooms')
    op.drop_index(op.f('ix_ai_virtual_rooms_id'), table_name='ai_virtual_rooms')
    op.drop_table('ai_virtual_rooms')


