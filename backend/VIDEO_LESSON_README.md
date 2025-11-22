# PowerPoint to Video Lesson Generator

Comprehensive system for converting PowerPoint presentations into narrated video lessons using AI-generated scripts and Azure Text-to-Speech.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Frontend Components](#frontend-components)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This feature enables teachers to:
1. Upload PowerPoint presentations (.ppt/.pptx)
2. Automatically extract slide content and speaker notes
3. Generate AI narration scripts using GPT-4 (optional)
4. Convert text to natural speech using Azure Cognitive Services
5. Create video lessons combining slides and audio
6. Track generation progress in real-time
7. Download and share completed videos

**Processing Flow:**
```
PPT Upload → Slide Extraction → Script Generation → Text-to-Speech → Video Creation → Video Merge → Completion
```

---

## ✨ Features

### Backend Features
- **Cross-platform PPT Export**: Works on Windows (win32com), Linux/Mac (LibreOffice)
- **AI Script Generation**: GPT-4 generates natural narration from slide content
- **Azure TTS Integration**: High-quality Vietnamese and English voices
- **Async Processing**: Celery background tasks for non-blocking operations
- **Status Tracking**: Real-time status updates (pending/processing/completed/failed)
- **Database Persistence**: Full video metadata stored in PostgreSQL
- **Error Handling**: Comprehensive error logging and recovery

### Frontend Features
- **Drag-and-Drop Upload**: Intuitive file upload interface
- **Voice Customization**: Choose from multiple Azure voices
- **Speech Controls**: Adjust rate (-50% to +100%) and pitch (-50% to +50%)
- **Real-time Progress**: Progress bar during upload and processing
- **Status Dashboard**: Monitor video generation status
- **Video Player**: Built-in player for completed videos
- **Download Support**: Download videos for offline use

---

## 🏗️ Architecture

### Backend Components

#### 1. **PPT Exporter** (`backend/app/utils/ppt_exporter.py`)
```python
# Cross-platform slide extraction
ppt_exporter.export_slides(ppt_path, output_dir)
```
- **Windows**: Uses `win32com` for PowerPoint automation (fastest)
- **Linux/Mac**: Uses LibreOffice CLI or PyMuPDF
- **Output**: PNG images at 1920x1080 (customizable)

#### 2. **PPT Video Service** (`backend/app/services/ppt_video_service.py`)
Core service with 6 main methods:
- `extract_slides()`: Parse PPT and export slide images
- `generate_script_for_slide()`: AI narration generation
- `text_to_speech_azure()`: Convert text to WAV audio
- `create_video_segment()`: Merge image + audio → MP4
- `merge_video_segments()`: Concatenate all segments
- `check_dependencies()`: Validate required packages

#### 3. **Celery Tasks** (`backend/app/tasks/video_tasks.py`)
Async task: `process_ppt_to_video`
- Runs in background worker
- Updates database status throughout process
- Handles errors gracefully

#### 4. **API Router** (`backend/app/routers/video_lessons.py`)
RESTful endpoints:
- `POST /api/v1/video-lessons/generate-from-ppt`: Upload and start generation
- `GET /api/v1/video-lessons/{id}`: Get video details and status
- `GET /api/v1/video-lessons/`: List all videos for teacher

#### 5. **Database Model** (`backend/app/models/video_lesson.py`)
```python
class VideoLesson:
    id: int
    lesson_id: Optional[int]
    teacher_id: int
    title: str
    video_url: Optional[str]
    ppt_file_path: str
    slides_count: Optional[int]
    duration_seconds: Optional[int]
    status: str  # pending/processing/completed/failed
    voice_type: str
    language: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
```

### Frontend Components

#### 1. **VideoLessonCreator** (`frontend/src/pages/Teacher/VideoLessonCreator/VideoLessonCreator.jsx`)
- File upload with drag-and-drop
- Voice and speech settings
- Form validation
- Upload progress indicator

#### 2. **VideoLessonViewer** (`frontend/src/pages/Teacher/VideoLessonCreator/VideoLessonViewer.jsx`)
- Video player for completed lessons
- Real-time status polling
- Error display
- Download functionality

#### 3. **VideoLessonList** (`frontend/src/pages/Teacher/VideoLessonCreator/VideoLessonList.jsx`)
- Grid view of all videos
- Status badges
- Pagination
- Quick navigation

#### 4. **API Service** (`frontend/src/api/videoLessons.js`)
```javascript
videoLessonAPI.generateFromPPT(formData)
videoLessonAPI.getVideoLesson(videoId)
videoLessonAPI.listVideoLessons({ skip, limit })
videoLessonAPI.pollVideoStatus(videoId, interval, maxAttempts)
```

---

## 📦 Installation

### 1. Backend Dependencies

Add to `backend/requirements.txt`:
```bash
celery==5.3.4
python-pptx==0.6.23
moviepy==1.0.3
pywin32==306  # Windows only
```

Install:
```bash
cd backend
pip install -r requirements.txt
```

### 2. System Dependencies

**Windows:**
```powershell
# pywin32 is sufficient for PPT export
pip install pywin32
```

**Linux/Ubuntu:**
```bash
# Install LibreOffice for PPT export
sudo apt-get update
sudo apt-get install -y libreoffice-core libreoffice-writer

# OR install poppler-utils for PDF conversion
sudo apt-get install -y poppler-utils

# OR install PyMuPDF
pip install PyMuPDF
```

**macOS:**
```bash
# Install LibreOffice
brew install --cask libreoffice

# OR install poppler
brew install poppler
```

### 3. Environment Variables

Add to `.env`:
```env
# Azure Speech Services (required)
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=eastus

# OpenAI (required for AI script generation)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Redis (required for Celery)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0
```

### 4. Run Database Migration

```bash
cd backend
alembic upgrade head
```

### 5. Start Services

**Using Docker Compose (Recommended):**
```bash
docker-compose up -d
```

This starts:
- `backend` (FastAPI on :8000)
- `celery_worker` (background processing)
- `redis` (message broker)
- `db` (PostgreSQL)
- `frontend` (React on :80)

**Manual Start:**
```bash
# Terminal 1: Backend
cd backend
uvicorn main:app --reload

# Terminal 2: Celery Worker
cd backend
celery -A celery_app worker --loglevel=info --concurrency=2

# Terminal 3: Frontend
cd frontend
npm run dev
```

---

## 🚀 Usage

### For Teachers

#### 1. Create Video from PowerPoint

1. Navigate to **Video Lessons** section
2. Click **"Tạo video mới"** (Create new video)
3. **Upload PowerPoint:**
   - Drag-and-drop .ppt/.pptx file
   - Or click to browse
   - Max size: 50MB

4. **Configure Settings:**
   - **Title**: Enter video title (required)
   - **Lesson ID**: Link to existing lesson (optional)
   - **Voice**: Choose narrator voice (Vietnamese/English)
   - **Speech Rate**: -50% (slow) to +100% (fast)
   - **Speech Pitch**: -50% (low) to +50% (high)
   - **Language**: Script language (Vietnamese/English)
   - **Auto-generate**: Use AI for slides without notes

5. **Submit**: Click **"Tạo Video Bài Giảng"**

6. **Track Progress**: 
   - System returns immediately with video ID
   - Status: pending → processing → completed/failed
   - Refresh page to see updated status

#### 2. View Video

1. Go to **Video Lessons** list
2. Click on video card
3. View details:
   - Processing status
   - Slide count
   - Duration
   - Voice settings
4. **Play completed videos** directly in browser
5. **Download** for offline use

### For Developers

#### Using API Directly

**Upload PowerPoint:**
```bash
curl -X POST "http://localhost:8000/api/v1/video-lessons/generate-from-ppt" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@presentation.pptx" \
  -F "title=My Lesson" \
  -F "voice_type=vi-VN-HoaiMyNeural" \
  -F "speech_rate=0%" \
  -F "speech_pitch=0%" \
  -F "language=vi" \
  -F "auto_generate_script=true"
```

**Check Status:**
```bash
curl -X GET "http://localhost:8000/api/v1/video-lessons/123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": 123,
  "title": "My Lesson",
  "status": "completed",
  "video_url": "/media/video_lessons/123/final_video.mp4",
  "slides_count": 10,
  "duration_seconds": 180,
  "created_at": "2025-06-01T10:00:00"
}
```

---

## 🔌 API Endpoints

### `POST /api/v1/video-lessons/generate-from-ppt`

**Description:** Upload PowerPoint and start video generation

**Authorization:** Required (Teacher/Admin)

**Request:**
- `file`: PowerPoint file (multipart/form-data)
- `title`: Video title (string, required)
- `lesson_id`: Optional lesson ID (integer)
- `voice_type`: Azure voice name (default: "vi-VN-HoaiMyNeural")
- `speech_rate`: Speech rate (default: "0%")
- `speech_pitch`: Speech pitch (default: "0%")
- `language`: Script language (default: "vi")
- `auto_generate_script`: Auto-generate scripts (boolean, default: true)

**Response:** `202 Accepted`
```json
{
  "id": 123,
  "status": "pending",
  "title": "My Lesson",
  "created_at": "2025-06-01T10:00:00"
}
```

### `GET /api/v1/video-lessons/{video_id}`

**Description:** Get video lesson details and status

**Authorization:** Required (Teacher who created it or Admin)

**Response:** `200 OK`
```json
{
  "id": 123,
  "lesson_id": null,
  "teacher_id": 456,
  "title": "My Lesson",
  "video_url": "/media/video_lessons/123/final_video.mp4",
  "status": "completed",
  "slides_count": 10,
  "duration_seconds": 180,
  "voice_type": "vi-VN-HoaiMyNeural",
  "language": "vi",
  "error_message": null,
  "created_at": "2025-06-01T10:00:00",
  "completed_at": "2025-06-01T10:05:30"
}
```

### `GET /api/v1/video-lessons/`

**Description:** List all video lessons for current teacher

**Authorization:** Required (Teacher/Admin)

**Query Parameters:**
- `skip`: Offset for pagination (default: 0)
- `limit`: Max results (default: 50)

**Response:** `200 OK`
```json
[
  {
    "id": 123,
    "title": "Lesson 1",
    "status": "completed",
    "slides_count": 10,
    "duration_seconds": 180,
    "created_at": "2025-06-01T10:00:00"
  },
  {
    "id": 124,
    "title": "Lesson 2",
    "status": "processing",
    "slides_count": 8,
    "duration_seconds": null,
    "created_at": "2025-06-01T11:00:00"
  }
]
```

---

## 🎨 Frontend Components

### VideoLessonCreator

**Location:** `frontend/src/pages/Teacher/VideoLessonCreator/VideoLessonCreator.jsx`

**Features:**
- Drag-and-drop file upload
- File validation (type, size)
- Voice selection dropdown
- Speech rate/pitch sliders
- Auto-generate script toggle
- Upload progress bar
- Error handling

**Usage:**
```jsx
import { VideoLessonCreator } from '@/pages/Teacher/VideoLessonCreator';

<VideoLessonCreator />
```

### VideoLessonViewer

**Location:** `frontend/src/pages/Teacher/VideoLessonCreator/VideoLessonViewer.jsx`

**Features:**
- Video player for completed lessons
- Status badge (pending/processing/completed/failed)
- Real-time status polling
- Video metadata display
- Download button
- Error display

**Usage:**
```jsx
import { VideoLessonViewer } from '@/pages/Teacher/VideoLessonCreator';

<VideoLessonViewer /> // Uses videoId from route params
```

### VideoLessonList

**Location:** `frontend/src/pages/Teacher/VideoLessonCreator/VideoLessonList.jsx`

**Features:**
- Grid layout with video cards
- Status indicators
- Quick navigation
- Pagination
- Empty state
- Create new button

**Usage:**
```jsx
import { VideoLessonList } from '@/pages/Teacher/VideoLessonCreator';

<VideoLessonList />
```

---

## ⚙️ Configuration

### Azure Voice Options

Available voices in `VideoLessonCreator.jsx`:

| Voice Name | Language | Gender | Region |
|-----------|----------|--------|--------|
| `vi-VN-HoaiMyNeural` | Vietnamese | Female | Vietnam |
| `vi-VN-NamMinhNeural` | Vietnamese | Male | Vietnam |
| `en-US-JennyNeural` | English (US) | Female | USA |
| `en-US-GuyNeural` | English (US) | Male | USA |
| `en-GB-SoniaNeural` | English (UK) | Female | UK |
| `en-GB-RyanNeural` | English (UK) | Male | UK |

**Add more voices:**
```javascript
const voices = [
  { value: 'vi-VN-HoaiMyNeural', label: 'Hoài My (Nữ)', gender: 'female' },
  // Add your custom voice here
  { value: 'custom-voice-name', label: 'Display Name', gender: 'female' },
];
```

Full list: [Azure Speech Services Voices](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt)

### Video Quality Settings

Edit `backend/app/services/ppt_video_service.py`:

```python
# Image resolution
slide.Export(output_file, "PNG", 1920, 1080)  # Change to 3840x2160 for 4K

# Video codec
video_clip.write_videofile(
    output_path,
    codec='libx264',      # H.264 (change to 'libx265' for H.265/HEVC)
    audio_codec='aac',
    fps=24,               # Frames per second (24/30/60)
    preset='medium',      # Encoding speed (ultrafast/fast/medium/slow/veryslow)
    bitrate='5000k'       # Video bitrate (higher = better quality)
)
```

### Celery Worker Configuration

Edit `backend/celery_app.py`:

```python
celery_app.conf.update(
    task_time_limit=7200,         # Max 2 hours per task
    task_soft_time_limit=6900,    # Soft limit at 1h55m
    worker_concurrency=4,         # Number of parallel tasks
    worker_prefetch_multiplier=1, # Tasks per worker
)
```

Or set via environment:
```bash
celery -A celery_app worker --loglevel=info --concurrency=4
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **"Missing required packages" Error**

**Symptom:** ImportError on backend startup

**Solution:**
```bash
cd backend
pip install python-pptx moviepy celery azure-cognitiveservices-speech
```

#### 2. **"Could not export PowerPoint slides" Error**

**Windows:**
```powershell
# Install pywin32
pip install pywin32

# OR install LibreOffice
# Download from: https://www.libreoffice.org/download/download/
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y libreoffice-core poppler-utils
```

#### 3. **Celery Worker Not Starting**

**Check Redis:**
```bash
docker-compose logs redis
redis-cli ping  # Should return "PONG"
```

**Restart Worker:**
```bash
docker-compose restart celery_worker
docker-compose logs -f celery_worker
```

#### 4. **Video Generation Stuck in "Processing"**

**Check Celery Logs:**
```bash
docker-compose logs -f celery_worker
```

**Common causes:**
- Azure Speech key invalid/expired
- OpenAI API key missing
- Insufficient disk space
- FFmpeg not installed

**Manual FFmpeg Install:**
```bash
# Ubuntu
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows (via Chocolatey)
choco install ffmpeg
```

#### 5. **"Speech synthesis canceled" Error**

**Symptoms:** Audio generation fails

**Check:**
1. Azure Speech credentials in `.env`
2. Network connectivity to Azure
3. Voice name is valid
4. Region matches your Azure resource

**Test Azure TTS:**
```python
import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(
    subscription="YOUR_KEY",
    region="eastus"
)
speech_config.speech_synthesis_voice_name = "vi-VN-HoaiMyNeural"

synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)
result = synthesizer.speak_text_async("Xin chào").get()

