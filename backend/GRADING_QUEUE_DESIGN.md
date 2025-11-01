# Auto-Grading Queue System Design

**Date:** November 1, 2025  
**Purpose:** Queue-based auto-grading with teacher review workflow

---

## 📋 Overview

### Current Flow (Before):
```
Student submits → Auto-grade immediately → Show results to student
```

### New Flow (After):
```
Student submits → Add to queue → Background auto-grade → Store results (hidden)
                                                              ↓
                                   Teacher reviews → Approve/Edit → Show to student
```

---

## 🗄️ Database Schema Changes

### 1. New Table: `grading_queue`

```sql
CREATE TABLE grading_queue (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id),
    student_id INTEGER REFERENCES users(id),
    class_id INTEGER,
    
    -- Queue status
    status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
    priority INTEGER DEFAULT 0,  -- Higher = process first
    
    -- Processing info
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_queue_status ON grading_queue(status, priority DESC, created_at);
CREATE INDEX idx_queue_submission ON grading_queue(submission_id);
```

**Status values:**
- `pending` - Chờ xử lý
- `processing` - Đang chấm
- `completed` - Đã chấm xong
- `failed` - Lỗi (sau max_attempts)

### 2. Update Table: `submissions`

```sql
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS grading_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_reviewed_at TIMESTAMP;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_reviewed_by INTEGER REFERENCES users(id);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS original_ai_score DECIMAL(5,2);  -- AI score trước khi teacher chỉnh
```

**Grading Status values:**
- `pending` - Chưa chấm
- `grading` - Đang chấm bởi AI
- `ai_graded` - AI đã chấm (chờ teacher review)
- `reviewed` - Teacher đã review
- `failed` - Lỗi khi chấm

---

## 🔄 Workflow Details

### 1. Student Submits Exercise

**Endpoint:** `POST /api/v1/exercises/{exercise_id}/submit`

```python
async def submit_exercise(exercise_id, submission_data):
    # 1. Create submission record
    submission = create_submission(
        exercise_id=exercise_id,
        student_id=current_user.id,
        answers=submission_data.answers,
        grading_status='pending',
        teacher_reviewed=False
    )
    
    # 2. Add to grading queue
    queue_item = add_to_queue(
        submission_id=submission.id,
        priority=calculate_priority(exercise_id)  # e.g., exam = higher priority
    )
    
    # 3. Return submission ID (no results yet)
    return {
        "submission_id": submission.id,
        "status": "submitted",
        "message": "Bài làm đã được nộp. Đang chờ chấm điểm..."
    }
```

**Response to student:**
```json
{
    "submission_id": 123,
    "status": "submitted",
    "grading_status": "pending",
    "message": "Bài làm đã được nộp. Giáo viên sẽ chấm và công bố điểm sớm.",
    "estimated_time": "30 phút"
}
```

### 2. Background Grading Worker

**Service:** `GradingQueueService`

```python
class GradingQueueService:
    
    async def process_queue(self):
        """Main worker loop - runs continuously"""
        while True:
            # Get next pending item
            queue_item = await self.get_next_pending()
            
            if queue_item:
                await self.process_item(queue_item)
            else:
                await asyncio.sleep(5)  # Wait 5s if queue empty
    
    async def process_item(self, queue_item):
        try:
            # Update status
            await self.update_status(queue_item.id, 'processing')
            
            # Get submission and exercise
            submission = await get_submission(queue_item.submission_id)
            exercise = await get_exercise(queue_item.exercise_id)
            
            # Auto-grade using AIGradingService
            result = await ai_grading_service.grade_comprehensive_submission(
                exercise_content=exercise.content,
                student_answers=submission.answers,
                audio_file_path=submission.audio_file_path
            )
            
            # Store results (hidden from student)
            await update_submission(
                submission_id=submission.id,
                score=result['total_score'],
                max_score=result['max_score'],
                feedback=result,
                grading_status='ai_graded',
                original_ai_score=result['total_score']
            )
            
            # Mark queue item as completed
            await self.update_status(queue_item.id, 'completed')
            
        except Exception as e:
            # Retry logic
            queue_item.attempts += 1
            if queue_item.attempts >= queue_item.max_attempts:
                await self.update_status(queue_item.id, 'failed', str(e))
            else:
                await self.update_status(queue_item.id, 'pending')  # Retry
```

