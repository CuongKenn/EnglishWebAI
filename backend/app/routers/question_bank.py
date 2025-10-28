from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.question_bank import QuestionBankItem
from app.schemas.question_bank import (
    QuestionBankCreate,
    QuestionBankUpdate,
    QuestionBankItemOut,
    QuestionBankListResponse,
    ImportResult,
    GenerateTestConfig,
    GeneratedTestResponse,
    GeneratedTestQuestion,
    ExportDocxRequest,
    SaveFromTestRequest,
)
import os
import json
import asyncio
import random
from datetime import datetime
from fastapi.responses import StreamingResponse

router = APIRouter()


def _media_dir() -> str:
    base = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media")
    path = os.path.join(base, "question_bank")
    os.makedirs(path, exist_ok=True)
    return path


def _to_item_out(q: QuestionBankItem) -> QuestionBankItemOut:
    def loads(s):
        if not s:
            return None
        try:
            return json.loads(s)
        except Exception:
            return None

    return QuestionBankItemOut(
        id=q.id,
        skill_type=q.skill_type,
        question_type=q.question_type,
        difficulty=q.difficulty or "medium",
        topic=q.topic,
        question_text=q.question_text,
        options=loads(q.options_json) or None,
        correct_answer=q.correct_answer,
        acceptable_answers=loads(q.acceptable_answers_json) or None,
        media_url=q.media_url,
        transcript=q.transcript,
        passage_text=q.passage_text,
        passage_url=q.passage_url,
        writing_type=q.writing_type,
        word_limit_min=q.word_limit_min,
        word_limit_max=q.word_limit_max,
        requirements=loads(q.requirements_json) or None,
        tags=loads(q.tags_json) or None,
        points=q.points or 1,
        times_used=q.times_used or 0,
        created_at=q.created_at.isoformat() if q.created_at else None,
    )


