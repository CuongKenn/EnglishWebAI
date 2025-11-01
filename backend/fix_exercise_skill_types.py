"""
Fix missing skill_type for exercises
"""
from app.core.database import SessionLocal
from app.models.exercise import Exercise
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def infer_skill_type_from_title(title: str) -> str:
    """Infer skill type from exercise title"""
    title_lower = title.lower()
    
    if any(word in title_lower for word in ['speaking', 'speak', 'pronunciation', 'conversation']):
        return 'speaking'
    elif any(word in title_lower for word in ['listening', 'listen', 'audio', 'hear']):
        return 'listening'
    elif any(word in title_lower for word in ['writing', 'write', 'essay', 'composition']):
        return 'writing'
    elif any(word in title_lower for word in ['reading', 'read', 'comprehension', 'passage']):
        return 'reading'
    
    # Default to reading if can't determine
    return 'reading'

def fix_skill_types():
    """Update exercises missing skill_type"""
    db = SessionLocal()
    try:
        # Get exercises without skill_type
        exercises = db.query(Exercise).filter(Exercise.skill_type == None).all()
        
        logger.info(f"Found {len(exercises)} exercises without skill_type")
        
        updated = 0
        for exercise in exercises:
            # Infer from title
            inferred_type = infer_skill_type_from_title(exercise.title)
            exercise.skill_type = inferred_type
            updated += 1
            logger.info(f"Exercise {exercise.id} '{exercise.title}' -> skill_type: {inferred_type}")
        
        db.commit()
        logger.info(f"Successfully updated {updated} exercises")
        
        # Verify
        remaining = db.query(Exercise).filter(Exercise.skill_type == None).count()
        logger.info(f"Remaining exercises without skill_type: {remaining}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_skill_types()
