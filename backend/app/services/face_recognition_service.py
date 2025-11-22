"""
Face Recognition Service for Exam Verification
Uses RetinaFace for detection and CurricularFace for recognition
Supports continuous face monitoring during exams
"""

import base64
import sys
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms as T

# Add ml_models folder to path
ML_MODELS_PATH = Path(__file__).parent.parent.parent / "ml_models"


class FaceRecognitionService:
    """Service for face detection and recognition during exams"""

    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.detection_model = None
        self.retinaface_model = None
        self.recognition_model = None
        self.initialized = False
        self.use_retinaface = True  # Use RetinaFace by default for better accuracy

    def initialize_models(self):
        """Lazy load models only when needed"""
        if self.initialized:
            return True

        try:
            # Import model classes using absolute path from /app
            app_path = Path(__file__).parent.parent.parent.parent
            if str(app_path) not in sys.path:
                sys.path.insert(0, str(app_path))

            # Try to load RetinaFace first (preferred for continuous monitoring)
            # RetinaFace will be loaded lazily when needed, not here
            # This allows the system to work even if RetinaFace is not installed
            if self.use_retinaface:
                try:
                    # Just test if RetinaFace can be imported
                    import retinaface
                    print("✓ RetinaFace package available")
                    # Don't load model here, load it lazily in detect_faces
                except ImportError:
                    print("⚠ RetinaFace package not available, falling back to CenterFace")
                    self.use_retinaface = False
                except Exception as e:
                    print(f"⚠ Error checking RetinaFace: {e}, falling back to CenterFace")
                    self.use_retinaface = False

            # Fallback to CenterFace if RetinaFace not available
            if not self.use_retinaface:
                from ml_models.CenterFace.models.centerface import CenterFace
                # Setup CenterFace transforms
                self.centerface_transforms = T.Compose([
                    T.ToTensor(),
                    T.Normalize(mean=[0.408, 0.447, 0.47], std=[0.289, 0.274, 0.278])
                ])

                # Load CenterFace for detection
                centerface_weights = ML_MODELS_PATH / "CenterFace" / "checkpoints" / "500.pth"
                if centerface_weights.exists():
                    self.detection_model = CenterFace()
                    checkpoint = torch.load(str(centerface_weights), map_location=self.device)
                    self.detection_model.load_state_dict(checkpoint)
                    self.detection_model.to(self.device)
                    self.detection_model.eval()
                    print(f"✓ CenterFace loaded from {centerface_weights}")
                else:
                    print("⚠ CenterFace model not found")

            # Load CurricularFace for recognition
            from ml_models.CurricularFace.models.seesawfacenet import SeesawFaceNet
            recognition_weights = ML_MODELS_PATH / "CurricularFace" / "checkpoints" / "25.pth"
            if recognition_weights.exists():
                self.recognition_model = SeesawFaceNet(embedding_size=512)
                checkpoint = torch.load(str(recognition_weights), map_location=self.device)

                # Handle different checkpoint formats
                if isinstance(checkpoint, dict):
                    if 'state_dict' in checkpoint:
                        state_dict = checkpoint['state_dict']
                    elif 'model' in checkpoint:
                        state_dict = checkpoint['model']
                    else:
                        state_dict = checkpoint
                else:
                    state_dict = checkpoint

                self.recognition_model.load_state_dict(state_dict)
                self.recognition_model.to(self.device)
                self.recognition_model.eval()
                print(f"✓ SeesawFaceNet loaded from {recognition_weights}")
            else:
                print("⚠ CurricularFace model not found")

            self.initialized = True
            return True

        except Exception as e:
            print(f"✗ Error initializing face recognition models: {e}")
            import traceback
            traceback.print_exc()
            return False

    def decode_base64_image(self, base64_str: str) -> np.ndarray | None:
        """Decode base64 image string to numpy array"""
        try:
            # Remove data URL prefix if present
            if ',' in base64_str:
                base64_str = base64_str.split(',')[1]

            img_data = base64.b64decode(base64_str)
            img = Image.open(BytesIO(img_data))
            img_array = np.array(img)

            # Convert RGB to BGR for OpenCV
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

            return img_array
        except Exception as e:
            print(f"Error decoding base64 image: {e}")
            return None

    def _pad_image(self, image: np.ndarray, stride: int = 32) -> np.ndarray:
        """Pad image to be divisible by stride"""
        h, w = image.shape[:2]
        new_h = h if h % stride == 0 else h + stride - (h % stride)
        new_w = w if w % stride == 0 else w + stride - (w % stride)

        if new_h != h or new_w != w:
            padded = np.zeros((new_h, new_w, 3), dtype=image.dtype)
            padded[:h, :w] = image
            return padded
        return image

    def detect_faces(self, image: np.ndarray, threshold: float = 0.5) -> list[tuple[int, int, int, int]]:
        """
        Detect faces in image using RetinaFace (preferred) or CenterFace (fallback)
        Returns list of bounding boxes [(x1, y1, x2, y2), ...]
        """
        if not self.initialized:
            self.initialize_models()

        try:
            # Use RetinaFace if available (better accuracy for continuous monitoring)
            if self.use_retinaface and self.retinaface_model is not None:
                return self._detect_faces_retinaface(image, threshold)
            elif self.detection_model is not None:
                return self._detect_faces_centerface(image, threshold)
            else:
                print("⚠ No face detection model available")
                return []
        except Exception as e:
            print(f"Error detecting faces: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _detect_faces_retinaface(self, image: np.ndarray, threshold: float = 0.5) -> list[tuple[int, int, int, int]]:
        """Detect faces using RetinaFace"""
        try:
            # Try different import methods for RetinaFace
            try:
                from retinaface import RetinaFace
                # Method 1: Using retinaface package
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                faces = RetinaFace.detect_faces(rgb_image, threshold=threshold)
                
                boxes = []
                if isinstance(faces, dict):
                    for face_key, face_data in faces.items():
                        if 'facial_area' in face_data:
                            facial_area = face_data['facial_area']
                            x1, y1, x2, y2 = facial_area
                            boxes.append((int(x1), int(y1), int(x2), int(y2)))
                return boxes
            except (ImportError, AttributeError):
                # Method 2: Try alternative import
                try:
                    from retinaface.detector import RetinaFaceDetector
                    detector = RetinaFaceDetector()
                    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                    detections = detector.detect(rgb_image, threshold=threshold)
                    
                    boxes = []
                    for det in detections:
                        if len(det) >= 4:
                            x1, y1, x2, y2 = int(det[0]), int(det[1]), int(det[2]), int(det[3])
                            boxes.append((x1, y1, x2, y2))
                    return boxes
                except Exception:
                    # If all methods fail, return empty and let it fall back to CenterFace
                    print("⚠ RetinaFace detection methods failed, will use CenterFace")
                    return []
        except Exception as e:
            print(f"Error in RetinaFace detection: {e}")
            import traceback
            traceback.print_exc()
            return []

    def _detect_faces_centerface(self, image: np.ndarray, threshold: float = 0.5) -> list[tuple[int, int, int, int]]:
        """Detect faces using CenterFace (fallback)"""
        if self.detection_model is None:
            return []

        try:
            # Pad image
            padded_image = self._pad_image(image)

            # Transform and add batch dimension
            input_tensor = self.centerface_transforms(padded_image)[None].to(self.device)

            # Run detection
            with torch.no_grad():
                hm, box, landmark = self.detection_model(input_tensor)

            # Post-process detections (simplified from demo)
            hm_pool = F.max_pool2d(hm, 3, 1, 1)
            scores, indices = ((hm == hm_pool).float() * hm).view(hm.shape[0], -1).cpu().topk(100)

            hm_height, hm_width = hm.shape[2:]
            indices = indices.squeeze()
            ys = (indices // hm_width).numpy()
            xs = (indices % hm_width).numpy()
            scores = scores.squeeze().numpy()
            box = box.cpu().squeeze().numpy()

            stride = 4
            boxes = []

            for cx, cy, score in zip(xs, ys, scores, strict=True):
                if score < threshold:
                    break

                x, y, r, b = box[:, cy, cx]
                x1, y1, x2, y2 = (np.array([cx, cy, cx, cy]) + [-x, -y, r, b]) * stride

                # Filter small boxes
                box_area = (abs(x2 - x1) + 1) * (abs(y2 - y1) + 1)
                frame_area = image.shape[0] * image.shape[1]
                if box_area < (frame_area * 0.005):
                    continue

                boxes.append((int(x1), int(y1), int(x2), int(y2)))

            return boxes

        except Exception as e:
            print(f"Error in CenterFace detection: {e}")
            import traceback
            traceback.print_exc()
            return []

    def extract_face_embedding(self, image: np.ndarray, bbox: tuple[int, int, int, int]) -> np.ndarray | None:
        """
        Extract face embedding from detected face region
        Returns 512-dimensional embedding vector
        """
        if not self.initialized:
            self.initialize_models()

        if self.recognition_model is None:
            return None

        try:
            x1, y1, x2, y2 = bbox
            face_img = image[y1:y2, x1:x2]

            # Resize to 112x112 for recognition model
            face_img = cv2.resize(face_img, (112, 112))

            # Normalize and convert to tensor
            face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
            face_tensor = torch.from_numpy(face_img).permute(2, 0, 1).float()
            face_tensor = (face_tensor - 127.5) / 128.0
            face_tensor = face_tensor.unsqueeze(0).to(self.device)

            # Extract embedding
            with torch.no_grad():
                embedding = self.recognition_model(face_tensor)

            embedding = embedding.cpu().numpy().flatten()
            # Normalize embedding
            return embedding / np.linalg.norm(embedding)

        except Exception as e:
            print(f"Error extracting face embedding: {e}")
            return None

    def compare_embeddings(self, embedding1: np.ndarray, embedding2: np.ndarray, threshold: float = 0.6) -> tuple[bool, float]:
        """
        Compare two face embeddings using cosine similarity
        Returns (is_match, similarity_score)
        threshold: 0.6 is typical for face recognition (lower = stricter)
        """
        try:
            similarity = np.dot(embedding1, embedding2)
            is_match = similarity >= threshold
            return is_match, float(similarity)
        except Exception as e:
            print(f"Error comparing embeddings: {e}")
            return False, 0.0

    def enroll_face(self, base64_image: str) -> dict | None:
        """
        Enroll a face from base64 image
        Returns dict with embedding and metadata or None if failed
        """
        image = self.decode_base64_image(base64_image)
        if image is None:
            return {"success": False, "error": "Invalid image"}

        faces = self.detect_faces(image)

        if len(faces) == 0:
            return {"success": False, "error": "No face detected"}

        if len(faces) > 1:
            return {"success": False, "error": "Multiple faces detected. Please ensure only one person is in the frame"}

        # Extract embedding from the single detected face
        embedding = self.extract_face_embedding(image, faces[0])

        if embedding is None:
            return {"success": False, "error": "Failed to extract face features"}

        return {
            "success": True,
            "embedding": embedding.tolist(),
            "bbox": faces[0],
            "embedding_size": len(embedding)
        }

    def verify_face(self, base64_image: str, stored_embedding: list[float], threshold: float = 0.6) -> dict:
        """
        Verify a face against stored embedding
        Returns verification result with confidence score
        """
        image = self.decode_base64_image(base64_image)
        if image is None:
            return {"success": False, "verified": False, "error": "Invalid image"}

        faces = self.detect_faces(image)

        if len(faces) == 0:
            return {"success": False, "verified": False, "error": "No face detected"}

        if len(faces) > 1:
            return {"success": False, "verified": False, "error": "Multiple faces detected"}

        # Extract embedding from detected face
        current_embedding = self.extract_face_embedding(image, faces[0])

        if current_embedding is None:
            return {"success": False, "verified": False, "error": "Failed to extract face features"}

        # Compare with stored embedding
        stored_emb = np.array(stored_embedding, dtype=np.float32)
        is_match, similarity = self.compare_embeddings(current_embedding, stored_emb, threshold)

        return {
            "success": True,
            "verified": is_match,
            "similarity": similarity,
            "threshold": threshold,
            "confidence": f"{similarity * 100:.1f}%"
        }

    def continuous_face_check(self, base64_image: str, stored_embedding: list[float], threshold: float = 0.6) -> dict:
        """
        Continuous face verification during exam
        Returns detailed result including face count, verification status, and warnings
        """
        image = self.decode_base64_image(base64_image)
        if image is None:
            return {
                "success": False,
                "verified": False,
                "face_detected": False,
                "face_count": 0,
                "error": "Invalid image",
                "warning": "Không thể đọc hình ảnh từ camera"
            }

        faces = self.detect_faces(image, threshold=0.5)

        # Check face count
        face_count = len(faces)
        if face_count == 0:
            return {
                "success": True,
                "verified": False,
                "face_detected": False,
                "face_count": 0,
                "error": "No face detected",
                "warning": "Không phát hiện khuôn mặt. Vui lòng đảm bảo camera đang bật và bạn đang ngồi trước camera."
            }

        if face_count > 1:
            return {
                "success": True,
                "verified": False,
                "face_detected": True,
                "face_count": face_count,
                "error": "Multiple faces detected",
                "warning": f"Phát hiện {face_count} khuôn mặt trong khung hình. Vui lòng đảm bảo chỉ có bạn trong khung hình."
            }

        # Extract embedding from detected face
        current_embedding = self.extract_face_embedding(image, faces[0])

        if current_embedding is None:
            return {
                "success": True,
                "verified": False,
                "face_detected": True,
                "face_count": 1,
                "error": "Failed to extract face features",
                "warning": "Không thể trích xuất đặc trưng khuôn mặt. Vui lòng đảm bảo ánh sáng đủ và khuôn mặt rõ ràng."
            }

        # Compare with stored embedding
        stored_emb = np.array(stored_embedding, dtype=np.float32)
        is_match, similarity = self.compare_embeddings(current_embedding, stored_emb, threshold)

        if not is_match:
            return {
                "success": True,
                "verified": False,
                "face_detected": True,
                "face_count": 1,
                "similarity": similarity,
                "confidence": f"{similarity * 100:.1f}%",
                "warning": f"Khuôn mặt không khớp với người đăng ký. Độ tương đồng: {similarity * 100:.1f}%",
                "alert": "CẢNH BÁO: Có thể có người khác đang làm bài thay bạn!"
            }

        return {
            "success": True,
            "verified": True,
            "face_detected": True,
            "face_count": 1,
            "similarity": similarity,
            "confidence": f"{similarity * 100:.1f}%",
            "message": "Xác minh thành công"
        }


# Singleton instance
_face_service = None

def get_face_recognition_service() -> FaceRecognitionService:
    """Get or create face recognition service instance"""
    global _face_service
    if _face_service is None:
        _face_service = FaceRecognitionService()
    return _face_service
