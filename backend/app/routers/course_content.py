"""
API Router for rich course content (Reading, Writing, Listening, Speaking)
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.course_content import (
    ListeningAudio,
    ListeningQuestion,
    ReadingParagraph,
    ReadingPassage,
    ReadingQuestion,
    SpeakingCriteria,
    SpeakingPrompt,
    WritingPrompt,
    WritingRubric,
)
from app.models.user import User, UserRole
from app.schemas.course_content import (
    ListeningAudioCreate,
    ListeningAudioResponse,
    ListeningAudioUpdate,
    ReadingPassageCreate,
    ReadingPassageResponse,
    ReadingPassageUpdate,
    SpeakingPromptCreate,
    SpeakingPromptResponse,
    SpeakingPromptUpdate,
    WritingPromptCreate,
    WritingPromptResponse,
    WritingPromptUpdate,
)

router = APIRouter()


# ============= READING ENDPOINTS =============

@router.post("/units/{unit_id}/reading", response_model=ReadingPassageResponse, status_code=201)
async def create_reading_passage(
    unit_id: int,
    payload: ReadingPassageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create reading passage with paragraphs and questions for a unit"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được tạo nội dung")

    try:
        # Create passage
        passage = ReadingPassage(
            unit_id=unit_id,
            title=payload.title,
            subtitle=payload.subtitle,
            difficulty=payload.difficulty,
            estimated_time=payload.estimated_time,
            total_questions=payload.total_questions
        )
        db.add(passage)
        db.flush()

        # Create paragraphs and questions
        for para_data in payload.paragraphs:
            paragraph = ReadingParagraph(
                passage_id=passage.id,
                paragraph_id=para_data.paragraph_id,
                heading=para_data.heading,
                content=para_data.content,
                order_index=para_data.order_index
            )
            db.add(paragraph)
            db.flush()

            # Create questions for this paragraph
            for q_data in para_data.questions:
                question = ReadingQuestion(
                    paragraph_id=paragraph.id,
                    type=q_data.type,
                    instruction=q_data.instruction,
                    options_json=json.dumps(q_data.options, ensure_ascii=False) if q_data.options else None,
                    correct_answer=q_data.correct_answer,
                    points=q_data.points,
                    order_index=q_data.order_index
                )
                db.add(question)

        db.commit()
        db.refresh(passage)
        return passage
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/reading", response_model=ReadingPassageResponse)
async def get_reading_passage(
    unit_id: int,
    db: Session = Depends(get_db)
):
    """Get reading passage for a unit - public endpoint"""
    passage = db.query(ReadingPassage).filter(ReadingPassage.unit_id == unit_id).first()
    if not passage:
        raise HTTPException(status_code=404, detail="Không tìm thấy reading passage")
    return passage


@router.put("/reading/{passage_id}", response_model=ReadingPassageResponse)
async def update_reading_passage(
    passage_id: int,
    payload: ReadingPassageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update reading passage metadata"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được sửa nội dung")

    passage = db.query(ReadingPassage).filter(ReadingPassage.id == passage_id).first()
    if not passage:
        raise HTTPException(status_code=404, detail="Không tìm thấy reading passage")

    if payload.title is not None:
        passage.title = payload.title
    if payload.subtitle is not None:
        passage.subtitle = payload.subtitle
    if payload.difficulty is not None:
        passage.difficulty = payload.difficulty
    if payload.estimated_time is not None:
        passage.estimated_time = payload.estimated_time

    db.commit()
    db.refresh(passage)
    return passage


@router.delete("/reading/{passage_id}", status_code=204)
async def delete_reading_passage(
    passage_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete reading passage"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được xóa nội dung")

    passage = db.query(ReadingPassage).filter(ReadingPassage.id == passage_id).first()
    if not passage:
        raise HTTPException(status_code=404, detail="Không tìm thấy reading passage")

    db.delete(passage)
    db.commit()
    return


# ============= WRITING ENDPOINTS =============

@router.post("/units/{unit_id}/writing", response_model=WritingPromptResponse, status_code=201)
async def create_writing_prompt(
    unit_id: int,
    payload: WritingPromptCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create writing prompt with rubrics for a unit"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được tạo nội dung")

    try:
        prompt = WritingPrompt(
            unit_id=unit_id,
            title=payload.title,
            type=payload.type,
            instruction=payload.instruction,
            prompt=payload.prompt,
            additional_instruction=payload.additional_instruction,
            min_words=payload.min_words,
            max_words=payload.max_words,
            time_limit=payload.time_limit,
            difficulty=payload.difficulty,
            sample_answer=payload.sample_answer,
            hints_json=json.dumps(payload.hints, ensure_ascii=False) if payload.hints else None
        )
        db.add(prompt)
        db.flush()

        # Create rubrics
        for rubric_data in payload.rubrics:
            rubric = WritingRubric(
                prompt_id=prompt.id,
                category=rubric_data.category,
                description=rubric_data.description,
                max_points=rubric_data.max_points,
                order_index=rubric_data.order_index
            )
            db.add(rubric)

        db.commit()
        db.refresh(prompt)
        return prompt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/writing", response_model=WritingPromptResponse)
async def get_writing_prompt(
    unit_id: int,
    db: Session = Depends(get_db)
):
    """Get writing prompt for a unit - public endpoint"""
    prompt = db.query(WritingPrompt).filter(WritingPrompt.unit_id == unit_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Không tìm thấy writing prompt")
    return prompt


@router.put("/writing/{prompt_id}", response_model=WritingPromptResponse)
async def update_writing_prompt(
    prompt_id: int,
    payload: WritingPromptUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update writing prompt"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được sửa nội dung")

    prompt = db.query(WritingPrompt).filter(WritingPrompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Không tìm thấy writing prompt")

    for field, value in payload.dict(exclude_unset=True).items():
        if field == 'hints' and value is not None:
            prompt.hints_json = json.dumps(value, ensure_ascii=False)
        else:
            setattr(prompt, field, value)

    db.commit()
    db.refresh(prompt)
    return prompt


@router.delete("/writing/{prompt_id}", status_code=204)
async def delete_writing_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete writing prompt"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được xóa nội dung")

    prompt = db.query(WritingPrompt).filter(WritingPrompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Không tìm thấy writing prompt")

    db.delete(prompt)
    db.commit()
    return


# ============= LISTENING ENDPOINTS =============

@router.post("/units/{unit_id}/listening", response_model=ListeningAudioResponse, status_code=201)
async def create_listening_audio(
    unit_id: int,
    payload: ListeningAudioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create listening audio with questions for a unit"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được tạo nội dung")

    try:
        audio = ListeningAudio(
            unit_id=unit_id,
            title=payload.title,
            description=payload.description,
            audio_url=payload.audio_url,
            duration=payload.duration,
            difficulty=payload.difficulty,
            topic=payload.topic,
            accent=payload.accent,
            speed=payload.speed,
            transcript=payload.transcript,
            has_transcript=payload.has_transcript,
            total_questions=payload.total_questions
        )
        db.add(audio)
        db.flush()

        # Create questions
        for q_data in payload.questions:
            question = ListeningQuestion(
                audio_id=audio.id,
                type=q_data.type,
                question_text=q_data.question_text,
                options_json=json.dumps(q_data.options, ensure_ascii=False) if q_data.options else None,
                correct_answer=q_data.correct_answer,
                explanation=q_data.explanation,
                timestamp=q_data.timestamp,
                points=q_data.points,
                order_index=q_data.order_index
            )
            db.add(question)

        db.commit()
        db.refresh(audio)
        return audio
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/listening", response_model=ListeningAudioResponse)
async def get_listening_audio(
    unit_id: int,
    db: Session = Depends(get_db)
):
    """Get listening audio for a unit - public endpoint"""
    audio = db.query(ListeningAudio).filter(ListeningAudio.unit_id == unit_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Không tìm thấy listening audio")
    return audio


@router.put("/listening/{audio_id}", response_model=ListeningAudioResponse)
async def update_listening_audio(
    audio_id: int,
    payload: ListeningAudioUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update listening audio"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được sửa nội dung")

    audio = db.query(ListeningAudio).filter(ListeningAudio.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Không tìm thấy listening audio")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(audio, field, value)

    db.commit()
    db.refresh(audio)
    return audio


@router.delete("/listening/{audio_id}", status_code=204)
async def delete_listening_audio(
    audio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete listening audio"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được xóa nội dung")

    audio = db.query(ListeningAudio).filter(ListeningAudio.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Không tìm thấy listening audio")

    db.delete(audio)
    db.commit()
    return


# ============= SPEAKING ENDPOINTS =============

@router.post("/units/{unit_id}/speaking", response_model=SpeakingPromptResponse, status_code=201)
async def create_speaking_prompt(
    unit_id: int,
    payload: SpeakingPromptCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create speaking prompt with criteria for a unit"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được tạo nội dung")

    try:
        prompt = SpeakingPrompt(
            unit_id=unit_id,
            title=payload.title,
            type=payload.type,
            instruction=payload.instruction,
            prompt=payload.prompt,
            context=payload.context,
            preparation_time=payload.preparation_time,
            response_time=payload.response_time,
            difficulty=payload.difficulty,
            sample_response=payload.sample_response,
            sample_audio_url=payload.sample_audio_url,
            tips_json=json.dumps(payload.tips, ensure_ascii=False) if payload.tips else None,
            vocabulary_json=json.dumps(payload.vocabulary, ensure_ascii=False) if payload.vocabulary else None
        )
        db.add(prompt)
        db.flush()

        # Create criteria
        for criteria_data in payload.criteria:
            criteria = SpeakingCriteria(
                prompt_id=prompt.id,
                category=criteria_data.category,
                description=criteria_data.description,
                max_points=criteria_data.max_points,
                order_index=criteria_data.order_index
            )
            db.add(criteria)

        db.commit()
        db.refresh(prompt)
        return prompt
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/units/{unit_id}/speaking", response_model=SpeakingPromptResponse)
async def get_speaking_prompt(
    unit_id: int,
    db: Session = Depends(get_db)
):
    """Get speaking prompt for a unit - public endpoint"""
    prompt = db.query(SpeakingPrompt).filter(SpeakingPrompt.unit_id == unit_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Không tìm thấy speaking prompt")
    return prompt


@router.put("/speaking/{prompt_id}", response_model=SpeakingPromptResponse)
async def update_speaking_prompt(
    prompt_id: int,
    payload: SpeakingPromptUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update speaking prompt"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được sửa nội dung")

    prompt = db.query(SpeakingPrompt).filter(SpeakingPrompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Không tìm thấy speaking prompt")

    for field, value in payload.dict(exclude_unset=True).items():
        if field == 'tips' and value is not None:
            prompt.tips_json = json.dumps(value, ensure_ascii=False)
        elif field == 'vocabulary' and value is not None:
            prompt.vocabulary_json = json.dumps(value, ensure_ascii=False)
        else:
            setattr(prompt, field, value)

    db.commit()
    db.refresh(prompt)
    return prompt


@router.delete("/speaking/{prompt_id}", status_code=204)
async def delete_speaking_prompt(
    prompt_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete speaking prompt"""
    if current_user.role not in (UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPERADMIN):
        raise HTTPException(status_code=403, detail="Chỉ giáo viên mới được xóa nội dung")

    prompt = db.query(SpeakingPrompt).filter(SpeakingPrompt.id == prompt_id).first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Không tìm thấy speaking prompt")

    db.delete(prompt)
    db.commit()
    return