**Priority calculation:**
```python
def calculate_priority(exercise_id, submission_type):
    # Exam submissions = highest priority
    if submission_type == 'exam':
        return 100
    # Regular exercises
    elif submission_type == 'exercise':
        return 50
    # Practice/homework
    else:
        return 10
```

### 3. Teacher Review Interface

**Endpoint:** `GET /api/v1/teacher/submissions/pending-review`

```python
async def get_pending_reviews(teacher_id):
    """Get all AI-graded submissions waiting for teacher review"""
    submissions = db.query(Submission).filter(
        Submission.grading_status == 'ai_graded',
        Submission.teacher_reviewed == False,
        Submission.class_id.in_(teacher_classes)
    ).order_by(Submission.submitted_at.desc()).all()
    
    return {
        "total": len(submissions),
        "submissions": [
            {
                "id": sub.id,
                "student_name": sub.student.name,
                "exercise_title": sub.exercise.title,
                "submitted_at": sub.submitted_at,
                "ai_score": sub.score,
                "max_score": sub.max_score,
                "grading_status": "ai_graded"
            }
            for sub in submissions
        ]
    }
```

**Endpoint:** `GET /api/v1/teacher/submissions/{submission_id}/details`

```python
async def get_submission_details(submission_id):
    """Get full submission with AI grading results for teacher review"""
    submission = get_submission(submission_id)
    
    return {
        "submission_id": submission.id,
        "student": submission.student,
        "exercise": submission.exercise,
        "answers": submission.answers,
        "ai_results": {
            "score": submission.score,
            "max_score": submission.max_score,
            "feedback": submission.feedback,
            "breakdown": submission.grading_breakdown
        },
        "teacher_can_edit": True,
        "status": "ai_graded"
    }
```

**Endpoint:** `POST /api/v1/teacher/submissions/{submission_id}/review`

```python
async def review_submission(submission_id, review_data):
    """Teacher reviews and approves/modifies grading"""
    
    # Update submission
    submission = update_submission(
        submission_id=submission_id,
        score=review_data.final_score,  # Teacher can modify
        feedback=review_data.feedback,  # Teacher can add notes
        teacher_reviewed=True,
        teacher_reviewed_at=datetime.now(),
        teacher_reviewed_by=current_teacher.id,
        teacher_notes=review_data.notes,
        grading_status='reviewed'
    )
    
    # Send notification to student
    await notify_student(
        student_id=submission.student_id,
        message=f"Bài làm '{submission.exercise.title}' đã được chấm điểm"
    )
    
    return {
        "status": "reviewed",
        "message": "Đã duyệt bài chấm",
        "final_score": submission.score
    }
```

**Request body:**
```json
{
    "final_score": 8.5,
    "feedback": {
        "listening": {...},
        "reading": {...},
        "writing": {
            "points_earned": 2.0,
            "teacher_comment": "Bài viết tốt, grammar cần cải thiện"
        },
        "speaking": {...}
    },
    "teacher_notes": "Học sinh cố gắng, cần luyện thêm listening",
    "approve": true
}
```

### 4. Student View Results

**Endpoint:** `GET /api/v1/students/submissions/{submission_id}/results`

