"""
Quiz API Router - Solo Learning Mode
Supports grammar, vocabulary, and listening quizzes with scoring and leaderboard
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.quiz import QuizRoom, QuizQuestion, QuizSession, QuizAnswer
from app.models.user import User
from app.schemas.quiz import (
    QuizRoomCreate,
    QuizRoomResponse,
    QuizRoomDetail,
    QuizQuestionCreate,
    QuizQuestionResponse,
    QuizSessionStart,
    QuizSessionResponse,
    QuizAnswerSubmit,
    QuizAnswerResponse,
    QuizLeaderboardEntry,
)
from app.services.ai_grading_service import normalize_answer, fuzzy_match

router = APIRouter()


@router.post("/rooms", response_model=QuizRoomResponse, status_code=status.HTTP_201_CREATED)
def create_quiz_room(
    room_data: QuizRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new quiz room (teachers/admins)"""
    quiz_room = QuizRoom(
        **room_data.model_dump(),
        created_by=current_user.id
    )
    db.add(quiz_room)
    db.commit()
    db.refresh(quiz_room)
    return quiz_room


@router.get("/rooms", response_model=List[QuizRoomResponse])
def get_quiz_rooms(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all quiz rooms with filters"""
    query = db.query(QuizRoom).filter(QuizRoom.is_active == is_active)
    
    if topic:
        query = query.filter(QuizRoom.topic == topic)
    if difficulty:
        query = query.filter(QuizRoom.difficulty == difficulty)
    
    rooms = query.order_by(desc(QuizRoom.created_at)).all()
    return rooms


@router.get("/rooms/{room_id}", response_model=QuizRoomDetail)
def get_quiz_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quiz room details with questions"""
    room = db.query(QuizRoom).filter(QuizRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Quiz room not found")
    
    # Count participants
    participant_count = db.query(QuizSession).filter(
        QuizSession.room_id == room_id
    ).distinct(QuizSession.student_id).count()
    
    # Get questions
    questions = db.query(QuizQuestion).filter(
        QuizQuestion.room_id == room_id
    ).order_by(QuizQuestion.order).all()
    
    return {
        **room.__dict__,
        "questions": questions,
        "total_participants": participant_count
    }


@router.post("/rooms/{room_id}/questions", response_model=QuizQuestionResponse, status_code=status.HTTP_201_CREATED)
def add_quiz_question(
    room_id: int,
    question_data: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a question to quiz room (teachers/admins)"""
    room = db.query(QuizRoom).filter(QuizRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Quiz room not found")
    
    question = QuizQuestion(
        **question_data.model_dump(),
        room_id=room_id
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.post("/sessions/start", response_model=QuizSessionResponse, status_code=status.HTTP_201_CREATED)
def start_quiz_session(
    session_data: QuizSessionStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a new quiz session for student"""
    room = db.query(QuizRoom).filter(QuizRoom.id == session_data.room_id).first()
    if not room or not room.is_active:
        raise HTTPException(status_code=404, detail="Quiz room not found or inactive")
    
    # Check if student already has an active session
    existing = db.query(QuizSession).filter(
        QuizSession.room_id == session_data.room_id,
        QuizSession.student_id == current_user.id,
        QuizSession.completed_at.is_(None)
    ).first()
    
    if existing:
        return existing
    
    # Get total questions
    total_q = db.query(QuizQuestion).filter(QuizQuestion.room_id == session_data.room_id).count()
    
    session = QuizSession(
        room_id=session_data.room_id,
        student_id=current_user.id,
        total_questions=total_q
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/answer", response_model=QuizAnswerResponse)
def submit_quiz_answer(
    session_id: int,
    answer_data: QuizAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer to a quiz question"""
    session = db.query(QuizSession).filter(
        QuizSession.id == session_id,
        QuizSession.student_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz session already completed")
    
    # Get question
    question = db.query(QuizQuestion).filter(QuizQuestion.id == answer_data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if already answered
    existing_answer = db.query(QuizAnswer).filter(
        QuizAnswer.session_id == session_id,
        QuizAnswer.question_id == answer_data.question_id
    ).first()
    
    if existing_answer:
        raise HTTPException(status_code=400, detail="Question already answered")
    
    # Grade the answer
    student_ans = normalize_answer(answer_data.student_answer)
    correct_ans = normalize_answer(question.correct_answer)
    
    is_correct = False
    points_earned = 0.0
    
    if question.question_type == "fill_blank":
        # Use fuzzy matching for fill_blank
        is_correct = fuzzy_match(student_ans, correct_ans, threshold=90)
    else:
        # Exact match for multiple choice
        is_correct = student_ans == correct_ans
    
    if is_correct:
        points_earned = float(question.points)
    
    # Save answer
    answer = QuizAnswer(
        session_id=session_id,
        question_id=answer_data.question_id,
        student_answer=answer_data.student_answer,
        is_correct=is_correct,
        points_earned=points_earned,
        time_taken=answer_data.time_taken
    )
    db.add(answer)
    
    # Update session stats
    session.time_taken += answer_data.time_taken
    if is_correct:
        session.correct_answers += 1
        session.total_score += points_earned
    
    db.commit()
    db.refresh(answer)
    
    return answer


@router.post("/sessions/{session_id}/complete", response_model=QuizSessionResponse)
def complete_quiz_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Complete a quiz session"""
    session = db.query(QuizSession).filter(
        QuizSession.id == session_id,
        QuizSession.student_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    if session.completed_at:
        raise HTTPException(status_code=400, detail="Quiz session already completed")
    
    session.completed_at = func.now()
    db.commit()
    db.refresh(session)
    
    return session


@router.get("/rooms/{room_id}/leaderboard", response_model=List[QuizLeaderboardEntry])
def get_quiz_leaderboard(
    room_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get leaderboard for a quiz room"""
    sessions = db.query(QuizSession, User).join(
        User, QuizSession.student_id == User.id
    ).filter(
        QuizSession.room_id == room_id,
        QuizSession.completed_at.isnot(None)
    ).order_by(
        desc(QuizSession.total_score),
        QuizSession.time_taken
    ).limit(limit).all()
    
    leaderboard = []
    for rank, (session, user) in enumerate(sessions, start=1):
        leaderboard.append(QuizLeaderboardEntry(
            student_id=user.id,
            student_name=user.username,
            total_score=session.total_score,
            correct_answers=session.correct_answers,
            time_taken=session.time_taken,
            rank=rank
        ))
    
    return leaderboard


@router.get("/sessions/{session_id}/answers", response_model=List[QuizAnswerResponse])
def get_session_answers(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all answers for a session"""
    session = db.query(QuizSession).filter(
        QuizSession.id == session_id,
        QuizSession.student_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    answers = db.query(QuizAnswer).filter(
        QuizAnswer.session_id == session_id
    ).all()
    
    return answers


@router.delete("/rooms/{room_id}")
def delete_quiz_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a quiz room (teachers/admins only)"""
    room = db.query(QuizRoom).filter(QuizRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Quiz room not found")
    
    # Check permissions
    if room.created_by != current_user.id and current_user.role not in ["teacher", "admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    db.delete(room)
    db.commit()
    
    return {"message": "Quiz room deleted successfully"}
