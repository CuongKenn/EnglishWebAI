"""
PowerPoint to Video Service
Convert PPT slides to video with AI-generated narration
"""
import logging
import os

try:
    from pptx import Presentation
    from pptx.util import Inches  # noqa: F401
    HAS_PPTX = True
except ImportError:
    HAS_PPTX = False

try:
    from PIL import Image  # noqa: F401
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import azure.cognitiveservices.speech as speechsdk
    HAS_AZURE_SPEECH = True
except ImportError:
    HAS_AZURE_SPEECH = False

try:
    from moviepy.editor import AudioFileClip, ImageClip, VideoFileClip, concatenate_videoclips
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False

from app.core.config import settings
from app.services.openai_service import openai_service
from app.utils.ppt_exporter import ppt_exporter

logger = logging.getLogger(__name__)


class PPTVideoService:
    """Service for converting PowerPoint to video with AI narration"""

    @staticmethod
    def check_dependencies():
        """Check if required libraries are installed"""
        missing = []
        if not HAS_PPTX:
            missing.append("python-pptx")
        if not HAS_PIL:
            missing.append("Pillow")
        if not HAS_AZURE_SPEECH:
            missing.append("azure-cognitiveservices-speech")
        if not HAS_MOVIEPY:
            missing.append("moviepy")

        if missing:
            raise ImportError(
                f"Missing required packages: {', '.join(missing)}. "
                f"Install with: pip install {' '.join(missing)}"
            )

    @staticmethod
    def extract_slides(ppt_path: str, output_dir: str) -> list[dict]:
        """
        Extract slides from PowerPoint as images and text

        Returns:
            List of dicts with 'image_path', 'notes', 'content'
        """
        PPTVideoService.check_dependencies()

        prs = Presentation(ppt_path)
        slides_data = []

        os.makedirs(output_dir, exist_ok=True)

        # Export slides to images using PPTExporter
        try:
            logger.info(f"Exporting slides from {ppt_path} to {output_dir}")
            image_paths = ppt_exporter.export_slides(ppt_path, output_dir)
            logger.info(f"Exported {len(image_paths)} slide images")
        except Exception as e:
            logger.error(f"Failed to export slides: {e}")
            raise RuntimeError(
                f"Could not export PowerPoint slides to images. "
                f"Make sure pywin32 (Windows) or LibreOffice is installed. Error: {e}"
            ) from e

        for idx, slide in enumerate(prs.slides, 1):
            slide_data = {
                'slide_number': idx,
                'image_path': image_paths[idx - 1] if idx <= len(image_paths) else None,
                'notes': '',
                'content': ''
            }

            # Extract text content from shapes
            text_content = []
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text_content.append(shape.text)
            slide_data['content'] = '\n'.join(text_content)

            # Extract speaker notes
            if slide.has_notes_slide:
                notes_slide = slide.notes_slide
                if notes_slide.notes_text_frame:
                    slide_data['notes'] = notes_slide.notes_text_frame.text

            slides_data.append(slide_data)

        logger.info(f"Extracted {len(slides_data)} slides from {ppt_path}")
        return slides_data

    @staticmethod
    async def generate_script_for_slide(slide_data: dict, language: str = "vi") -> str:
        """
        Generate narration script for a slide using GPT-4

        Args:
            slide_data: Dict with 'content' and 'notes'
            language: Language for script (vi/en)

        Returns:
            Generated script text
        """
        content = slide_data.get('content', '')
        notes = slide_data.get('notes', '')

        # If slide has notes, use them as base
        if notes.strip():
            return notes.strip()

        # Otherwise, generate from content
        if not content.strip():
            return ""

        prompt = f"""
Bạn là giáo viên tiếng Anh chuyên nghiệp. Hãy viết phần thuyết minh (narration) cho slide bài giảng sau.

NỘI DUNG SLIDE:
{content}

YÊU CẦU:
- Viết bằng {'tiếng Việt' if language == 'vi' else 'tiếng Anh'} tự nhiên, dễ hiểu
- Thời lượng khoảng 30-60 giây đọc
- Giải thích rõ ràng các ý chính
- Dùng giọng điệu thân thiện, gần gũi học sinh
- Không cần chào hỏi hay kết thúc, chỉ cần nội dung chính

SCRIPT:
"""

        response = openai_service.generate_content(prompt)
        return response.strip()

    @staticmethod
    def text_to_speech_azure(
        text: str,
        output_path: str,
        voice: str = "vi-VN-HoaiMyNeural",
        rate: str = "0%",
        pitch: str = "0%"
    ) -> bool:
        """
        Convert text to speech using Azure Cognitive Services

        Args:
            text: Text to convert
            output_path: Output audio file path (.wav)
            voice: Azure voice name
            rate: Speech rate (-50% to +100%)
            pitch: Pitch adjustment (-50% to +50%)

        Returns:
            True if successful
        """
        PPTVideoService.check_dependencies()

        if not settings.AZURE_SPEECH_KEY or not settings.AZURE_SPEECH_REGION:
            raise ValueError("Azure Speech credentials not configured")

        # Create speech config
        speech_config = speechsdk.SpeechConfig(
            subscription=settings.AZURE_SPEECH_KEY,
            region=settings.AZURE_SPEECH_REGION
        )

        # Set voice and output format
        speech_config.speech_synthesis_voice_name = voice

        # Create SSML for better control
        ssml = f"""
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">
            <voice name="{voice}">
                <prosody rate="{rate}" pitch="{pitch}">
                    {text}
                </prosody>
            </voice>
        </speak>
        """

        # Set output to file
        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_path)

        # Create synthesizer
        speech_synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=audio_config
        )

        # Synthesize SSML
        result = speech_synthesizer.speak_ssml_async(ssml).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            logger.info(f"Speech synthesized to {output_path}")
            return True
        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            logger.error(f"Speech synthesis canceled: {cancellation.reason}")
            if cancellation.error_details:
                logger.error(f"Error details: {cancellation.error_details}")
            return False

        return False

    @staticmethod
    def create_video_segment(
        image_path: str,
        audio_path: str,
        output_path: str,
        fps: int = 24
    ) -> bool:
        """
        Create video from image + audio

        Args:
            image_path: Path to slide image
            audio_path: Path to narration audio
            output_path: Output video path (.mp4)
            fps: Frames per second

        Returns:
            True if successful
        """
        PPTVideoService.check_dependencies()

        try:
            # Load audio to get duration
            audio_clip = AudioFileClip(audio_path)
            duration = audio_clip.duration

            # Create image clip with same duration as audio
            image_clip = ImageClip(image_path, duration=duration)

            # Set audio
            video_clip = image_clip.set_audio(audio_clip)
            video_clip.fps = fps

            # Write video file
            video_clip.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                fps=fps,
                preset='medium',
                logger=None  # Suppress moviepy logs
            )

            # Close clips
            audio_clip.close()
            video_clip.close()

            logger.info(f"Created video segment: {output_path}")
            return True

        except Exception as e:
            logger.error(f"Error creating video segment: {e}")
            return False

    @staticmethod
    def merge_video_segments(
        segment_paths: list[str],
        output_path: str,
        fps: int = 24
    ) -> bool:
        """
        Merge multiple video segments into one

        Args:
            segment_paths: List of video file paths
            output_path: Final video output path
            fps: Frames per second

        Returns:
            True if successful
        """
        PPTVideoService.check_dependencies()

        try:
            # Load all video clips
            clips = [VideoFileClip(path) for path in segment_paths]

            # Concatenate
            final_clip = concatenate_videoclips(clips, method="compose")
            final_clip.fps = fps

            # Write final video
            final_clip.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                fps=fps,
                preset='medium',
                logger=None
            )

            # Close
            final_clip.close()
            for clip in clips:
                clip.close()

            logger.info(f"Merged video saved to: {output_path}")
            return True

        except Exception as e:
            logger.error(f"Error merging videos: {e}")
            return False


# Convenience wrapper
ppt_video_service = PPTVideoService()
