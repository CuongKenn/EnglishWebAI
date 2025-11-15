"""
Exam Proctoring Service
Manages monitoring sessions, identity verification, and behavior analysis
"""

import json
import logging
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.exam_proctoring import ExamMonitoringSession, ExamProctoringLog
from app.models.student_face_data import StudentFaceData
from app.services.face_recognition_service import get_face_recognition_service
from app.services.gaze_tracking_service import get_gaze_tracking_service

logger = logging.getLogger(__name__)


class ExamProctoringService:
    """Service for managing exam proctoring and monitoring"""

    # Configuration
    IDENTITY_CHECK_INTERVAL_MIN = 5  # Minutes
    IDENTITY_CHECK_INTERVAL_MAX = 10  # Minutes
    FACE_SIMILARITY_THRESHOLD = 0.6  # 60% similarity
    MAX_WARNINGS = 3
    MAX_CRITICAL_VIOLATIONS = 2

    def __init__(self):
        self.face_service = get_face_recognition_service()
        self.gaze_service = get_gaze_tracking_service()

    def create_monitoring_session(
        self,
        db: Session,
        submission_id: int,
        student_id: int,
        exam_id: int
    ) -> tuple[bool, ExamMonitoringSession | None, str | None]:
        """
        Create a new monitoring session for an exam
        Returns (success, session, error_message)
        """
        try:
            # Check if session already exists
            existing = db.query(ExamMonitoringSession).filter(
                ExamMonitoringSession.submission_id == submission_id,
                ExamMonitoringSession.is_active
            ).first()

            if existing:
                return True, existing, None

            # Generate session token
            session_token = secrets.token_urlsafe(32)

            # Create new session
            session = ExamMonitoringSession(
                submission_id=submission_id,
                student_id=student_id,
                exam_id=exam_id,
                session_token=session_token,
                is_active=True,
                warning_count=0,
                critical_count=0,
                last_identity_check=None,
                auto_submitted=False
            )

            db.add(session)
            db.commit()
            db.refresh(session)

            # Log session start
            self._log_event(
                db=db,
                submission_id=submission_id,
                session_token=session_token,
                event_type='session_started',
                severity='info',
                message='Monitoring session started'
            )

            logger.info(f"Created monitoring session for submission {submission_id}")
            return True, session, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error creating monitoring session: {str(e)}")
            return False, None, str(e)

    def verify_identity(
        self,
        db: Session,
        session_token: str,
        base64_image: str
    ) -> tuple[bool, dict]:
        """
        Verify student identity against enrolled face
        Returns (success, result_dict)
        """
        try:
            # Get session
            session = db.query(ExamMonitoringSession).filter(
                ExamMonitoringSession.session_token == session_token,
                ExamMonitoringSession.is_active
            ).first()

            if not session:
                return False, {'error': 'Invalid or inactive session'}

            # Get enrolled face data
            face_data = db.query(StudentFaceData).filter(
                StudentFaceData.student_id == session.student_id,
                StudentFaceData.is_active
            ).first()

            if not face_data or not face_data.face_embedding:
                return False, {'error': 'No enrolled face data found'}

            # Parse stored embedding
            try:
                stored_embedding = json.loads(face_data.face_embedding)
            except Exception:
                return False, {'error': 'Invalid face embedding format'}

            # Verify face
            result = self.face_service.verify_face(
                base64_image=base64_image,
                stored_embedding=stored_embedding,
                threshold=self.FACE_SIMILARITY_THRESHOLD
            )

            if not result['success']:
                # Log critical event
                self._log_event(
                    db=db,
                    submission_id=session.submission_id,
                    session_token=session_token,
                    event_type='identity_failed',
                    severity='critical',
                    message=result.get('error', 'Identity verification failed'),
                    confidence_score=0.0
                )

                # Increment critical count
                session.critical_count += 1
                session.last_identity_check = datetime.utcnow()
                db.commit()

                # Check if auto-submit needed
                if session.critical_count >= self.MAX_CRITICAL_VIOLATIONS:
                    self._trigger_auto_submit(
                        db=db,
                        session=session,
                        reason='Multiple identity verification failures'
                    )
                    return False, {
                        'verified': False,
                        'auto_submit': True,
                        'reason': 'Multiple identity verification failures'
                    }

                return False, {
                    'verified': False,
                    'error': result.get('error'),
                    'critical_count': session.critical_count
                }

            verified = result.get('verified', False)
            similarity = result.get('similarity', 0.0)

            if verified:
                # Log successful verification
                self._log_event(
                    db=db,
                    submission_id=session.submission_id,
                    session_token=session_token,
                    event_type='identity_verified',
                    severity='info',
                    message=f'Identity verified successfully (confidence: {result.get("confidence")})',
                    confidence_score=similarity
                )

                session.last_identity_check = datetime.utcnow()
                db.commit()

                return True, {
                    'verified': True,
                    'confidence': result.get('confidence'),
                    'similarity': similarity
                }
            # Log failed verification
            self._log_event(
                db=db,
                submission_id=session.submission_id,
                session_token=session_token,
                event_type='identity_failed',
                severity='critical',
                message=f'Identity verification failed (similarity: {result.get("confidence")})',
                confidence_score=similarity
            )

            session.critical_count += 1
            session.last_identity_check = datetime.utcnow()
            db.commit()

            # Check if auto-submit needed
            if session.critical_count >= self.MAX_CRITICAL_VIOLATIONS:
                self._trigger_auto_submit(
                    db=db,
                    session=session,
                    reason='Multiple identity verification failures'
                )
                return False, {
                    'verified': False,
                    'auto_submit': True,
                    'reason': 'Multiple identity verification failures'
                }

            return False, {
                'verified': False,
                'similarity': similarity,
                'confidence': result.get('confidence'),
                'critical_count': session.critical_count
            }

        except Exception as e:
            logger.error(f"Error verifying identity: {str(e)}")
            return False, {'error': str(e)}

    def monitor_behavior(
        self,
        db: Session,
        session_token: str,
        base64_image: str
    ) -> tuple[bool, dict]:
        """
        Monitor student behavior using gaze and head pose tracking
        Returns (success, result_dict)
        """
        try:
            # Get session
            session = db.query(ExamMonitoringSession).filter(
                ExamMonitoringSession.session_token == session_token,
                ExamMonitoringSession.is_active
            ).first()

            if not session:
                return False, {'error': 'Invalid or inactive session'}

            # Analyze frame
            analysis = self.gaze_service.analyze_frame(base64_image)

            if not analysis['success']:
                # Log error
                self._log_event(
                    db=db,
                    submission_id=session.submission_id,
                    session_token=session_token,
                    event_type='monitoring_error',
                    severity='warning',
                    message=analysis.get('message', 'Failed to analyze frame')
                )
                return False, analysis

            # Check for violations
            if not analysis['face_detected']:
                self._log_event(
                    db=db,
                    submission_id=session.submission_id,
                    session_token=session_token,
                    event_type='no_face_detected',
                    severity='critical',
                    message='No face detected in frame'
                )
                session.critical_count += 1
                db.commit()

                # Check auto-submit
                if self._check_auto_submit(session):
                    self._trigger_auto_submit(
                        db=db,
                        session=session,
                        reason='Excessive suspicious behavior detected'
                    )
                    return True, {
                        **analysis,
                        'auto_submit': True,
                        'reason': 'Excessive suspicious behavior'
                    }

                return True, analysis

            # Check for multiple faces
            if analysis.get('num_faces', 0) > 1:
                self._log_event(
                    db=db,
                    submission_id=session.submission_id,
                    session_token=session_token,
                    event_type='multiple_faces',
                    severity='critical',
                    message=f'Multiple faces detected ({analysis["num_faces"]})',
                    metadata=json.dumps(analysis)
                )
                session.critical_count += 1
                db.commit()

                # Check auto-submit
                if self._check_auto_submit(session):
                    self._trigger_auto_submit(
                        db=db,
                        session=session,
                        reason='Multiple people detected'
                    )
                    return True, {
                        **analysis,
                        'auto_submit': True,
                        'reason': 'Multiple people detected'
                    }

                return True, analysis

            # Check for violations
            violations = analysis.get('violations', [])
            if violations:
                # Log each violation
                for violation in violations:
                    self._log_event(
                        db=db,
                        submission_id=session.submission_id,
                        session_token=session_token,
                        event_type=violation,
                        severity='warning',
                        message=f'Behavior violation: {violation}',
                        metadata=json.dumps({
                            'head_pose': analysis.get('head_pose'),
                            'gaze_direction': analysis.get('gaze_direction')
                        })
                    )

                session.warning_count += 1
                db.commit()

                # Check auto-submit
                if self._check_auto_submit(session):
                    self._trigger_auto_submit(
                        db=db,
                        session=session,
                        reason='Excessive suspicious behavior detected'
                    )
                    return True, {
                        **analysis,
                        'auto_submit': True,
                        'reason': 'Excessive suspicious behavior'
                    }

            return True, analysis

        except Exception as e:
            logger.error(f"Error monitoring behavior: {str(e)}")
            return False, {'error': str(e)}

    def end_monitoring_session(
        self,
        db: Session,
        session_token: str
    ) -> tuple[bool, str | None]:
        """
        End a monitoring session
        Returns (success, error_message)
        """
        try:
            session = db.query(ExamMonitoringSession).filter(
                ExamMonitoringSession.session_token == session_token
            ).first()

            if not session:
                return False, 'Session not found'

            session.is_active = False
            session.ended_at = datetime.utcnow()
            db.commit()

            # Log session end
            self._log_event(
                db=db,
                submission_id=session.submission_id,
                session_token=session_token,
                event_type='session_ended',
                severity='info',
                message=f'Monitoring session ended (warnings: {session.warning_count}, critical: {session.critical_count})'
            )

            logger.info(f"Ended monitoring session {session_token}")
            return True, None

        except Exception as e:
            db.rollback()
            logger.error(f"Error ending monitoring session: {str(e)}")
            return False, str(e)

    def get_session_status(
        self,
        db: Session,
        session_token: str
    ) -> dict | None:
        """Get current session status"""
        try:
            session = db.query(ExamMonitoringSession).filter(
                ExamMonitoringSession.session_token == session_token
            ).first()

            if not session:
                return None

            # Check if identity check is needed
            needs_identity_check = False
            if session.last_identity_check:
                time_since_check = datetime.utcnow() - session.last_identity_check
                needs_identity_check = time_since_check > timedelta(minutes=self.IDENTITY_CHECK_INTERVAL_MIN)
            else:
                needs_identity_check = True

            return {
                'session_id': session.id,
                'submission_id': session.submission_id,
                'is_active': session.is_active,
                'warning_count': session.warning_count,
                'critical_count': session.critical_count,
                'auto_submitted': session.auto_submitted,
                'auto_submit_reason': session.auto_submit_reason,
                'needs_identity_check': needs_identity_check,
                'last_identity_check': session.last_identity_check.isoformat() if session.last_identity_check else None,
                'started_at': session.started_at.isoformat() if session.started_at else None
            }

        except Exception as e:
            logger.error(f"Error getting session status: {str(e)}")
            return None

    def get_proctoring_logs(
        self,
        db: Session,
        submission_id: int,
        severity: str | None = None
    ) -> list[ExamProctoringLog]:
        """Get all proctoring logs for a submission"""
        try:
            query = db.query(ExamProctoringLog).filter(
                ExamProctoringLog.submission_id == submission_id
            )

            if severity:
                query = query.filter(ExamProctoringLog.severity == severity)

            return query.order_by(ExamProctoringLog.timestamp.asc()).all()

        except Exception as e:
            logger.error(f"Error getting proctoring logs: {str(e)}")
            return []

    def _log_event(
        self,
        db: Session,
        submission_id: int,
        session_token: str,
        event_type: str,
        severity: str,
        message: str,
        confidence_score: float | None = None,
        metadata: str | None = None
    ):
        """Log a proctoring event"""
        try:
            log = ExamProctoringLog(
                submission_id=submission_id,
                session_token=session_token,
                event_type=event_type,
                severity=severity,
                message=message,
                confidence_score=confidence_score,
                metadata=metadata
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Error logging event: {str(e)}")
            db.rollback()

    def _check_auto_submit(self, session: ExamMonitoringSession) -> bool:
        """Check if auto-submit conditions are met"""
        total_violations = session.warning_count + session.critical_count
        return (
            session.critical_count >= self.MAX_CRITICAL_VIOLATIONS or
            total_violations >= (self.MAX_WARNINGS + self.MAX_CRITICAL_VIOLATIONS)
        )

    def _trigger_auto_submit(
        self,
        db: Session,
        session: ExamMonitoringSession,
        reason: str
    ):
        """Trigger automatic exam submission"""
        try:
            session.auto_submitted = True
            session.auto_submit_reason = reason
            session.is_active = False
            session.ended_at = datetime.utcnow()
            db.commit()

            # Log auto-submit
            self._log_event(
                db=db,
                submission_id=session.submission_id,
                session_token=session.session_token,
                event_type='auto_submitted',
                severity='critical',
                message=f'Exam auto-submitted: {reason}'
            )

            logger.warning(f"Auto-submitted exam for session {session.session_token}: {reason}")

        except Exception as e:
            logger.error(f"Error triggering auto-submit: {str(e)}")
            db.rollback()


# Singleton instance
_proctoring_service = None


def get_exam_proctoring_service() -> ExamProctoringService:
    """Get or create the singleton ExamProctoringService instance"""
    global _proctoring_service
    if _proctoring_service is None:
        _proctoring_service = ExamProctoringService()
    return _proctoring_service
