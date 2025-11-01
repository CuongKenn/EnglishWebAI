"""
DOCX Service
Service to read and extract content from Word documents (.docx and .doc)
Extracts both text and images for exam generation
"""
import io
import os
import sys
import uuid
from pathlib import Path
from typing import Dict, List, Tuple
from docx import Document
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from PIL import Image


class DocxService:
    """Service for reading and extracting content from DOCX and DOC files"""
    
    def __init__(self, media_root: str = "media/exam_images"):
        """
        Initialize DOCX service
        
        Args:
            media_root: Root directory to save extracted images
        """
        self.media_root = Path(media_root)
        self.media_root.mkdir(parents=True, exist_ok=True)
    
    def _extract_text_from_doc(self, doc_content: bytes) -> str:
        """
        Extract text from .doc (Word 97-2003) file
        Uses pypandoc to convert to plain text
        Note: This extracts text only, no images or formatting
        
        Args:
            doc_content: Binary content of .doc file
            
        Returns:
            Extracted text content
        """
        import tempfile
        import subprocess
        
        # Save .doc to temp file
        with tempfile.NamedTemporaryFile(suffix='.doc', delete=False) as tmp_doc:
            tmp_doc.write(doc_content)
            tmp_doc_path = tmp_doc.name
        
        try:
            # Try using antiword (works in Docker/Linux)
            try:
                result = subprocess.run(
                    ['antiword', tmp_doc_path],
                    capture_output=True,
                    text=True,
                    check=True
                )
                text = result.stdout
                logger.info(f"[DOC Extraction] Successfully extracted text using antiword")
                return text
            except (subprocess.CalledProcessError, FileNotFoundError):
                # antiword not available, try textract or other methods
                pass
            
            # Fallback: Use pypandoc if available
            try:
                import pypandoc
                text = pypandoc.convert_file(tmp_doc_path, 'plain', format='doc')
                logger.info(f"[DOC Extraction] Successfully extracted text using pypandoc")
                return text
            except:
                pass
            
            # Last resort: suggest manual conversion
            raise Exception(
                "⚠️ File .doc (Word 97-2003) chỉ có thể trích xuất text, không có hình ảnh. "
                "Để có trải nghiệm tốt nhất, vui lòng mở file trong Word và Save As định dạng .docx"
            )
                
        finally:
            # Cleanup temp file
            try:
                if os.path.exists(tmp_doc_path):
                    os.remove(tmp_doc_path)
            except:
                pass
    
    def extract_content(self, file_content: bytes, save_images: bool = True) -> Dict:
        """
        Extract text and images from DOCX file
        
        Args:
            file_content: Binary content of the DOCX file
            save_images: Whether to save images to disk
            
        Returns:
            Dictionary with extracted content:
            {
                "text": "Full text content",
                "paragraphs": ["Paragraph 1", "Paragraph 2", ...],
                "images": [{"path": "image_path.png", "description": "..."}, ...],
                "tables": [...],
                "structure": [
                    {"type": "paragraph", "content": "...", "style": "..."},
                    {"type": "image", "image_id": 0},
                    {"type": "table", "rows": [...]}
                ]
            }
        """
        try:
            # Check if it's a valid zip file (DOCX format)
            # Old .doc files (Word 97-2003) are not zip files
            import zipfile
            is_docx = True
            try:
                zipfile.ZipFile(io.BytesIO(file_content))
            except zipfile.BadZipFile:
                is_docx = False
            
            if not is_docx:
                # It's a .doc file - text extraction only (no images)
                logger.info("[DOCX Service] Detected .doc file - extracting text only")
                try:
                    text_content = self._extract_text_from_doc(file_content)
                    paragraphs = [p.strip() for p in text_content.split('\n\n') if p.strip()]
                    return {
                        "text": text_content,
                        "paragraphs": paragraphs,
                        "images": [],
                        "tables": [],
                        "structure": [{"type": "paragraph", "content": p, "style": "Normal"} for p in paragraphs]
                    }
                except Exception as doc_error:
                    raise Exception(f"Không thể đọc file .doc: {str(doc_error)}. Vui lòng chuyển đổi sang .docx để có đầy đủ tính năng (bao gồm hình ảnh).")
            
            # It's a .docx file - full processing with images
            doc = Document(io.BytesIO(file_content))
            
            # Extract images
            images = []
            if save_images:
                images = self._extract_images(doc)
            
            # Extract content with structure
            structure = []
            paragraphs = []
            tables = []
            
            # Process document elements in order
            for element in doc.element.body:
                # Check if it's a paragraph
                if element.tag.endswith('p'):
                    para = None
                    for p in doc.paragraphs:
                        if p._element == element:
                            para = p
                            break
                    
                    if para:
                        text = para.text.strip()
                        if text:
                            paragraphs.append(text)
                            structure.append({
                                "type": "paragraph",
                                "content": text,
                                "style": para.style.name if para.style else "Normal"
                            })
                        
                        # Check for images in paragraph
                        for run in para.runs:
                            if 'graphicData' in run._element.xml:
                                # Find matching image
                                for img_idx, img in enumerate(images):
                                    structure.append({
                                        "type": "image",
                                        "image_id": img_idx,
                                        "path": img["path"]
                                    })
                                    break
                
                # Check if it's a table
                elif element.tag.endswith('tbl'):
                    tbl = None
                    for t in doc.tables:
                        if t._element == element:
                            tbl = t
                            break
                    
                    if tbl:
                        table_data = self._extract_table(tbl)
                        tables.append(table_data)
                        structure.append({
                            "type": "table",
                            "rows": table_data
                        })
            
            # Full text
            full_text = "\n".join(paragraphs)
            
            return {
                "text": full_text,
                "paragraphs": paragraphs,
                "images": images,
                "tables": tables,
                "structure": structure
            }
            
        except Exception as e:
            raise Exception(f"Failed to extract content from DOCX: {str(e)}")
    
    def _extract_images(self, doc: Document) -> List[Dict]:
        """
        Extract all images from document and save them
        
        Args:
            doc: python-docx Document object
            
        Returns:
            List of image info dictionaries
        """
        images = []
        
        try:
            # Get all image relationships
            for rel in doc.part.rels.values():
                if "image" in rel.target_ref:
                    try:
                        # Get image binary
                        image_blob = rel.target_part.blob
                        
                        # Generate unique filename
                        ext = rel.target_ref.split('.')[-1]
                        filename = f"{uuid.uuid4()}.{ext}"
                        filepath = self.media_root / filename
                        
                        # Save image
                        with open(filepath, 'wb') as f:
                            f.write(image_blob)
                        
                        # Get image dimensions
                        try:
                            img = Image.open(io.BytesIO(image_blob))
                            width, height = img.size
                        except:
                            width, height = 0, 0
                        
                        images.append({
                            "path": str(filepath),
                            "filename": filename,
                            "relative_path": f"exam_images/{filename}",
                            "width": width,
                            "height": height
                        })
                    except Exception as e:
                        logger.info(f"Failed to extract image: {e}")
                        continue
        except Exception as e:
            logger.info(f"Error extracting images: {e}")
        
        return images
    
    def _extract_table(self, table) -> List[List[str]]:
        """
        Extract table data
        
        Args:
            table: python-docx Table object
            
        Returns:
            2D list of table cells
        """
        rows = []
        for row in table.rows:
            cells = []
            for cell in row.cells:
                cells.append(cell.text.strip())
            rows.append(cells)
        return rows
    
    def create_exam_prompt(self, extracted_content: Dict, exam_type: str = "midterm") -> str:
        """
        Create a prompt for OpenAI to parse the exam content
        
        Args:
            extracted_content: Dictionary from extract_content()
            exam_type: Type of exam (midterm, final, quiz)
            
        Returns:
            Formatted prompt for OpenAI
        """
        prompt = f"""Bạn là trợ lý AI chuyên phân tích đề thi tiếng Anh. Tôi sẽ cung cấp nội dung đề thi được trích xuất từ file Word.

NHIỆM VỤ:
Phân tích đề thi và chuyển đổi sang định dạng JSON có cấu trúc để hiển thị trên web cho học sinh làm bài.

NỘI DUNG ĐỀ THI:
{extracted_content['text']}

"""
        
        # Add image information
        if extracted_content['images']:
            prompt += f"\nĐỀ THI CÓ {len(extracted_content['images'])} HÌNH ẢNH đi kèm.\n"
        
        # Add table information
        if extracted_content['tables']:
            prompt += f"\nĐỀ THI CÓ {len(extracted_content['tables'])} BẢNG:\n"
            for idx, table in enumerate(extracted_content['tables']):
                prompt += f"\nBảng {idx + 1}:\n"
                for row in table[:5]:  # Only show first 5 rows
                    prompt += f"{' | '.join(row)}\n"
        
        prompt += """

YÊU CẦU PHÂN TÍCH:
1. Xác định cấu trúc đề thi (các phần: Listening, Reading, Writing, Speaking)
2. Với mỗi phần, xác định các Task và loại câu hỏi
3. Trích xuất đầy đủ nội dung câu hỏi, đáp án (nếu có)
4. Xác định vị trí hình ảnh (nếu có) trong từng câu hỏi
5. **QUAN TRỌNG**: Nếu đề thi không có phần Speaking rõ ràng, hãy tạo một phần Speaking mặc định với prompt phù hợp với cấp độ

FORMAT JSON OUTPUT:
{
    "exam_title": "Tên đề thi",
    "exam_type": "midterm/final",
    "total_points": 10.0,
    "duration": 60,
    "sections": [
        {
            "section_name": "I. LISTENING",
            "section_points": 2.5,
            "audio_required": true,
            "tasks": [
                {
                    "task_number": 1,
                    "task_title": "Task 1. Listen and match. There is one example.",
                    "task_type": "matching",
                    "instructions": "Nghe và nối...",
                    "has_images": true,
                    "image_positions": [0, 1],
                    "questions": [
                        {
                            "question_id": "0",
                            "question_text": "Example",
                            "question_type": "matching",
                            "options": ["A", "B", "C", "D"],
                            "correct_answer": "C",
                            "points": 0,
                            "is_example": true
                        },
                        {
                            "question_id": "1",
                            "question_text": "Question 1",
                            "question_type": "matching",
                            "options": ["A", "B", "C", "D"],
                            "points": 0.25
                        }
                    ]
                },
                {
                    "task_number": 2,
                    "task_title": "Task 2. Listen and tick A, B or C.",
                    "task_type": "multiple_choice",
                    "questions": [...]
                }
            ]
        },
        {
            "section_name": "II. READING",
            "section_points": 2.5,
            "tasks": [...]
        },
        {
            "section_name": "III. WRITING",
            "section_points": 2.5,
            "tasks": [
                {
                    "task_number": 1,
                    "task_title": "Write an essay about...",
                    "task_type": "essay",
                    "prompt": "Write a paragraph (50-70 words) about your favorite hobby.",
                    "min_words": 50,
                    "max_words": 70,
                    "points": 2.5
                }
            ]
        },
        {
            "section_name": "IV. SPEAKING",
            "section_points": 2.5,
            "audio_required": true,
            "tasks": [
                {
                    "task_number": 1,
                    "task_title": "Speaking Task",
                    "task_type": "speaking",
                    "prompt": "Talk about your favorite subject at school. You should say: What subject is it? Why do you like it? What do you learn in this subject?",
                    "reference_text": "I like English the most. It is interesting and useful for my future.",
                    "duration": 60,
                    "points": 2.5
                }
            ]
        }
    ],
    "answer_key": {
        "section_1_task_1_q1": "B",
        "section_1_task_2_q1": "A"
    }
}

CHÚ Ý:
- Giữ nguyên số thứ tự câu hỏi và ví dụ như trong đề gốc
- Đánh dấu rõ câu nào là example (không tính điểm) với is_example: true
- Với câu hỏi có hình ảnh, đánh dấu has_images = true và liệt kê vị trí hình
- Phân loại đúng question_type: matching, multiple_choice, checkbox, fill_blank, short_answer, essay, speaking
- Tính toán đúng điểm số cho từng câu
- **BẮT BUỘC**: Phải có đầy đủ 4 sections (Listening, Reading, Writing, Speaking). Nếu đề thi thiếu phần nào, hãy tạo một task mặc định phù hợp với cấp độ
- Với Speaking section: tạo prompt yêu cầu học sinh nói về một chủ đề quen thuộc (family, hobbies, school, daily routine, etc.)

RESPONSE:
Chỉ trả về JSON, không thêm giải thích.
"""
        
        return prompt


# Global instance
docx_service = DocxService()


