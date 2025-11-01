"""
Script to replace print() with logger in Python files
"""
import re
import os

files_to_process = [
    "app/routers/exercises.py",
    "app/routers/question_bank.py",
]

replacements = {
    r'print\(f"\[AUTO-GRADE\]': 'logger.debug(f"[AUTO-GRADE]',
    r'print\(f"\[GET /exercises/\]': 'logger.debug(f"[GET /exercises/]',
    r'print\(f"\[GET /my-submissions\]': 'logger.debug(f"[GET /my-submissions]',
    r'print\(f"\[UPLOAD\]': 'logger.debug(f"[UPLOAD]',
    r'print\(f"\[UPLOAD ERROR\]': 'logger.error(f"[UPLOAD ERROR]',
    r'print\(f"\[AI Generate API\] ✅': 'logger.info(f"[AI Generate API] ✅',
    r'print\(f"\[AI Generate API\] ❌': 'logger.error(f"[AI Generate API] ❌',
    r'print\(f"\[AI Generate API\]': 'logger.debug(f"[AI Generate API]',
    r'print\(f"Error creating notification': 'logger.error(f"Error creating notification',
    r'print\("\[DEBUG\]': 'logger.debug("[DEBUG]',
}

def process_file(filepath):
    """Process a single file"""
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    modified = False
    
    # Apply replacements
    for pattern, replacement in replacements.items():
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            modified = True
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated: {filepath}")
        return True
    else:
        print(f"⏭️  Skipped: {filepath} (no changes needed)")
        return False

if __name__ == "__main__":
    print("🧹 Cleaning up print() statements in backend...\n")
    
    total_updated = 0
    for file in files_to_process:
        if process_file(file):
            total_updated += 1
    
    print(f"\n✨ Complete! Updated {total_updated}/{len(files_to_process)} files")
