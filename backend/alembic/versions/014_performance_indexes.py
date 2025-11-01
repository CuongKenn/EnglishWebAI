"""Performance indexes for commonly queried columns

Revision ID: 014_performance_indexes
Revises: 013_grading_queue
Create Date: 2025-11-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '014_performance_indexes'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    """Add performance indexes for frequently queried columns"""
    
    # Submissions table indexes
    op.create_index('idx_submissions_student_id', 'submissions', ['student_id'], unique=False)
    op.create_index('idx_submissions_exercise_id', 'submissions', ['exercise_id'], unique=False)
    op.create_index('idx_submissions_status', 'submissions', ['status'], unique=False)
    op.create_index('idx_submissions_submitted_at', 'submissions', [sa.text('submitted_at DESC')], unique=False)
    op.create_index('idx_submissions_grading_status', 'submissions', ['grading_status'], unique=False)
    op.create_index('idx_submissions_student_exercise', 'submissions', ['student_id', 'exercise_id'], unique=False)
    
    # Exercises table indexes
    op.create_index('idx_exercises_class_id', 'exercises', ['class_id'], unique=False)
    op.create_index('idx_exercises_created_by', 'exercises', ['created_by'], unique=False)
    op.create_index('idx_exercises_due_at', 'exercises', ['due_at'], unique=False)
    op.create_index('idx_exercises_created_at', 'exercises', [sa.text('created_at DESC')], unique=False)
    op.create_index('idx_exercises_skill_type', 'exercises', ['skill_type'], unique=False)
    
    # Enrollments table indexes
    op.create_index('idx_enrollments_user_id', 'enrollments', ['user_id'], unique=False)
    op.create_index('idx_enrollments_class_id', 'enrollments', ['class_id'], unique=False)
    op.create_index('idx_enrollments_status', 'enrollments', ['status'], unique=False)
    op.create_index('idx_enrollments_role', 'enrollments', ['role'], unique=False)
    op.create_index('idx_enrollments_user_class', 'enrollments', ['user_id', 'class_id'], unique=False)
    
    # Classes table indexes
    op.create_index('idx_classes_teacher_id', 'classes', ['teacher_id'], unique=False)
    op.create_index('idx_classes_is_active', 'classes', ['is_active'], unique=False)
    
    # Notifications table indexes (if not already exists)
    try:
        op.create_index('idx_notifications_user_id', 'notifications', ['user_id'], unique=False)
        op.create_index('idx_notifications_is_read', 'notifications', ['is_read'], unique=False)
        op.create_index('idx_notifications_created_at', 'notifications', [sa.text('created_at DESC')], unique=False)
        op.create_index('idx_notifications_type', 'notifications', ['type'], unique=False)
    except:
        pass  # Indexes might already exist
    
    # Messages table indexes
    try:
        op.create_index('idx_messages_sender_id', 'messages', ['sender_id'], unique=False)
        op.create_index('idx_messages_receiver_id', 'messages', ['receiver_id'], unique=False)
        op.create_index('idx_messages_created_at', 'messages', [sa.text('created_at DESC')], unique=False)
        op.create_index('idx_messages_is_read', 'messages', ['is_read'], unique=False)
    except:
        pass


def downgrade():
    """Remove performance indexes"""
    
    # Drop submissions indexes
    op.drop_index('idx_submissions_student_id', table_name='submissions')
    op.drop_index('idx_submissions_exercise_id', table_name='submissions')
    op.drop_index('idx_submissions_status', table_name='submissions')
    op.drop_index('idx_submissions_submitted_at', table_name='submissions')
    op.drop_index('idx_submissions_grading_status', table_name='submissions')
    op.drop_index('idx_submissions_student_exercise', table_name='submissions')
    
    # Drop exercises indexes
    op.drop_index('idx_exercises_class_id', table_name='exercises')
    op.drop_index('idx_exercises_created_by', table_name='exercises')
    op.drop_index('idx_exercises_due_at', table_name='exercises')
    op.drop_index('idx_exercises_created_at', table_name='exercises')
    op.drop_index('idx_exercises_skill_type', table_name='exercises')
    
    # Drop enrollments indexes
    op.drop_index('idx_enrollments_user_id', table_name='enrollments')
    op.drop_index('idx_enrollments_class_id', table_name='enrollments')
    op.drop_index('idx_enrollments_status', table_name='enrollments')
    op.drop_index('idx_enrollments_role', table_name='enrollments')
    op.drop_index('idx_enrollments_user_class', table_name='enrollments')
    
    # Drop classes indexes
    op.drop_index('idx_classes_teacher_id', table_name='classes')
    op.drop_index('idx_classes_is_active', table_name='classes')
    
    # Drop notifications indexes
    try:
        op.drop_index('idx_notifications_user_id', table_name='notifications')
        op.drop_index('idx_notifications_is_read', table_name='notifications')
        op.drop_index('idx_notifications_created_at', table_name='notifications')
        op.drop_index('idx_notifications_type', table_name='notifications')
    except:
        pass
    
    # Drop messages indexes
    try:
        op.drop_index('idx_messages_sender_id', table_name='messages')
        op.drop_index('idx_messages_receiver_id', table_name='messages')
        op.drop_index('idx_messages_created_at', table_name='messages')
        op.drop_index('idx_messages_is_read', table_name='messages')
    except:
        pass