```python
async def get_submission_results(submission_id, current_user):
    """Student can only see results after teacher review"""
    submission = get_submission(submission_id)
    
    # Security check
    if submission.student_id != current_user.id:
        raise HTTPException(403, "Not your submission")
    
    # Check if reviewed
    if not submission.teacher_reviewed:
        return {
            "status": "grading",
            "message": "Bài làm đang được chấm điểm. Vui lòng đợi giáo viên duyệt.",
            "grading_status": submission.grading_status,
            "submitted_at": submission.submitted_at
        }
    
    # Return full results
    return {
        "status": "reviewed",
        "score": submission.score,
        "max_score": submission.max_score,
        "feedback": submission.feedback,
        "reviewed_at": submission.teacher_reviewed_at,
        "teacher_notes": submission.teacher_notes  # Optional
    }
```

**Response when NOT reviewed yet:**
```json
{
    "status": "grading",
    "grading_status": "ai_graded",
    "message": "Bài làm đang được giáo viên duyệt. Vui lòng đợi.",
    "submitted_at": "2025-11-01T10:30:00Z",
    "estimated_completion": "2025-11-01T15:00:00Z"
}
```

**Response when reviewed:**
```json
{
    "status": "reviewed",
    "score": 8.5,
    "max_score": 10.0,
    "percentage": 85,
    "feedback": {
        "listening": {...},
        "reading": {...},
        "writing": {...},
        "speaking": {...}
    },
    "reviewed_at": "2025-11-01T14:00:00Z",
    "teacher_notes": "Bài làm tốt, cần luyện thêm listening"
}
```

---

## 🚀 Background Worker Implementation

### Option 1: APScheduler (Simple, in-process)

```python
# backend/main.py

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.grading_queue_service import GradingQueueService

scheduler = AsyncIOScheduler()
grading_service = GradingQueueService()

@app.on_event("startup")
async def startup_event():
    # Start background grading worker
    scheduler.add_job(
        grading_service.process_queue,
        'interval',
        seconds=10,  # Check queue every 10 seconds
        id='grading_queue_worker'
    )
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
```

**Pros:**
- ✅ Simple setup
- ✅ No external dependencies
- ✅ Good for small-medium scale

**Cons:**
- ⚠️ Single worker (no horizontal scaling)
- ⚠️ Stops when server restarts

### Option 2: Celery (Production-grade)

```python
# backend/celery_app.py

from celery import Celery
from app.services.grading_queue_service import GradingQueueService

celery = Celery('grading_tasks', broker='redis://localhost:6379/0')

@celery.task
def process_grading_queue():
    service = GradingQueueService()
    asyncio.run(service.process_next_pending())

# Run worker
# celery -A backend.celery_app worker --loglevel=info
```

**Pros:**
- ✅ Distributed workers
- ✅ Retry logic
- ✅ Monitoring tools

**Cons:**
- ⚠️ Requires Redis/RabbitMQ
- ⚠️ More complex setup

**Recommendation:** Start with APScheduler, migrate to Celery if needed.

---

## 📊 API Summary

### Student APIs:
- `POST /api/v1/exercises/{id}/submit` - Submit exercise (adds to queue)
- `GET /api/v1/submissions/{id}/results` - View results (only if reviewed)
- `GET /api/v1/submissions/{id}/status` - Check grading status

### Teacher APIs:
- `GET /api/v1/teacher/submissions/pending-review` - List submissions waiting for review
- `GET /api/v1/teacher/submissions/{id}/details` - View AI grading results
- `POST /api/v1/teacher/submissions/{id}/review` - Approve/edit and publish results
- `PUT /api/v1/teacher/submissions/{id}/score` - Quick score edit
- `GET /api/v1/teacher/grading-queue/stats` - Queue statistics

### Admin APIs:
- `GET /api/v1/admin/grading-queue` - Monitor queue
- `POST /api/v1/admin/grading-queue/{id}/retry` - Retry failed item
- `DELETE /api/v1/admin/grading-queue/{id}` - Remove from queue

---

## 🔔 Notifications

### When to notify:

1. **Student submission accepted:**
   - "Bài làm đã được nộp thành công. Đang chờ chấm điểm."