if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
    print("Success!")
else:
    print(f"Error: {result.cancellation_details.error_details}")
```

#### 6. **Frontend Upload Fails with 401/403**

**Symptoms:** Authorization error

**Check:**
1. User is logged in
2. User has TEACHER role
3. JWT token is valid
4. API endpoint URL is correct

**Debug:**
```javascript
// Check token in browser console
localStorage.getItem('token')

// Check user role
const user = JSON.parse(localStorage.getItem('user'))
console.log(user.role)  // Should be 'TEACHER'
```

---

## 📊 Performance Optimization

### 1. **Increase Celery Workers**

For faster parallel processing:
```yaml
# docker-compose.yml
celery_worker:
  command: celery -A celery_app worker --loglevel=info --concurrency=4
  deploy:
    replicas: 2  # Run 2 worker containers
```

### 2. **Use SSD for Media Storage**

Mount fast storage for video files:
```yaml
volumes:
  - /path/to/fast/ssd:/app/media
```

### 3. **Cache PPT Exports**

Avoid re-exporting if slides unchanged:
```python
# In extract_slides()
cache_key = hashlib.md5(open(ppt_path, 'rb').read()).hexdigest()
cached_dir = f"media/cache/{cache_key}"
if os.path.exists(cached_dir):
    return load_cached_slides(cached_dir)
