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
        Create video from image + audio using ffmpeg directly (more reliable)

        Args:
            image_path: Path to slide image
            audio_path: Path to narration audio
            output_path: Output video path (.mp4)
            fps: Frames per second

        Returns:
            True if successful
        """
        import json
        import subprocess

        try:
            # Get audio duration using ffprobe (comes with ffmpeg)
            probe_cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                audio_path
            ]

            probe_result = subprocess.run(
                probe_cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            if probe_result.returncode != 0:
                logger.error(f"ffprobe failed: {probe_result.stderr}")
                return False

            probe_data = json.loads(probe_result.stdout)
            duration = float(probe_data.get('format', {}).get('duration', 0))

            if duration <= 0:
                logger.error(f"Invalid audio duration: {duration}")
                return False

            # Ensure output directory exists and use absolute paths
            import os
            abs_image_path = os.path.abspath(image_path)
            abs_audio_path = os.path.abspath(audio_path)
            abs_output_path = os.path.abspath(output_path)
            os.makedirs(os.path.dirname(abs_output_path), exist_ok=True)

            # Use ffmpeg directly - more reliable than moviepy
            # Scale down to 1920x1080 (Full HD) for faster encoding while maintaining quality
            # Use faster preset to speed up encoding significantly
            cmd = [
                'ffmpeg',
                '-y',  # Overwrite output
                '-loop', '1',  # Loop image
                '-framerate', str(fps),  # Input framerate
                '-i', abs_image_path,  # Input image (absolute path)
                '-i', abs_audio_path,  # Input audio (absolute path)
                '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1',  # Scale to 1920x1080 with padding
                '-c:v', 'libx264',  # Video codec
                '-preset', 'faster',  # Faster encoding (medium is default, faster is 2x speed)
                '-tune', 'stillimage',  # Optimize for still image
                '-c:a', 'aac',  # Audio codec
                '-b:a', '192k',  # Audio bitrate
                '-pix_fmt', 'yuv420p',  # Pixel format for compatibility
                '-shortest',  # Stop when audio ends
                abs_output_path
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # Increase timeout to 10 minutes for safety
            )

            if result.returncode != 0:
                logger.error(f"ffmpeg error: {result.stderr}")
                return False

            logger.info(f"Created video segment: {output_path} ({duration:.1f}s)")
            return True

        except Exception as e:
            logger.error(f"Error creating video segment: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    @staticmethod
    def merge_video_segments(
        segment_paths: list[str],
        output_path: str
    ) -> bool:
        """
        Merge multiple video segments using ffmpeg concat (memory efficient)

        Args:
            segment_paths: List of video file paths
            output_path: Final video output path
            fps: Frames per second

        Returns:
            True if successful
        """
        import subprocess
        import tempfile

        try:
            # Create a temporary file list for ffmpeg concat
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
                concat_file = f.name
                for path in segment_paths:
                    # Use absolute path and escape single quotes
                    abs_path = os.path.abspath(path).replace("'", "'\\''")
                    f.write(f"file '{abs_path}'\n")

            # Use ffmpeg concat demuxer (very memory efficient)
            cmd = [
                'ffmpeg',
                '-f', 'concat',
                '-safe', '0',
                '-i', concat_file,
                '-c', 'copy',  # Copy streams without re-encoding (fast & efficient)
                '-y',  # Overwrite output
                output_path
            ]

            subprocess.run(
                cmd,
                capture_output=True,
                timeout=300,  # 5 minutes max
                check=True
            )

            # Cleanup
            os.unlink(concat_file)

            logger.info(f"Merged video saved to: {output_path}")
            return True

        except subprocess.CalledProcessError as e:
            logger.error(f"ffmpeg concat failed: {e.stderr.decode()}")
            return False
        except Exception as e:
            logger.error(f"Error merging videos: {e}")
            return False


# Convenience wrapper
ppt_video_service = PPTVideoService()