2. **AI grading completed (Teacher only):**
   - "Bài làm của [Student] đã được AI chấm xong. Cần duyệt."

3. **Teacher reviewed (Student):**
   - "Bài làm '[Exercise]' đã được giáo viên chấm điểm."

4. **Grading failed (Admin):**
   - "Lỗi khi chấm bài của [Student] - [Exercise]"

---

## 🛡️ Security & Permissions

### Student:
- ✅ Can submit exercise
- ✅ Can view own submission status
- ❌ Cannot see results until teacher_reviewed = True
- ❌ Cannot see AI score before teacher review

### Teacher:
- ✅ Can see all submissions in their classes
- ✅ Can see AI grading results
- ✅ Can edit scores and feedback
- ✅ Can approve and publish results

### Admin:
- ✅ All teacher permissions
- ✅ Can monitor queue
- ✅ Can retry failed items
- ✅ Can see all classes

---

## 📈 Performance Considerations

### Queue Processing:
- Process items in batches if needed
- Use database connection pooling
- Limit concurrent grading (e.g., 5 at a time)

### Database Indexes:
```sql
CREATE INDEX idx_submissions_grading_status ON submissions(grading_status);
CREATE INDEX idx_submissions_teacher_reviewed ON submissions(teacher_reviewed);
CREATE INDEX idx_queue_status_priority ON grading_queue(status, priority DESC);
```

### Caching:
- Cache exercise content to avoid repeated DB queries
- Cache AI model responses if similar questions

---

## 🧪 Testing Strategy

### Unit Tests:
- `test_queue_service.py` - Queue operations
- `test_grading_worker.py` - Background worker
- `test_teacher_review.py` - Review workflow

### Integration Tests:
- Submit → Queue → Grade → Review → View (full flow)
- Failed grading retry logic
- Concurrent submissions

### Load Tests:
- 100 concurrent submissions
- Queue processing speed
- Teacher review UI performance

---

## 📋 Migration Steps

### Phase 1: Database (This PR)
1. Create grading_queue table
2. Add columns to submissions table
3. Create indexes
4. Test migration rollback

### Phase 2: Backend Services
1. Implement GradingQueueService
2. Update submission API
3. Add teacher review APIs
4. Setup background worker

### Phase 3: Frontend Updates
1. Update submission UI (show "grading" status)
2. Create teacher review dashboard
3. Update student results view
4. Add notifications

### Phase 4: Testing & Deployment
1. QA testing
2. Deploy to staging
3. Monitor queue performance
4. Deploy to production

---

## 🚨 Edge Cases to Handle

1. **Submission while grading:**
   - Block duplicate submissions for same exercise

2. **Student deletes submission before review:**
   - Cascade delete queue item

3. **Teacher leaves mid-review:**
   - Save draft reviews (optional)

4. **Queue item stuck in "processing":**
   - Timeout after 10 minutes → reset to pending

5. **Server restart during grading:**
   - Reset "processing" items to "pending" on startup

6. **AI service down:**
   - Retry with exponential backoff
   - Alert admin after max attempts

---

## 💡 Future Enhancements

### Short-term:
- [ ] Batch grading for multiple submissions
- [ ] Teacher can assign grading to specific teachers
- [ ] Email notifications for students

### Long-term:
- [ ] Auto-approve for simple exercises (if AI confidence > 95%)
- [ ] ML model to predict which submissions need human review
- [ ] Analytics: average grading time, accuracy metrics
- [ ] Peer review (students review each other before teacher)

---

## 📚 References

- Current grading: `backend/app/services/ai_grading_service.py`
- Submission model: `backend/app/models/submission.py`
- Exercise router: `backend/app/routers/exercises.py`
- APScheduler docs: https://apscheduler.readthedocs.io/

---

**Status:** 📋 Design Complete - Ready for Review

**Next Step:** Review design → Create Alembic migration → Implement services
