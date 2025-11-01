"""
Notification Service - Tự động tạo thông báo cho parent
"""
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User
from app.models.parent_student import ParentStudent
from app.models.submission import Submission
from app.models.exam_assessment import ExamSubmission, ExamAssessment
from app.models.exercise import Exercise
from app.models.classroom import Classroom
from typing import Optional, List, Union
from datetime import datetime


class NotificationService:
    """Service để tạo và quản lý thông báo tự động"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        related_id: Optional[int] = None,
        related_type: Optional[str] = None
    ):
        """
        Tạo một thông báo mới
        
        Args:
            user_id: ID người nhận thông báo
            title: Tiêu đề thông báo
            message: Nội dung thông báo
            notification_type: Loại (grade, info, success, warning, alert)
            related_id: ID liên quan (submission_id, exercise_id, etc.)
            related_type: Loại liên quan (submission, exercise, etc.)
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            related_id=related_id,
            related_type=related_type,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification
    
    @staticmethod
    def notify_parents_on_grading(
        db: Session,
        submission: Submission,
        teacher_name: str
    ):
        """
        Thông báo cho phụ huynh khi giáo viên chấm bài
        
        Args:
            submission: Submission đã được chấm
            teacher_name: Tên giáo viên
        """
        # Lấy thông tin bài tập
        exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
        if not exercise:
            return
        
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == submission.student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student.id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            title = "Điểm bài kiểm tra mới"
            
            # Format điểm
            score_text = f"{submission.score}/10" if submission.score else "chưa có điểm"
            
            message = (
                f"Con bạn {student.full_name or student.username} đã nhận điểm "
                f"{score_text} cho bài tập \"{exercise.title}\""
            )
            
            if submission.feedback:
                message += f". Nhận xét: {submission.feedback[:100]}"
                if len(submission.feedback) > 100:
                    message += "..."
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="grade",
                related_id=submission.id,
                related_type="submission"
            )
    
    @staticmethod
    def notify_parents_on_submission(
        db: Session,
        submission: Submission
    ):
        """
        Thông báo cho phụ huynh khi học sinh nộp bài
        
        Args:
            submission: Submission vừa được nộp
        """
        # Lấy thông tin bài tập
        exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
        if not exercise:
            return
        
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == submission.student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student.id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            title = "Hoàn thành bài tập"
            message = (
                f"Con bạn {student.full_name or student.username} đã hoàn thành "
                f"bài tập \"{exercise.title}\". Đang chờ giáo viên chấm điểm."
            )
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="success",
                related_id=submission.id,
                related_type="submission"
            )
    
    @staticmethod
    def notify_parents_on_exercise_due(
        db: Session,
        student_id: int,
        exercise: Exercise
    ):
        """
        Thông báo cho phụ huynh khi bài tập sắp hết hạn
        
        Args:
            student_id: ID học sinh
            exercise: Bài tập sắp hết hạn
        """
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student_id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            title = "Bài tập sắp hết hạn"
            
            due_date = exercise.due_date.strftime("%d/%m/%Y %H:%M") if exercise.due_date else "sớm"
            
            message = (
                f"Bài tập \"{exercise.title}\" của con bạn "
                f"{student.full_name or student.username} sẽ hết hạn vào {due_date}. "
                f"Nhắc nhở con hoàn thành bài tập."
            )
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="alert",
                related_id=exercise.id,
                related_type="exercise"
            )
    
    @staticmethod
    def notify_parents_on_teacher_announcement(
        db: Session,
        class_id: int,
        title: str,
        message: str,
        teacher_name: str
    ):
        """
        Thông báo cho phụ huynh khi giáo viên gửi thông báo cho lớp
        
        Args:
            class_id: ID lớp học
            title: Tiêu đề thông báo
            message: Nội dung thông báo
            teacher_name: Tên giáo viên
        """
        # Lấy danh sách học sinh trong lớp
        from app.models.enrollment import Enrollment
        enrollments = db.query(Enrollment).filter(
            Enrollment.class_id == class_id,
            Enrollment.status == "active"
        ).all()
        
        # Lấy danh sách phụ huynh của các học sinh
        parent_ids_notified = set()
        
        for enrollment in enrollments:
            parent_links = db.query(ParentStudent).filter(
                ParentStudent.student_id == enrollment.user_id,
                ParentStudent.is_verified == True
            ).all()
            
            for link in parent_links:
                if link.parent_id not in parent_ids_notified:
                    student = db.query(User).filter(User.id == enrollment.user_id).first()
                    
                    full_message = f"Thông báo từ {teacher_name}: {message}"
                    if student:
                        full_message += f" (Con: {student.full_name or student.username})"
                    
                    NotificationService.create_notification(
                        db=db,
                        user_id=link.parent_id,
                        title=title,
                        message=full_message,
                        notification_type="info",
                        related_id=class_id,
                        related_type="class"
                    )
                    
                    parent_ids_notified.add(link.parent_id)
    
    @staticmethod
    def notify_parents_on_low_score(
        db: Session,
        submission: Submission,
        threshold: float = 5.0
    ):
        """
        Thông báo cho phụ huynh khi học sinh có điểm thấp
        
        Args:
            submission: Submission với điểm thấp
            threshold: Ngưỡng điểm (mặc định 5.0)
        """
        if not submission.score or submission.score >= threshold:
            return
        
        # Lấy thông tin bài tập
        exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
        if not exercise:
            return
        
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == submission.student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student.id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            title = "Cần chú ý - Điểm số thấp"
            message = (
                f"Con bạn {student.full_name or student.username} đã nhận điểm "
                f"{submission.score}/10 cho bài tập \"{exercise.title}\". "
                f"Phụ huynh nên quan tâm và hỗ trợ con học tập tốt hơn."
            )
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="warning",
                related_id=submission.id,
                related_type="submission"
            )
    
    @staticmethod
    def get_parent_notifications(
        db: Session,
        parent_id: int,
        skip: int = 0,
        limit: int = 50,
        unread_only: bool = False,
        notification_type: Optional[str] = None
    ) -> List[Notification]:
        """
        Lấy danh sách thông báo của phụ huynh
        
        Args:
            parent_id: ID phụ huynh
            skip: Số bản ghi bỏ qua
            limit: Số bản ghi tối đa
            unread_only: Chỉ lấy thông báo chưa đọc
            notification_type: Loại thông báo (grade, info, success, warning, alert)
        
        Returns:
            List[Notification]: Danh sách thông báo
        """
        query = db.query(Notification).filter(Notification.user_id == parent_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        if notification_type:
            query = query.filter(Notification.type == notification_type)
        
        notifications = query.order_by(
            Notification.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return notifications
    
    # ============= Exam Assessment Notifications =============
    
    @staticmethod
    def notify_parents_on_exam_grading(
        db: Session,
        submission: ExamSubmission,
        teacher_name: str
    ):
        """
        Thông báo cho phụ huynh khi giáo viên chấm bài thi
        
        Args:
            submission: ExamSubmission đã được chấm
            teacher_name: Tên giáo viên
        """
        # Lấy thông tin đề thi
        exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
        if not exam:
            return
        
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == submission.student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student.id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            # Determine exam type display name
            exam_type_name = {
                'midterm': 'giữa kỳ',
                'final': 'cuối kỳ',
                'quiz': 'kiểm tra',
                'practice': 'luyện tập'
            }.get(exam.exam_type, 'bài thi')
            
            title = f"Điểm {exam_type_name} mới"
            
            # Format điểm
            score_text = f"{submission.score}/{exam.total_points}" if submission.score else "chưa có điểm"
            
            message = (
                f"Con bạn {student.full_name or student.username} đã nhận điểm "
                f"{score_text} cho {exam_type_name} \"{exam.title}\""
            )
            
            if submission.feedback:
                message += f". Nhận xét: {submission.feedback[:100]}"
                if len(submission.feedback) > 100:
                    message += "..."
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="grade",
                related_id=submission.id,
                related_type="exam_submission"
            )
    
    @staticmethod
    def notify_parents_on_exam_submission(
        db: Session,
        submission: ExamSubmission
    ):
        """
        Thông báo cho phụ huynh khi học sinh nộp bài thi
        
        Args:
            submission: ExamSubmission vừa được nộp
        """
        # Lấy thông tin đề thi
        exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
        if not exam:
            return
        
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == submission.student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student.id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            exam_type_name = {
                'midterm': 'giữa kỳ',
                'final': 'cuối kỳ',
                'quiz': 'kiểm tra',
                'practice': 'luyện tập'
            }.get(exam.exam_type, 'bài thi')
            
            title = f"Hoàn thành {exam_type_name}"
            message = (
                f"Con bạn {student.full_name or student.username} đã hoàn thành "
                f"{exam_type_name} \"{exam.title}\". Đang chờ giáo viên chấm điểm."
            )
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="success",
                related_id=submission.id,
                related_type="exam_submission"
            )
    
    @staticmethod
    def notify_parents_on_exam_low_score(
        db: Session,
        submission: ExamSubmission,
        threshold: float = 5.0
    ):
        """
        Thông báo cho phụ huynh khi học sinh có điểm thi thấp
        
        Args:
            submission: ExamSubmission với điểm thấp
            threshold: Ngưỡng điểm (mặc định 5.0)
        """
        if not submission.score or submission.score >= threshold:
            return
        
        # Lấy thông tin đề thi
        exam = db.query(ExamAssessment).filter(ExamAssessment.id == submission.exam_id).first()
        if not exam:
            return
        
        # Lấy thông tin học sinh
        student = db.query(User).filter(User.id == submission.student_id).first()
        if not student:
            return
        
        # Lấy danh sách phụ huynh của học sinh
        parent_links = db.query(ParentStudent).filter(
            ParentStudent.student_id == student.id,
            ParentStudent.is_verified == True
        ).all()
        
        # Tạo thông báo cho từng phụ huynh
        for link in parent_links:
            exam_type_name = {
                'midterm': 'giữa kỳ',
                'final': 'cuối kỳ',
                'quiz': 'kiểm tra',
                'practice': 'luyện tập'
            }.get(exam.exam_type, 'bài thi')
            
            title = f"Cần chú ý - Điểm {exam_type_name} thấp"
            message = (
                f"Con bạn {student.full_name or student.username} đã nhận điểm "
                f"{submission.score}/{exam.total_points} cho {exam_type_name} \"{exam.title}\". "
                f"Phụ huynh nên quan tâm và hỗ trợ con học tập tốt hơn."
            )
            
            NotificationService.create_notification(
                db=db,
                user_id=link.parent_id,
                title=title,
                message=message,
                notification_type="warning",
                related_id=submission.id,
                related_type="exam_submission"
            )

