"""
Gaze Tracking Service using MediaPipe Face Mesh
Detects gaze direction and head pose for exam monitoring
"""

import base64
import logging
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

try:
    import mediapipe as mp
except ImportError:
    mp = None

logger = logging.getLogger(__name__)


class GazeTrackingService:
    """Service for gaze direction and head pose estimation"""

    # Head pose thresholds (in degrees)
    YAW_THRESHOLD = 30  # Head turned left/right
    PITCH_THRESHOLD = 30  # Head tilted up/down
    ROLL_THRESHOLD = 25  # Head tilted sideways

    # Gaze direction thresholds
    GAZE_CENTER_THRESHOLD = 0.3  # Range for "looking at screen"

    def __init__(self):
        self.face_mesh = None
        self.is_initialized = False

        if mp is None:
            logger.error("MediaPipe not installed. Please install: pip install mediapipe")
            return

    def initialize(self):
        """Initialize MediaPipe Face Mesh"""
        if self.is_initialized:
            return

        if mp is None:
            raise ImportError("MediaPipe not available")

        try:
            # Initialize Face Mesh with refined landmarks
            self.face_mesh = mp.solutions.face_mesh.FaceMesh(
                max_num_faces=2,  # Detect up to 2 faces (for multi-person detection)
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.is_initialized = True
            logger.info("GazeTrackingService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize GazeTrackingService: {str(e)}")
            raise

    def _base64_to_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to OpenCV image"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]

            # Decode base64
            image_bytes = base64.b64decode(base64_string)
            img = Image.open(BytesIO(image_bytes))
            img_array = np.array(img)

            # Convert RGB to BGR for OpenCV
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

            return img_array
        except Exception as e:
            logger.error(f"Error converting base64 to image: {str(e)}")
            raise

    def _get_head_pose(self, landmarks, image_shape) -> tuple[float, float, float]:
        """
        Calculate head pose angles (yaw, pitch, roll) from facial landmarks
        Returns angles in degrees
        """
        # Key facial landmarks for head pose estimation
        # Using MediaPipe Face Mesh landmark indices
        nose_tip = 1
        chin = 152
        left_eye_left = 263
        right_eye_right = 33
        left_mouth = 61
        right_mouth = 291

        h, w = image_shape[:2]

        # 2D image points
        image_points = np.array([
            (landmarks[nose_tip].x * w, landmarks[nose_tip].y * h),      # Nose tip
            (landmarks[chin].x * w, landmarks[chin].y * h),              # Chin
            (landmarks[left_eye_left].x * w, landmarks[left_eye_left].y * h),    # Left eye left corner
            (landmarks[right_eye_right].x * w, landmarks[right_eye_right].y * h),  # Right eye right corner
            (landmarks[left_mouth].x * w, landmarks[left_mouth].y * h),  # Left mouth corner
            (landmarks[right_mouth].x * w, landmarks[right_mouth].y * h) # Right mouth corner
        ], dtype=np.float64)

        # 3D model points (generic face model)
        model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ])

        # Camera internals
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        # Assuming no lens distortion
        dist_coeffs = np.zeros((4, 1))

        # Solve PnP to get rotation and translation vectors
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return 0.0, 0.0, 0.0

        # Convert rotation vector to rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)

        # Calculate Euler angles from rotation matrix
        # Using the convention: yaw (Y), pitch (X), roll (Z)
        sy = np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)

        singular = sy < 1e-6

        if not singular:
            yaw = np.arctan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
            pitch = np.arctan2(-rotation_matrix[2, 0], sy)
            roll = np.arctan2(rotation_matrix[2, 1], rotation_matrix[2, 2])
        else:
            yaw = np.arctan2(-rotation_matrix[1, 2], rotation_matrix[1, 1])
            pitch = np.arctan2(-rotation_matrix[2, 0], sy)
            roll = 0

        # Convert to degrees
        yaw = np.degrees(yaw)
        pitch = np.degrees(pitch)
        roll = np.degrees(roll)

        return yaw, pitch, roll

    def _get_gaze_direction(self, landmarks) -> str:
        """
        Estimate gaze direction from eye landmarks
        Returns: 'center', 'left', 'right', 'up', 'down'
        """
        # Left eye landmarks (iris center approximation)
        left_eye_center_x = (landmarks[33].x + landmarks[133].x) / 2
        left_iris_x = landmarks[468].x  # Left iris center (refined landmark)

        # Right eye landmarks
        right_eye_center_x = (landmarks[362].x + landmarks[263].x) / 2
        right_iris_x = landmarks[473].x  # Right iris center (refined landmark)

        # Calculate horizontal gaze offset
        left_offset = left_iris_x - left_eye_center_x
        right_offset = right_iris_x - right_eye_center_x
        avg_horizontal_offset = (left_offset + right_offset) / 2

        # Vertical gaze (using eye vertical position)
        left_eye_center_y = (landmarks[159].y + landmarks[145].y) / 2
        left_iris_y = landmarks[468].y
        right_eye_center_y = (landmarks[386].y + landmarks[374].y) / 2
        right_iris_y = landmarks[473].y

        left_v_offset = left_iris_y - left_eye_center_y
        right_v_offset = right_iris_y - right_eye_center_y
        avg_vertical_offset = (left_v_offset + right_v_offset) / 2

        # Determine gaze direction
        if abs(avg_horizontal_offset) < self.GAZE_CENTER_THRESHOLD and abs(avg_vertical_offset) < self.GAZE_CENTER_THRESHOLD:
            return 'center'

        # Check vertical first (more important for exam monitoring)
        if abs(avg_vertical_offset) > abs(avg_horizontal_offset):
            return 'up' if avg_vertical_offset < 0 else 'down'
        return 'left' if avg_horizontal_offset < 0 else 'right'

    def analyze_frame(self, base64_image: str) -> dict:
        """
        Analyze a frame for gaze and head pose
        Returns dict with analysis results
        """
        if not self.is_initialized:
            self.initialize()

        try:
            # Convert base64 to image
            image = self._base64_to_image(base64_image)
            h, w = image.shape[:2]

            # Convert BGR to RGB for MediaPipe
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # Process image
            results = self.face_mesh.process(rgb_image)

            if not results.multi_face_landmarks:
                return {
                    'success': False,
                    'face_detected': False,
                    'num_faces': 0,
                    'message': 'No face detected'
                }

            num_faces = len(results.multi_face_landmarks)

            if num_faces > 1:
                return {
                    'success': True,
                    'face_detected': True,
                    'num_faces': num_faces,
                    'warning': 'multiple_faces',
                    'message': f'Multiple faces detected ({num_faces})'
                }

            # Analyze the single detected face
            face_landmarks = results.multi_face_landmarks[0]

            # Get head pose
            yaw, pitch, roll = self._get_head_pose(face_landmarks.landmark, image.shape)

            # Get gaze direction
            gaze_direction = self._get_gaze_direction(face_landmarks.landmark)

            # Determine violations
            violations = []
            if abs(yaw) > self.YAW_THRESHOLD:
                violations.append(f'head_turned_{"left" if yaw < 0 else "right"}')
            if abs(pitch) > self.PITCH_THRESHOLD:
                violations.append(f'head_{"down" if pitch < 0 else "up"}')
            if abs(roll) > self.ROLL_THRESHOLD:
                violations.append('head_tilted')
            if gaze_direction != 'center':
                violations.append(f'looking_{gaze_direction}')

            return {
                'success': True,
                'face_detected': True,
                'num_faces': num_faces,
                'head_pose': {
                    'yaw': round(yaw, 2),
                    'pitch': round(pitch, 2),
                    'roll': round(roll, 2)
                },
                'gaze_direction': gaze_direction,
                'violations': violations,
                'is_attentive': len(violations) == 0,
                'message': 'Looking at screen' if len(violations) == 0 else f'Violations: {", ".join(violations)}'
            }

        except Exception as e:
            logger.error(f"Error analyzing frame: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Error processing frame'
            }

    def cleanup(self):
        """Clean up resources"""
        if self.face_mesh:
            self.face_mesh.close()
            self.face_mesh = None
        self.is_initialized = False


# Singleton instance
_gaze_tracking_service = None


def get_gaze_tracking_service() -> GazeTrackingService:
    """Get or create the singleton GazeTrackingService instance"""
    global _gaze_tracking_service
    if _gaze_tracking_service is None:
        _gaze_tracking_service = GazeTrackingService()
        _gaze_tracking_service.initialize()
    return _gaze_tracking_service