```

### 4. **GPU Acceleration (Advanced)**

Use GPU for faster video encoding:
```python
# Install NVIDIA CUDA toolkit and ffmpeg with NVENC
video_clip.write_videofile(
    output_path,
    codec='h264_nvenc',  # NVIDIA GPU encoder
    preset='fast',
    fps=30
)
```

---

## 📝 Future Enhancements

- [ ] Support for video backgrounds (not just slides)
- [ ] Slide transitions and animations
- [ ] Background music options
- [ ] Multiple language tracks
- [ ] Subtitle generation (SRT export)
- [ ] Thumbnail customization
- [ ] Video editing (trim, crop, add intro/outro)
- [ ] Batch processing (multiple PPTs at once)
- [ ] Progress webhooks for real-time updates
- [ ] Integration with learning management system

---

## 📄 License

MIT License - See `LICENSE` file for details

---

## 👥 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Celery logs: `docker-compose logs -f celery_worker`
3. Check backend logs: `docker-compose logs -f backend`
4. Open GitHub issue with logs and error details

---

## 📚 References

- [Azure Speech Services](https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/)
- [OpenAI API](https://platform.openai.com/docs/api-reference)
- [Celery Documentation](https://docs.celeryproject.org/)
- [MoviePy Guide](https://zulko.github.io/moviepy/)
- [python-pptx Documentation](https://python-pptx.readthedocs.io/)
