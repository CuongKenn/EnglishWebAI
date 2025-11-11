"""
Emotion Detection Service using FER (Facial Expression Recognition)
Analyzes facial emotions from images for speaking practice feedback
"""

import base64
import io
import logging
from typing import Any

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class EmotionDetectionService:
    """Service for detecting facial emotions from images"""

    # Emotion feedback messages
    EMOTION_FEEDBACK = {
        "happy": {
            "message": "😊 Great! You look confident and natural!",
            "icon": "😀",
            "color": "green",
        },
        "neutral": {
            "message": "😐 Try to be more expressive when speaking.",
            "icon": "😐",
            "color": "gray",
        },
        "sad": {
            "message": "😔 Keep your energy up — your confidence matters!",
            "icon": "😔",
            "color": "blue",
        },
        "angry": {
            "message": "😠 Relax your expression and speak calmly.",
            "icon": "😠",
            "color": "red",
        },
        "fear": {
            "message": "😨 Don't be afraid — speak more naturally!",
            "icon": "😨",
            "color": "purple",
        },
        "surprise": {
            "message": "😲 You look surprised! Stay calm and focused.",
            "icon": "😲",
            "color": "orange",
        },
        "disgust": {
            "message": "😒 Try to maintain a positive expression.",
            "icon": "😒",
            "color": "yellow",
        },
    }

    @staticmethod
    def _base64_to_image(base64_string: str) -> np.ndarray:
        """
        Convert base64 string to OpenCV image

        Args:
            base64_string: Base64 encoded image (with or without data URI prefix)

        Returns:
            OpenCV image (numpy array)
        """
        try:
            # Remove data URI prefix if present
            if "base64," in base64_string:
                base64_string = base64_string.split("base64,")[1]

            # Decode base64 to bytes
            image_bytes = base64.b64decode(base64_string)

            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))

            # Convert PIL Image to OpenCV format (BGR)
            image_np = np.array(image)

            # Convert RGB to BGR if needed
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

            return image_np

        except Exception as e:
            logger.error(f"Error converting base64 to image: {e}")
            raise ValueError(f"Invalid base64 image: {e}")

    @staticmethod
    def analyze_emotion(base64_image: str) -> dict[str, Any]:
        """
        Analyze emotion from base64 encoded image using FER

        Args:
            base64_image: Base64 encoded image string

        Returns:
            Dictionary with emotion, confidence, and feedback
        """
        try:
            # Import FER here to avoid loading at startup
            from fer import FER

            # Convert base64 to image
            image = EmotionDetectionService._base64_to_image(base64_image)

            # Initialize FER detector
            detector = FER(mtcnn=False)  # Use faster OpenCV detector

            # Detect emotions
            result = detector.detect_emotions(image)

            if not result or len(result) == 0:
                # No face detected
                return {
                    "emotion": "neutral",
                    "confidence": 0.0,
                    "all_emotions": {},
                    "feedback": "No face detected. Please face the camera.",
                    "icon": "👤",
                    "color": "gray",
                    "face_detected": False,
                }

            # Get first face emotions
            face_emotions = result[0]["emotions"]
            
            # Find dominant emotion
            dominant_emotion = max(face_emotions, key=face_emotions.get)
            confidence = face_emotions[dominant_emotion]

            # Get feedback
            feedback = EmotionDetectionService.EMOTION_FEEDBACK.get(
                dominant_emotion,
                {
                    "message": "Keep practicing!",
                    "icon": "🙂",
                    "color": "gray",
                },
            )

            return {
                "emotion": dominant_emotion,
                "confidence": round(confidence, 2),
                "all_emotions": {k: round(v, 2) for k, v in face_emotions.items()},
                "feedback": feedback["message"],
                "icon": feedback["icon"],
                "color": feedback["color"],
                "face_detected": True,
            }

        except ValueError:
            # Re-raise image conversion errors
            raise

        except Exception as e:
            logger.error(f"Error analyzing emotion: {e}")

            # Return neutral result if analysis fails
            return {
                "emotion": "neutral",
                "confidence": 0.0,
                "all_emotions": {},
                "feedback": "Unable to detect emotion. Make sure your face is visible.",
                "icon": "🤔",
                "color": "gray",
                "face_detected": False,
                "error": str(e),
            }

    @staticmethod
    def get_session_summary(emotions_log: list[dict]) -> dict[str, Any]:
        """
        Generate summary of emotions throughout a speaking session

        Args:
            emotions_log: List of emotion analysis results

        Returns:
            Summary with dominant emotion, average confidence, etc.
        """
        if not emotions_log:
            return {
                "dominant_emotion": "neutral",
                "average_confidence": 0.0,
                "emotion_distribution": {},
                "feedback": "No emotion data available.",
            }

        # Count emotion occurrences
        emotion_counts: dict[str, int] = {}
        total_confidence = 0.0
        valid_detections = 0

        for log in emotions_log:
            if log.get("face_detected", False):
                emotion = log.get("emotion", "neutral")
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                total_confidence += log.get("confidence", 0.0)
                valid_detections += 1

        if valid_detections == 0:
            return {
                "dominant_emotion": "neutral",
                "average_confidence": 0.0,
                "emotion_distribution": {},
                "feedback": "No faces detected during session.",
            }

        # Find dominant emotion
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)  # type: ignore[arg-type]
        average_confidence = total_confidence / valid_detections

        # Calculate distribution percentages
        emotion_distribution = {
            emotion: round(count / valid_detections * 100, 1)
            for emotion, count in emotion_counts.items()
        }

        # Get feedback for dominant emotion
        feedback_data = EmotionDetectionService.EMOTION_FEEDBACK.get(
            dominant_emotion,
            {"message": "Keep practicing!", "icon": "🙂"},
        )

        return {
            "dominant_emotion": dominant_emotion,
            "average_confidence": round(average_confidence, 2),
            "emotion_distribution": emotion_distribution,
            "total_frames": len(emotions_log),
            "valid_detections": valid_detections,
            "feedback": feedback_data["message"],
            "icon": feedback_data["icon"],
        }