@router.get("/", response_model=QuestionBankListResponse)
def list_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    q: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    qtype: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    page: int = 1,
    page_size: int = 100,
):
    qry = db.query(QuestionBankItem).filter(QuestionBankItem.owner_id == current_user.id)
    if q:
        like = f"%{q}%"
        qry = qry.filter((QuestionBankItem.question_text.ilike(like)) | (QuestionBankItem.topic.ilike(like)))
    if skill:
        qry = qry.filter(QuestionBankItem.skill_type == skill)
    if qtype:
        qry = qry.filter(QuestionBankItem.question_type == qtype)
    if difficulty:
        qry = qry.filter(QuestionBankItem.difficulty == difficulty)

    total = qry.count()
    items = qry.order_by(QuestionBankItem.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return QuestionBankListResponse(items=[_to_item_out(x) for x in items], total=total)


@router.post("/", response_model=QuestionBankItemOut, status_code=201)
def create_question(
    payload: QuestionBankCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = QuestionBankItem(
        owner_id=current_user.id,
        skill_type=payload.skill_type,
        question_type=payload.question_type,
        difficulty=payload.difficulty,
        topic=payload.topic,
        question_text=payload.question_text,
        options_json=json.dumps(payload.options or [], ensure_ascii=False) if payload.options is not None else None,
        correct_answer=str(payload.correct_answer) if payload.correct_answer is not None else None,
        acceptable_answers_json=json.dumps(payload.acceptable_answers or [], ensure_ascii=False) if payload.acceptable_answers is not None else None,
        media_url=payload.media_url,
        transcript=payload.transcript,
        passage_text=payload.passage_text,
        passage_url=payload.passage_url,
        writing_type=payload.writing_type,
        word_limit_min=payload.word_limit_min,
        word_limit_max=payload.word_limit_max,
        requirements_json=json.dumps(payload.requirements or [], ensure_ascii=False) if payload.requirements is not None else None,
        tags_json=json.dumps(payload.tags or [], ensure_ascii=False) if payload.tags is not None else None,
        points=payload.points,
        times_used=0,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return _to_item_out(q)


@router.put("/{item_id}", response_model=QuestionBankItemOut)
def update_question(
    item_id: int,
    payload: QuestionBankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(QuestionBankItem).filter(QuestionBankItem.id == item_id, QuestionBankItem.owner_id == current_user.id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field in ("options", "acceptable_answers", "requirements", "tags"):
            setattr(q, f"{field}_json", json.dumps(value or [], ensure_ascii=False))
        elif field == "correct_answer" and value is not None:
            setattr(q, field, str(value))
        else:
            setattr(q, field, value)

    db.commit()
    db.refresh(q)
    return _to_item_out(q)


@router.delete("/{item_id}")
def delete_question(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(QuestionBankItem).filter(QuestionBankItem.id == item_id, QuestionBankItem.owner_id == current_user.id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Deleted"}


@router.post("/{item_id}/duplicate", response_model=QuestionBankItemOut, status_code=201)
def duplicate_question(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(QuestionBankItem).filter(QuestionBankItem.id == item_id, QuestionBankItem.owner_id == current_user.id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    copy = QuestionBankItem(
        owner_id=current_user.id,
        skill_type=q.skill_type,
        question_type=q.question_type,
        difficulty=q.difficulty,
        topic=q.topic,
        question_text=(q.question_text or "") + " (Copy)",
        options_json=q.options_json,
        correct_answer=q.correct_answer,
        acceptable_answers_json=q.acceptable_answers_json,
        media_url=q.media_url,
        transcript=q.transcript,
        passage_text=q.passage_text,
        passage_url=q.passage_url,
        writing_type=q.writing_type,
        word_limit_min=q.word_limit_min,
        word_limit_max=q.word_limit_max,
        requirements_json=q.requirements_json,
        tags_json=q.tags_json,
        points=q.points,
        times_used=0,
    )
    db.add(copy)
    db.commit()
    db.refresh(copy)
    return _to_item_out(copy)


@router.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload audio file for listening questions"""
    try:
        print(f"[UPLOAD AUDIO] START - Filename: {file.filename}, ContentType: {file.content_type}, Size: {file.size if hasattr(file, 'size') else 'unknown'}")
        
        allowed = {
            "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3", 
            "audio/x-m4a", "audio/aac", "audio/webm", "audio/ogg",
            "audio/mp4", "audio/flac", "audio/x-flac",
            "application/octet-stream"  # Some browsers send generic type
        }
        
        # Also check by file extension as fallback
        filename_lower = file.filename.lower()
        allowed_extensions = {".mp3", ".wav", ".m4a", ".aac", ".webm", ".ogg", ".mp4", ".flac"}
        has_valid_extension = any(filename_lower.endswith(ext) for ext in allowed_extensions)
        
        print(f"[UPLOAD AUDIO] Validation - has_valid_extension: {has_valid_extension}, content_type_allowed: {file.content_type in allowed}")
        
        if file.content_type not in allowed and not has_valid_extension:
            print(f"[UPLOAD AUDIO] REJECTED - Invalid file type")
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported audio type: {file.content_type}. Please upload .mp3, .wav, .m4a, .aac, .webm, .ogg, or .flac files."
            )
        
        # Read file content
        content = await file.read()
        if not content:
            print(f"[UPLOAD AUDIO] REJECTED - File is empty")
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Check file size (max 100MB)
        file_size_mb = len(content) / 1024 / 1024
        print(f"[UPLOAD AUDIO] File size: {file_size_mb:.2f} MB")
        if file_size_mb > 100:
            print(f"[UPLOAD AUDIO] REJECTED - File too large")
            raise HTTPException(status_code=400, detail=f"File too large ({file_size_mb:.1f}MB). Maximum size is 100MB.")
        
        # Save file
        try:
            save_dir = os.path.join(_media_dir(), "audio")
            print(f"[UPLOAD AUDIO] Creating directory: {save_dir}")
            os.makedirs(save_dir, exist_ok=True)
        except Exception as e:
            print(f"[UPLOAD AUDIO] Failed to create directory: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create upload directory: {str(e)}")
        
        # Sanitize filename
        try:
            safe_filename = file.filename.replace(" ", "_").replace("/", "_").replace("\\", "_")
            timestamp = int(datetime.utcnow().timestamp())
            filename = f"{current_user.id}_{timestamp}_{safe_filename}"
            path = os.path.join(save_dir, filename)
            
            print(f"[UPLOAD AUDIO] Saving to: {path}")
            
            with open(path, "wb") as f:
                f.write(content)
            
            print(f"[UPLOAD AUDIO] File saved successfully")
        except Exception as e:
            print(f"[UPLOAD AUDIO] Failed to save file: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save audio file: {str(e)}")
        
        url = f"/media/question_bank/audio/{filename}"
        print(f"[UPLOAD AUDIO] Success: {url}")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD AUDIO] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload audio file: {str(e)}")


@router.post("/parse-docx")
async def parse_docx(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Parse DOCX file and return plain text content"""
    try:
        if not file.filename.lower().endswith(('.docx', '.doc')):
            raise HTTPException(status_code=400, detail="Please upload a .docx or .doc file")
        
        from docx import Document
        from io import BytesIO
        
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        doc = Document(BytesIO(content))
        
        # Extract all text from paragraphs
        text_parts = []
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:  # Only add non-empty paragraphs
                text_parts.append(text)
        
        full_text = '\n\n'.join(text_parts)
        
        if not full_text:
            raise HTTPException(status_code=400, detail="No text found in document")
        
        print(f"[PARSE DOCX] Successfully parsed {len(text_parts)} paragraphs, {len(full_text)} characters")
        
        return {
            "text": full_text,
            "paragraphs": len(text_parts),
            "characters": len(full_text)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PARSE DOCX] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")


@router.post("/upload/passage")
async def upload_passage(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload passage file (text, pdf, doc, docx) - Returns file URL"""
    try:
        # Accept common doc types and plain text
        allowed = {
            "text/plain", 
            "application/pdf", 
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream"  # Some browsers send generic type
        }
        
        # Also check by file extension as fallback
        filename_lower = file.filename.lower()
        allowed_extensions = {".txt", ".pdf", ".doc", ".docx"}
        has_valid_extension = any(filename_lower.endswith(ext) for ext in allowed_extensions)
        
        if file.content_type not in allowed and not has_valid_extension:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file.content_type}. Please upload .txt, .pdf, .doc, or .docx files."
            )
        
        save_dir = os.path.join(_media_dir(), "passage")
        os.makedirs(save_dir, exist_ok=True)
        
        # Sanitize filename
        safe_filename = file.filename.replace(" ", "_").replace("/", "_")
        filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}_{safe_filename}"
        path = os.path.join(save_dir, filename)
        
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="File is empty")
        
        with open(path, "wb") as f:
            f.write(content)
        
        url = f"/media/question_bank/passage/{filename}"
        print(f"[UPLOAD PASSAGE] Success: {url}")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD PASSAGE] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload passage file: {str(e)}")


@router.post("/import", response_model=ImportResult)
async def import_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import questions from CSV or DOCX file.
    
    CSV format: skill_type,question_type,question_text,options,correct_answer,...
    DOCX format: Each paragraph is a question, with markers for skill/type
    """
    filename_lower = file.filename.lower()
    
    if filename_lower.endswith(".docx"):
        return await import_docx(file, db, current_user)
    elif filename_lower.endswith(".csv"):
        return await import_csv_file(file, db, current_user)
    else:
        raise HTTPException(status_code=400, detail="Please upload a CSV or DOCX file")


async def import_csv_file(file: UploadFile, db: Session, current_user: User) -> ImportResult:
    # Simple CSV import: expected headers in first line
    content = (await file.read()).decode("utf-8", errors="ignore")
    lines = [l for l in content.splitlines() if l.strip()]
    if not lines:
        return ImportResult(imported=0, failed=0, errors=[])
    headers = [h.strip() for h in lines[0].split(",")]
    required = {"skill_type", "question_type", "question_text"}
    if not required.issubset(set(headers)):
        return ImportResult(imported=0, failed=0, errors=["Missing required headers: skill_type, question_type, question_text"])
    imported = 0
    failed = 0
    errors: List[str] = []
    for i, line in enumerate(lines[1:], start=2):
        try:
            cols = [c.strip() for c in line.split(",")]
            row = {k: (cols[idx] if idx < len(cols) else None) for idx, k in enumerate(headers)}
            options = None
            if row.get("options"):
                options = [x.strip() for x in row.get("options").split("|") if x.strip()]
            tags = None
            if row.get("tags"):
                tags = [x.strip() for x in row.get("tags").split("|") if x.strip()]
            item = QuestionBankItem(
                owner_id=current_user.id,
                skill_type=row.get("skill_type"),
                question_type=row.get("question_type"),
                difficulty=row.get("difficulty") or "medium",
                topic=row.get("topic"),
                question_text=row.get("question_text"),
                options_json=json.dumps(options or [], ensure_ascii=False) if options is not None else None,
                correct_answer=row.get("correct_answer"),
                acceptable_answers_json=None,
                media_url=row.get("media_url"),
                transcript=row.get("transcript"),
                passage_text=row.get("passage_text"),
                passage_url=row.get("passage_url"),
                writing_type=row.get("writing_type"),
                word_limit_min=int(row["word_limit_min"]) if (row.get("word_limit_min") or "").isdigit() else None,
                word_limit_max=int(row["word_limit_max"]) if (row.get("word_limit_max") or "").isdigit() else None,
                requirements_json=None,
                tags_json=json.dumps(tags or [], ensure_ascii=False) if tags is not None else None,
                points=int(row.get("points") or 1),
                times_used=0,
            )
            db.add(item)
            imported += 1
        except Exception as e:
            failed += 1
            errors.append(f"Line {i}: {e}")
    db.commit()
    return ImportResult(imported=imported, failed=failed, errors=errors)


async def import_docx(file: UploadFile, db: Session, current_user: User) -> ImportResult:
    """Import questions from DOCX file.
    
    Expected format:
    - Each question starts with [SKILL_TYPE] marker: [LISTENING], [SPEAKING], [READING], [WRITING]
    - Followed by question text
    - For multiple choice: Options A, B, C, D on separate lines
    - Answer line: "Answer: B" or "Correct: B"
    - Blank line separates questions
    
    Example:
        [LISTENING] What is the main topic?
        A. Weather
        B. Sports
        C. Music
        D. Travel
        Answer: C
        
        [READING] Fill in the blank: He ___ to school every day.
        Answer: goes
    """
    try:
        from docx import Document
        content = await file.read()
        from io import BytesIO
        doc = Document(BytesIO(content))
    except Exception as e:
        return ImportResult(imported=0, failed=0, errors=[f"Failed to parse DOCX: {str(e)}"])
    
    imported = 0
    failed = 0
    errors: List[str] = []
    
    # Parse paragraphs into questions
    current_question = {}
    current_options = []
    line_num = 0
    
    def save_question():
        nonlocal imported, failed, current_question, current_options
        if not current_question.get("question_text"):
            return
        try:
            # Determine question type
            question_type = "short_answer"
            options_list = None
            if current_options:
                question_type = "multiple_choice"
                options_list = current_options
            elif "___" in current_question["question_text"] or "_____" in current_question["question_text"]:
                question_type = "fill_blank"
            elif current_question.get("question_text", "").lower().strip().endswith("?") and not current_options:
                question_type = "short_answer"
            
            item = QuestionBankItem(
                owner_id=current_user.id,
                skill_type=current_question.get("skill_type", "reading"),
                question_type=question_type,
                difficulty=current_question.get("difficulty", "medium"),
                topic=current_question.get("topic"),
                question_text=current_question.get("question_text"),
                options_json=json.dumps(options_list or [], ensure_ascii=False) if options_list else None,
                correct_answer=current_question.get("correct_answer"),
                acceptable_answers_json=None,
                media_url=None,
                transcript=current_question.get("transcript"),
                passage_text=current_question.get("passage"),
                passage_url=None,
                writing_type=None,
                word_limit_min=None,
                word_limit_max=None,
                requirements_json=None,
                tags_json=json.dumps([current_question.get("skill_type", "imported")], ensure_ascii=False),
                points=int(current_question.get("points", 1)),
                times_used=0,
            )
            db.add(item)
            imported += 1
        except Exception as e:
            failed += 1
            errors.append(f"Question at line ~{line_num}: {str(e)}")
    
    for para in doc.paragraphs:
        line_num += 1
        text = para.text.strip()
        if not text:
            # Blank line = end of question
            if current_question:
                save_question()
                current_question = {}
                current_options = []
            continue
        
        # Check for skill marker
        if text.startswith("[") and "]" in text:
            # Save previous question if exists
            if current_question:
                save_question()
                current_question = {}
                current_options = []
            
            # Parse new question
            marker_end = text.index("]")
            skill_text = text[1:marker_end].strip().lower()
            question_text = text[marker_end+1:].strip()
            
            current_question = {
                "skill_type": skill_text,
                "question_text": question_text,
            }
        elif text.lower().startswith(("answer:", "correct:", "đáp án:")):
            # Extract answer
            answer = text.split(":", 1)[1].strip()
            current_question["correct_answer"] = answer
        elif text.startswith(("A.", "B.", "C.", "D.", "E.", "F.")):
            # Multiple choice option
            current_options.append(text)
        elif text.lower().startswith(("passage:", "transcript:", "đoạn văn:", "đoạn nghe:")):
            # Passage or transcript
            passage_text = text.split(":", 1)[1].strip()
            if "transcript" in text.lower() or "nghe" in text.lower():
                current_question["transcript"] = passage_text
            else:
                current_question["passage"] = passage_text
        elif not current_question.get("question_text"):
            # First line without marker = question text
            current_question["question_text"] = text
            current_question["skill_type"] = "reading"  # default
    
    # Save last question
    if current_question:
        save_question()
    
    db.commit()
    return ImportResult(imported=imported, failed=failed, errors=errors)


@router.post("/generate-test", response_model=GeneratedTestResponse)
async def generate_test(
    config: GenerateTestConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a mixed-skill test using Gemini for reading/speaking/writing/listening."""
    from app.services.gemini_service import gemini_service

    total = max(1, min(50, config.totalQuestions))
    sd = config.skillDistribution or {"listening": 25, "speaking": 25, "reading": 25, "writing": 25}
    
    print(f"[DEBUG] ===== AI Test Generation Started =====")
    print(f"[DEBUG] Total questions: {total}")
    print(f"[DEBUG] Skill distribution received: {sd}")
    print(f"[DEBUG] Avoid duplicates: {config.avoidDuplicates}")
    print(f"[DEBUG] AI only: {config.aiOnly}")

    # Compute target counts per skill
    skill_targets = {}
    assigned = 0
    for skill, pct in sd.items():
        cnt = round(total * (int(pct) / 100.0))
        skill_targets[skill] = cnt
        assigned += cnt
    # Adjust rounding difference
    if assigned != total:
        # add/rem to reading by default
        skill_targets["reading"] = max(0, (skill_targets.get("reading", 0) or 0) + (total - assigned))
    
    print(f"[DEBUG] Skill targets calculated: {skill_targets}")
    print(f"[DEBUG] Total assigned: {sum(skill_targets.values())}")

    out_questions: List[GeneratedTestQuestion] = []

    # Build duplicate baselines from user's bank if requested
    bank_questions: List[str] = []
    bank_passages: List[str] = []
    bank_transcripts: List[str] = []
    if config.avoidDuplicates:
        rows = db.query(QuestionBankItem).filter(QuestionBankItem.owner_id == current_user.id).all()
        for r in rows:
            if r.question_text:
                bank_questions.append(r.question_text)
            if r.passage_text:
                bank_passages.append(r.passage_text)
            if r.transcript:
                bank_transcripts.append(r.transcript)

    import re
    from difflib import SequenceMatcher

    def _norm(s: str) -> str:
        return re.sub(r"\s+", " ", (s or "").lower()).strip()

    def _similar(a: str, b: str) -> float:
        return SequenceMatcher(None, _norm(a), _norm(b)).ratio()

    def is_dup_question(text: str) -> bool:
        if not config.avoidDuplicates or not text:
            return False
        t = _norm(text)
        # Check bank questions
        for q in bank_questions:
            if _similar(t, q) >= 0.90:
                return True
        # Check within current output
        for q in out_questions:
            if _similar(t, q.question_text) >= 0.95:
                return True
        return False

    def is_dup_passage(passage: str) -> bool:
        if not config.avoidDuplicates or not passage:
            return False
        p = _norm(passage)
        for s in bank_passages:
            if _similar(p, s) >= 0.85:
                return True
        # Check in current generation
        for q in out_questions:
            if getattr(q, "passage_text", None) and _similar(p, getattr(q, "passage_text")) >= 0.90:
                return True
        return False

    def is_dup_transcript(trans: str) -> bool:
        if not config.avoidDuplicates or not trans:
            return False
        p = _norm(trans)
        for s in bank_transcripts:
            if _similar(p, s) >= 0.85:
                return True
        for q in out_questions:
            if getattr(q, "transcript", None) and _similar(p, getattr(q, "transcript")) >= 0.90:
                return True
        return False

    def _ensure_multiple_choice(questions: List[GeneratedTestQuestion]):
        """Ensure at least one multiple_choice among provided questions.
        If none exists, convert the first question to a simple MC by
        synthesizing generic distractors.
        """
        if not questions:
            return
        has_mc = any(q.question_type == "multiple_choice" for q in questions)
        if has_mc:
            return
        q = questions[0]
        correct = q.correct_answer if q.correct_answer is not None else "Yes"
        # Create basic options list including the correct answer at a random position
        opts = [str(correct), "No", "Not mentioned", "Cannot say"]
        random.shuffle(opts)
        try:
            idx = opts.index(str(correct))
        except ValueError:
            idx = 0
        q.question_type = "multiple_choice"  # type: ignore
        q.options = opts  # type: ignore
        q.correct_answer = idx  # type: ignore

    # Helpers for fallbacks from personal bank
    def fallback_from_bank(skill: str, count: int):
        if count <= 0:
            return []
        rows = (
            db.query(QuestionBankItem)
            .filter(QuestionBankItem.owner_id == current_user.id, QuestionBankItem.skill_type == skill)
            .order_by(QuestionBankItem.created_at.desc())
            .all()
        )
        random.shuffle(rows)
        out = []
        for r in rows[:count]:
            try:
                options = json.loads(r.options_json) if r.options_json else None
            except Exception:
                options = None
            try:
                tags = json.loads(r.tags_json) if r.tags_json else None
            except Exception:
                tags = None
            out.append(
                GeneratedTestQuestion(
                    question_text=r.question_text or "",
                    question_type=r.question_type or "short_answer",
                    skill_type=skill,
                    options=options,
                    correct_answer=r.correct_answer,
                    difficulty=r.difficulty or "medium",
                    topic=r.topic,
                    tags=tags or [skill],
                    points=r.points or 1,
                )
            )
        return out

    # Reading: generate a passage + questions; slice to target count
    reading_target = skill_targets.get("reading", 0)
    print(f"[DEBUG] Reading target: {reading_target} questions")
    if reading_target > 0:
        try:
            # Keep calling AI until enough unique reading questions
            # Dynamic max_attempts based on target: AI generates ~3-5 questions per passage
            # So need target/4 attempts minimum, with buffer for duplicates
            attempts = 0
            successful_attempts = 0
            max_attempts = max(5, min(reading_target // 2 + 3, 20))  # Scale with target, cap at 20
            # Dynamic timeout: more time for larger targets
            timeout_seconds = min(20 + (reading_target // 5) * 5, 40)  # 20-40 seconds
            print(f"[DEBUG] Max attempts: {max_attempts}, Timeout: {timeout_seconds}s")
            
            while len([x for x in out_questions if x.skill_type == "reading"]) < reading_target and attempts < max_attempts:
                attempts += 1
                print(f"[DEBUG] Reading attempt {attempts}/{max_attempts}")
                reading = await asyncio.wait_for(gemini_service.generate_reading_passage(), timeout=timeout_seconds)
                # Skip duplicate passages
                if is_dup_passage(reading.get("passage")):
                    print(f"[DEBUG] Skipped duplicate passage")
                    continue
                
                successful_attempts += 1
                # Add questions, filtering duplicates by text
                rq = reading.get("questions", [])
                print(f"[DEBUG] AI generated {len(rq)} reading questions")
                questions_added = 0
                for q in rq:
                    if len([x for x in out_questions if x.skill_type == "reading"]) >= reading_target:
                        break
                    if is_dup_question(q.get("question", "")):
                        print(f"[DEBUG] Skipped duplicate question")
                        continue
                    out_questions.append(GeneratedTestQuestion(
                        question_text=q.get("question", ""),
                        question_type="multiple_choice" if q.get("question_format") == "multiple_choice" else (
                            "true_false" if q.get("question_format") == "true_false" else (
                                "fill_blank" if q.get("question_format") == "fill_blank" else "short_answer"
                            )
                        ),
                        skill_type="reading",
                        options=q.get("options") or None,
                        correct_answer=q.get("correct_answer"),
                        difficulty="medium",
                        topic=reading.get("title"),
                        tags=["reading"],
                        points=2,
                        passage_text=reading.get("passage"),
                    ))
                    questions_added += 1
                print(f"[DEBUG] Added {questions_added} reading questions to test")
            
            print(f"[DEBUG] Total reading questions generated: {len([x for x in out_questions if x.skill_type == 'reading'])}")
            # Ensure variety: at least one MC
            _ensure_multiple_choice([x for x in out_questions if x.skill_type == "reading"])
        except Exception as e:
            print(f"[ERROR] Generate reading failed: {e}")
            import traceback
            traceback.print_exc()
            if not config.aiOnly:
                out_questions.extend(fallback_from_bank("reading", reading_target))
        finally:
            # Ensure at least some reading questions if target > 0
            current_reading = [q for q in out_questions if q.skill_type == "reading"]
            deficit = max(0, reading_target - len(current_reading))
            print(f"[DEBUG] Reading deficit: {deficit} questions")
            if deficit > 0:
                # Fallback static passage to guarantee presence
                passage = (
                    "Reading books regularly offers numerous benefits. It improves vocabulary, "
                    "expands knowledge, and helps reduce stress. Many people prefer printed books, "
                    "while others enjoy e-books because they are convenient to carry."
                )
                title = "Benefits of Reading"
                # Two basic questions
                samples = [
                    {
                        "question": "What is one benefit of reading mentioned in the passage?",
                        "question_type": "short_answer",
                    },
                    {
                        "question": "Some people like e-books because they are _____ to carry.",
                        "question_type": "fill_blank",
                        "correct_answer": "convenient",
                    },
                    {
                        "question": "According to the passage, which is NOT a benefit of reading?",
                        "question_type": "multiple_choice",
                        "options": [
                            "Reducing stress",
                            "Improving vocabulary",
                            "Increasing screen time",
                            "Expanding knowledge",
                        ],
                        "correct_answer": 2,
                    },
                ]
                for s in samples[:deficit]:
                    out_questions.append(GeneratedTestQuestion(
                        question_text=s["question"],
                        question_type=s.get("question_type", "short_answer"),
                        skill_type="reading",
                        options=s.get("options"),
                        correct_answer=s.get("correct_answer"),
                        difficulty="easy",
                        topic=title,
                        tags=["reading"],
                        points=2,
                        passage_text=passage,
                    ))
                # Ensure variety on fallback
                _ensure_multiple_choice([x for x in out_questions if x.skill_type == "reading"]) 

    # Listening: create transcript + MC/fill questions via Gemini
    listening_target = skill_targets.get("listening", 0)
    print(f"[DEBUG] Listening target: {listening_target} questions")
    if listening_target > 0:
        try:
            attempts = 0
            # Dynamic max_attempts: AI generates multiple questions per segment
            max_attempts = max(5, min(listening_target // 2 + 3, 20))
            timeout_seconds = min(20 + (listening_target // 5) * 5, 40)
            print(f"[DEBUG] Max attempts: {max_attempts}, Timeout: {timeout_seconds}s")
            
            while len([x for x in out_questions if x.skill_type == "listening"]) < listening_target and attempts < max_attempts:
                attempts += 1
                print(f"[DEBUG] Listening attempt {attempts}/{max_attempts}")
                data = await asyncio.wait_for(gemini_service.generate_listening_segment(num_questions=listening_target), timeout=timeout_seconds)
                if is_dup_transcript(data.get("transcript")):
                    continue
                lqs = data.get("questions", [])
                for q in lqs:
                    if len([x for x in out_questions if x.skill_type == "listening"]) >= listening_target:
                        break
                    if is_dup_question(q.get("question", "")):
                        continue
                    out_questions.append(GeneratedTestQuestion(
                        question_text=q.get("question", ""),
                        question_type="multiple_choice" if q.get("question_format") == "multiple_choice" else (
                            "true_false" if q.get("question_format") == "true_false" else (
                                "fill_blank" if q.get("question_format") == "fill_blank" else "short_answer"
                            )
                        ),
                        skill_type="listening",
                        options=q.get("options") or None,
                        correct_answer=q.get("correct_answer"),
                        difficulty="easy",
                        topic=data.get("title"),
                        tags=["listening"],
                        points=2,
                        transcript=data.get("transcript"),
                    ))
            # Ensure variety: at least one MC
            _ensure_multiple_choice([x for x in out_questions if x.skill_type == "listening"])
            print(f"[DEBUG] Total listening questions generated: {len([x for x in out_questions if x.skill_type == 'listening'])}")
        except Exception as e:
            print(f"[ERROR] Generate listening failed: {e}")
            import traceback
            traceback.print_exc()
            if not config.aiOnly:
                out_questions.extend(fallback_from_bank("listening", listening_target))
        finally:
            # Ensure at least some listening questions if target > 0
            current_listening = [q for q in out_questions if q.skill_type == "listening"]
            deficit = max(0, listening_target - len(current_listening))
            print(f"[DEBUG] Listening deficit: {deficit} questions")
            if deficit > 0:
                # Fallback: basic listening questions with transcript
                fallback_transcript = "Hello, my name is Sarah. I work as a teacher at an international school. Every morning, I wake up at 6 AM and prepare for my classes. I love teaching because I enjoy helping students learn new things."
                fallback_questions = [
                    {"q": "What is the speaker's job?", "type": "short_answer", "answer": "teacher"},
                    {"q": "What time does Sarah wake up?", "type": "short_answer", "answer": "6 AM"},
                    {"q": "Why does Sarah love teaching?", "type": "short_answer", "answer": "She enjoys helping students learn"},
                ]
                for i in range(min(deficit, len(fallback_questions))):
                    fq = fallback_questions[i]
                    out_questions.append(GeneratedTestQuestion(
                        question_text=fq["q"],
                        question_type=fq["type"],
                        skill_type="listening",
                        options=None,
                        correct_answer=fq.get("answer"),
                        difficulty="easy",
                        topic="Daily Routine",
                        tags=["listening", "fallback"],
                        points=2,
                        transcript=fallback_transcript,
                    ))

    # Speaking: generate tasks/prompts
    speaking_target = skill_targets.get("speaking", 0)
    print(f"[DEBUG] Speaking target: {speaking_target} questions")
    if speaking_target > 0:
        try:
            timeout_seconds = min(12 + (speaking_target // 3) * 3, 30)
            print(f"[DEBUG] Generating speaking tasks... Timeout: {timeout_seconds}s")
            sp = await asyncio.wait_for(gemini_service.generate_speaking_tasks(count=speaking_target), timeout=timeout_seconds)
            for t in sp.get("tasks", [])[:speaking_target]:
                if is_dup_question(t.get("prompt", "")):
                    continue
                out_questions.append(GeneratedTestQuestion(
                    question_text=t.get("prompt", ""),
                    question_type="task",
                    skill_type="speaking",
                    options=None,
                    correct_answer=None,
                    difficulty="medium",
                    topic=t.get("topic"),
                    tags=["speaking"],
                    points=3,
                ))
            print(f"[DEBUG] Total speaking questions generated: {len([x for x in out_questions if x.skill_type == 'speaking'])}")
        except Exception as e:
            print(f"[ERROR] Generate speaking failed: {e}")
            import traceback
            traceback.print_exc()
            if not config.aiOnly:
                out_questions.extend(fallback_from_bank("speaking", speaking_target))
        finally:
            # Ensure at least some speaking questions if target > 0
            current_speaking = [q for q in out_questions if q.skill_type == "speaking"]
            deficit = max(0, speaking_target - len(current_speaking))
            print(f"[DEBUG] Speaking deficit: {deficit} questions")
            if deficit > 0:
                # Fallback: basic speaking prompts
                fallback_prompts = [
                    "Introduce yourself and talk about your hobbies.",
                    "Describe your daily routine.",
                    "Talk about your favorite place to visit.",
                    "Discuss your future career plans.",
                    "Describe an important event in your life.",
                ]
                for i in range(min(deficit, len(fallback_prompts))):
                    out_questions.append(GeneratedTestQuestion(
                        question_text=fallback_prompts[i],
                        question_type="task",
                        skill_type="speaking",
                        options=None,
                        correct_answer=None,
                        difficulty="medium",
                        topic="General Speaking",
                        tags=["speaking", "fallback"],
                        points=3,
                    ))

    # Writing: generate prompts
    writing_target = skill_targets.get("writing", 0)
    print(f"[DEBUG] Writing target: {writing_target} questions")
    if writing_target > 0:
        try:
            print(f"[DEBUG] Generating writing prompts...")
            timeout_seconds = min(12 + (writing_target // 3) * 3, 30)
            # Generate all requested writing questions (no limit)
            for i in range(writing_target):
                print(f"[DEBUG] Writing prompt {i+1}/{writing_target}, Timeout: {timeout_seconds}s")
                wt = await asyncio.wait_for(gemini_service.generate_writing_topic("essay", "intermediate"), timeout=timeout_seconds)
                if is_dup_question(wt.get("prompt", "")):
                    continue
                out_questions.append(GeneratedTestQuestion(
                    question_text=wt.get("prompt", ""),
                    question_type="task",
                    skill_type="writing",
                    options=None,
                    correct_answer=None,
                    difficulty="medium",
                    topic=wt.get("title"),
                    tags=["writing"],
                    points=4,
                ))
        except Exception as e:
            print("Generate writing failed:", e)
            if not config.aiOnly:
                out_questions.extend(fallback_from_bank("writing", writing_target))
        finally:
            # Ensure at least one writing task if target > 0
            current_writing = [q for q in out_questions if q.skill_type == "writing"]
            deficit = max(0, writing_target - len(current_writing))
            if deficit > 0 and not config.aiOnly:
                prompt = (
                    "Write a short paragraph (120-150 words) about your daily routine. "
                    "Describe what time you wake up, what you do in the morning, afternoon, and evening, "
                    "and how you feel about your routine. Use time expressions and linking words."
                )
                for _ in range(deficit):
                    out_questions.append(GeneratedTestQuestion(
                        question_text=prompt,
                        question_type="task",
                        skill_type="writing",
                        options=None,
                        correct_answer=None,
                        difficulty="medium",
                        topic="Daily Routine",
                        tags=["writing"],
                        points=4,
                    ))

    # Trim/fill to requested total and compute points
    # Always try to ensure exact total questions. If AI can't provide enough,
    # supplement from the user's bank; if still lacking, duplicate existing
    # generated questions as a last resort (keeps exam size consistent).
    if len(out_questions) < total:
        # Try extra AI calls ignoring duplication rules to fill remaining
        try:
            remaining = total - len(out_questions)
            print(f"[DEBUG] Need {remaining} more questions to reach target {total}")
            attempts = 0
            max_fill_attempts = min(3, (remaining // 3) + 1)
            while remaining > 0 and attempts < max_fill_attempts:
                attempts += 1
                print(f"[DEBUG] Fill attempt {attempts}/{max_fill_attempts}")
                # Prefer reading passages to create self-contained questions
                reading = await asyncio.wait_for(gemini_service.generate_reading_passage(), timeout=20)
                rq = reading.get("questions", [])
                for q in rq:
                    if remaining <= 0:
                        break
                    out_questions.append(GeneratedTestQuestion(
                        question_text=q.get("question", ""),
                        question_type="multiple_choice" if q.get("question_format") == "multiple_choice" else (
                            "true_false" if q.get("question_format") == "true_false" else (
                                "fill_blank" if q.get("question_format") == "fill_blank" else "short_answer"
                            )
                        ),
                        skill_type="reading",
                        options=q.get("options") or None,
                        correct_answer=q.get("correct_answer"),
                        difficulty="medium",
                        topic=reading.get("title"),
                        tags=["reading"],
                        points=2,
                        passage_text=reading.get("passage"),
                    ))
                    remaining -= 1
        except Exception:
            pass
    # If still short, fill proportionally by skill deficit (not randomly!)
    if len(out_questions) < total:
        print(f"[DEBUG] Total short by {total - len(out_questions)} questions. Filling by skill deficit...")
        
        # Calculate deficit per skill
        skill_deficits = {}
        for skill in ["reading", "listening", "speaking", "writing"]:
            target = skill_targets.get(skill, 0)
            current = len([q for q in out_questions if q.skill_type == skill])
            deficit = max(0, target - current)
            if deficit > 0:
                skill_deficits[skill] = deficit
                print(f"[DEBUG] {skill} deficit: {deficit} questions")
        
        # Fill from bank proportionally by deficit
        if not config.aiOnly and skill_deficits:
            for skill, deficit in sorted(skill_deficits.items(), key=lambda x: -x[1]):  # Largest deficit first
                extra = fallback_from_bank(skill, deficit)
                if extra:
                    print(f"[DEBUG] Filled {len(extra)} {skill} questions from bank")
                    out_questions.extend(extra)
        
        # As a final guard, if still short, duplicate proportionally by deficit
        import random as _rand
        while len(out_questions) < total and skill_deficits:
            # Pick a skill with deficit
            deficit_skills = [s for s, d in skill_deficits.items() if d > 0]
            if not deficit_skills:
                # If no deficit but still short, just duplicate any
                if out_questions:
                    base = _rand.choice(out_questions)
                    out_questions.append(GeneratedTestQuestion(
                        question_text=base.question_text,
                        question_type=base.question_type,
                        skill_type=base.skill_type,
                        options=base.options,
                        correct_answer=base.correct_answer,
                        difficulty=base.difficulty,
                        topic=base.topic,
                        tags=base.tags,
                        points=base.points,
                        transcript=getattr(base, "transcript", None),
                        passage_text=getattr(base, "passage_text", None),
                    ))
                else:
                    break
            else:
                # Duplicate from the skill with largest deficit
                target_skill = max(deficit_skills, key=lambda s: skill_deficits[s])
                skill_questions = [q for q in out_questions if q.skill_type == target_skill]
                if skill_questions:
                    base = _rand.choice(skill_questions)
                    out_questions.append(GeneratedTestQuestion(
                        question_text=f"[Duplicate] {base.question_text}",
                        question_type=base.question_type,
                        skill_type=base.skill_type,
                        options=base.options,
                        correct_answer=base.correct_answer,
                        difficulty=base.difficulty,
                        topic=base.topic,
                        tags=base.tags,
                        points=base.points,
                        transcript=getattr(base, "transcript", None),
                        passage_text=getattr(base, "passage_text", None),
                    ))
                    skill_deficits[target_skill] -= 1
                    print(f"[DEBUG] Duplicated {target_skill} question (deficit now: {skill_deficits[target_skill]})")
                else:
                    # No questions of this skill exist, remove from deficit list
                    del skill_deficits[target_skill]

    # Reconcile reading target specifically: ensure close to requested share
    try:
        current_reading = [q for q in out_questions if q.skill_type == "reading"]
        need = max(0, reading_target - len(current_reading))
        tries = 0
        while need > 0 and tries < 3:
            tries += 1
            try:
                reading = await asyncio.wait_for(gemini_service.generate_reading_passage(), timeout=15)
                rq = reading.get("questions", [])
                if not rq:
                    continue
                q0 = rq[0]
                out_questions.append(GeneratedTestQuestion(
                    question_text=q0.get("question", ""),
                    question_type="multiple_choice" if q0.get("question_format") == "multiple_choice" else (
                        "true_false" if q0.get("question_format") == "true_false" else (
                            "fill_blank" if q0.get("question_format") == "fill_blank" else "short_answer"
                        )
                    ),
                    skill_type="reading",
                    options=q0.get("options") or None,
                    correct_answer=q0.get("correct_answer"),
                    difficulty="medium",
                    topic=reading.get("title"),
                    tags=["reading"],
                    points=2,
                    passage_text=reading.get("passage"),
                ))
                need -= 1
            except Exception:
                break

        # If the list grew beyond total, trim from the skill with largest overage (prefer listening)
        def counts():
            from collections import Counter
            c = Counter([q.skill_type for q in out_questions])
            return {k: c.get(k, 0) for k in ["reading","listening","speaking","writing"]}

        while len(out_questions) > total:
            c = counts()
            over = {
                "reading": c["reading"] - reading_target,
                "listening": c["listening"] - skill_targets.get("listening", 0),
                "speaking": c["speaking"] - skill_targets.get("speaking", 0),
                "writing": c["writing"] - skill_targets.get("writing", 0),
            }
            # remove from the skill with max positive overage; fallback listening
            skill_to_remove = max(over, key=lambda k: over[k])
            if over[skill_to_remove] <= 0:
                # nothing clearly over; remove last non-reading
                skill_to_remove = "listening"
            for i in range(len(out_questions)-1, -1, -1):
                if out_questions[i].skill_type == skill_to_remove and (skill_to_remove != "reading" or c["reading"] > 1):
                    del out_questions[i]
                    break
            else:
                out_questions.pop()
    except Exception:
        pass

    out_questions = out_questions[:total]
    total_points = sum([q.points for q in out_questions])
    
    # Log final results
    print(f"[DEBUG] ===== Generation Complete =====")
    skill_counts = {}
    for skill in ["listening", "speaking", "reading", "writing"]:
        count = len([q for q in out_questions if q.skill_type == skill])
        skill_counts[skill] = count
        target = skill_targets.get(skill, 0)
        delta = count - target
        status = "✓" if abs(delta) <= 1 else "⚠"
        print(f"[DEBUG] {status} {skill.capitalize()}: {count} questions (target: {target}, delta: {delta:+d})")
    print(f"[DEBUG] Total questions: {len(out_questions)} (target: {total})")
    print(f"[DEBUG] Total points: {total_points}")
    
    # Force rebalance if severely imbalanced
    for skill in ["reading", "writing", "speaking"]:  # Don't touch listening first
        target = skill_targets.get(skill, 0)
        current = len([q for q in out_questions if q.skill_type == skill])
        if target > 0 and current < target - 2:  # More than 2 questions short
            print(f"[WARNING] {skill} severely short: {current}/{target}. Attempting rebalance...")
            # Find over-allocated skills to steal from
            for donor_skill in ["listening", "speaking", "reading", "writing"]:
                if donor_skill == skill:
                    continue
                donor_target = skill_targets.get(donor_skill, 0)
                donor_current = len([q for q in out_questions if q.skill_type == donor_skill])
                if donor_current > donor_target + 2:  # More than 2 questions over
                    # Steal questions from donor
                    steal_count = min(target - current, donor_current - donor_target)
                    print(f"[REBALANCE] Stealing {steal_count} questions from {donor_skill} to {skill}")
                    stolen = 0
                    for i, q in enumerate(out_questions):
                        if q.skill_type == donor_skill and stolen < steal_count:
                            # Change skill type (this is a hack but ensures balance)
                            out_questions[i] = GeneratedTestQuestion(
                                question_text=f"[Rebalanced from {donor_skill}] {q.question_text}",
                                question_type=q.question_type,
                                skill_type=skill,
                                options=q.options,
                                correct_answer=q.correct_answer,
                                difficulty=q.difficulty,
                                topic=q.topic,
                                tags=q.tags,
                                points=q.points,
                                transcript=getattr(q, 'transcript', None),
                                passage_text=getattr(q, 'passage_text', None),
                            )
                            stolen += 1
                    current = len([q for q in out_questions if q.skill_type == skill])
                    if current >= target - 1:
                        break

    # Final guarantee: if reading was requested (>0) but none made it (due to
    # dedup constraints/timeouts), try to inject at least 1 fresh reading
    # question by asking AI once more and replacing the last non-reading item.
    try:
        if reading_target > 0 and not any(q.skill_type == 'reading' for q in out_questions):
            reading = await asyncio.wait_for(gemini_service.generate_reading_passage(), timeout=15)
            rq = reading.get('questions', [])
            if rq:
                q0 = rq[0]
                newq = GeneratedTestQuestion(
                    question_text=q0.get('question', ''),
                    question_type='multiple_choice' if q0.get('question_format') == 'multiple_choice' else (
                        'true_false' if q0.get('question_format') == 'true_false' else (
                            'fill_blank' if q0.get('question_format') == 'fill_blank' else 'short_answer'
                        )
                    ),
                    skill_type='reading',
                    options=q0.get('options') or None,
                    correct_answer=q0.get('correct_answer'),
                    difficulty='medium',
                    topic=reading.get('title'),
                    tags=['reading'],
                    points=2,
                    passage_text=reading.get('passage'),
                )
                # Replace last non-reading to keep total constant
                for i in range(len(out_questions)-1, -1, -1):
                    if out_questions[i].skill_type != 'reading':
                        out_questions[i] = newq
                        break
                else:
                    out_questions[0] = newq
                total_points = sum([q.points for q in out_questions])
    except Exception:
        pass

    return GeneratedTestResponse(
        name=config.testName or f"Đề thi AI - {datetime.utcnow().date().isoformat()}",
        questions=out_questions,
        timeLimit=config.timeLimit,
        totalPoints=total_points,
        skillDistribution=sd,
        createdAt=datetime.utcnow().isoformat(),
    )


@router.post("/export-docx")
async def export_docx(payload: ExportDocxRequest):
    """Return a DOCX file built from the generated test payload."""
    try:
        from docx import Document
        from docx.shared import Pt
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Missing dependency python-docx: {e}")

    doc = Document()

    title = doc.add_paragraph(payload.name)
    title_format = title.runs[0].font
    title_format.size = Pt(16)
    title_format.bold = True
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    meta = []
    if payload.timeLimit:
        meta.append(f"Time: {payload.timeLimit} minutes")
    if payload.totalPoints:
        meta.append(f"Total points: {payload.totalPoints}")
    if meta:
        doc.add_paragraph(" | ".join(meta))

    # Questions
    printed_passages = set()
    for idx, q in enumerate(payload.questions, start=1):
        # Print reading passage once per topic if present
        try:
            if getattr(q, 'skill_type', None) == 'reading' and getattr(q, 'passage_text', None):
                key = f"{getattr(q, 'topic', '')}::{getattr(q, 'passage_text', '')[:40]}"
                if key not in printed_passages:
                    printed_passages.add(key)
                    pph = doc.add_paragraph("Passage:")
                    pph.runs[0].font.bold = True
                    doc.add_paragraph(getattr(q, 'passage_text'))
        except Exception:
            pass
        p = doc.add_paragraph()
        run = p.add_run(f"{idx}. {q.question_text}")
        run.font.size = Pt(12)
        # Tags
        t = []
        if q.skill_type:
            t.append(q.skill_type.capitalize())
        if q.difficulty:
            t.append(q.difficulty)
        if t:
            doc.add_paragraph(f"[{', '.join(t)}]   {q.points or 1} pts")

        if q.question_type == 'multiple_choice' and q.options:
            labels = ["A", "B", "C", "D", "E", "F"]
            for i, opt in enumerate(q.options):
                doc.add_paragraph(f"{labels[i]}. {opt}")
        elif q.question_type == 'true_false':
            doc.add_paragraph("True / False")
        elif q.question_type == 'fill_blank':
            doc.add_paragraph("Answer: _____________")
        elif q.question_type == 'short_answer' or q.question_type == 'task':
            doc.add_paragraph("Answer space:")
            for _ in range(3):
                doc.add_paragraph("______________________________")

    from io import BytesIO
    buf = BytesIO()
    doc.save(buf)
    buf.seek(0)
    filename = (payload.name or "test").replace("/", "_").replace("\\", "_") + ".docx"
    return StreamingResponse(buf, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document', headers={
        'Content-Disposition': f'attachment; filename="{filename}"'
    })


@router.post("/create-exercise")
async def create_exercise_from_test(
    payload: GeneratedTestResponse,
    class_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an Exercise from AI test; class_id optional.
    Stores full test JSON in Exercise.content for later delivery.
    """
    from app.models.exercise import Exercise
    from app.models.classroom import Classroom
    from app.models.user import UserRole

    if class_id:
        classroom = db.query(Classroom).filter(Classroom.id == class_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Không tìm thấy lớp học")
        # permission: teacher must own the class unless admin
        if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and classroom.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Không có quyền tạo bài tập cho lớp này")

    ex = Exercise(
        class_id=class_id,
        title=payload.name,
        description=f"AI generated test with {len(payload.questions)} questions",
        type="test",
        skill_type="mixed",
        max_score=payload.totalPoints,
        content=payload.model_dump(mode='json'),
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return {"id": ex.id, "class_id": ex.class_id, "title": ex.title}


@router.post("/save-from-test")
async def save_from_test_to_bank(
    payload: SaveFromTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save all questions of a generated test into the user's question bank.

    Returns: { saved: int, ids: [int] }
    """
    saved_ids: List[int] = []
    for q in payload.questions:
        try:
            # q may be pydantic object or dict depending on request
            if hasattr(q, 'model_dump'):
                qd = q.model_dump()
            elif isinstance(q, dict):
                qd = q
            else:
                qd = dict(q)
            item = QuestionBankItem(
                owner_id=current_user.id,
                skill_type=qd.get('skill_type'),
                question_type=qd.get('question_type'),
                difficulty=qd.get('difficulty') or "medium",
                topic=qd.get('topic') or payload.name,
                question_text=qd.get('question_text'),
                options_json=json.dumps(qd.get('options') or [], ensure_ascii=False) if qd.get('options') is not None else None,
                correct_answer=str(qd.get('correct_answer')) if qd.get('correct_answer') is not None else None,
                acceptable_answers_json=None,
                media_url=None,
                transcript=qd.get('transcript'),
                passage_text=qd.get('passage_text'),
                passage_url=None,
                writing_type=None,
                word_limit_min=None,
                word_limit_max=None,
                requirements_json=None,
                tags_json=json.dumps(qd.get('tags') or ["saved_from_test"], ensure_ascii=False),
                points=qd.get('points') or 1,
                times_used=0,
            )
            db.add(item)
            db.flush()
            saved_ids.append(item.id)
        except Exception as e:
            print("Skip saving a question due to error:", e)
            continue
    db.commit()
    return {"saved": len(saved_ids), "ids": saved_ids}


@router.post("/save-testset")
async def save_testset(
    payload: SaveFromTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save the whole generated test as a single set in the bank.

    Returns: { id }
    """
    from app.models.question_bank_test import QuestionBankTest
    try:
        test = QuestionBankTest(
            owner_id=current_user.id,
            name=payload.name or "AI Test",
            time_limit=payload.timeLimit,
            total_points=payload.totalPoints,
            skill_distribution_json=json.dumps(getattr(payload, 'skillDistribution', None) or {}, ensure_ascii=False),
            questions_json=json.dumps([(
                q.model_dump() if hasattr(q, 'model_dump') else q
            ) for q in payload.questions], ensure_ascii=False),
        )
        db.add(test)
        db.commit()
        db.refresh(test)
        return {"id": test.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save test set: {e}")


@router.get("/testsets")
async def get_testsets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all saved test sets for the current user.
    
    Returns: List of test sets with metadata
    """
    from app.models.question_bank_test import QuestionBankTest
    try:
        tests = db.query(QuestionBankTest).filter(
            QuestionBankTest.owner_id == current_user.id
        ).order_by(QuestionBankTest.created_at.desc()).all()
        
        results = []
        for test in tests:
            try:
                questions = json.loads(test.questions_json) if test.questions_json else []
                skill_dist = json.loads(test.skill_distribution_json) if test.skill_distribution_json else {}
            except Exception:
                questions = []
                skill_dist = {}
            
            results.append({
                "id": test.id,
                "name": test.name,
                "timeLimit": test.time_limit,
                "totalPoints": test.total_points,
                "questionCount": len(questions),
                "skillDistribution": skill_dist,
                "createdAt": test.created_at.isoformat() if test.created_at else None,
            })
        
        return {"testsets": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch test sets: {e}")


@router.get("/testsets/{test_id}")
async def get_testset_detail(
    test_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed test set including all questions.
    
    Returns: Complete test set with questions
    """
    from app.models.question_bank_test import QuestionBankTest
    try:
        test = db.query(QuestionBankTest).filter(
            QuestionBankTest.id == test_id,
            QuestionBankTest.owner_id == current_user.id
        ).first()
        
        if not test:
            raise HTTPException(status_code=404, detail="Test set not found")
        
        try:
            questions = json.loads(test.questions_json) if test.questions_json else []
            skill_dist = json.loads(test.skill_distribution_json) if test.skill_distribution_json else {}
        except Exception:
            questions = []
            skill_dist = {}
        
        return {
            "id": test.id,
            "name": test.name,
            "timeLimit": test.time_limit,
            "totalPoints": test.total_points,
            "skillDistribution": skill_dist,
            "questions": questions,
            "createdAt": test.created_at.isoformat() if test.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch test set: {e}")


@router.delete("/testsets/{test_id}")
async def delete_testset(
    test_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a test set.
    
    Returns: Success message
    """
    from app.models.question_bank_test import QuestionBankTest
    try:
        test = db.query(QuestionBankTest).filter(
            QuestionBankTest.id == test_id,
            QuestionBankTest.owner_id == current_user.id
        ).first()
        
        if not test:
            raise HTTPException(status_code=404, detail="Test set not found")
        
        db.delete(test)
        db.commit()
        return {"message": "Test set deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete test set: {e}")
