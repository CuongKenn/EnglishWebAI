#!/usr/bin/env python3
"""
Script để đảm bảo tất cả enrollment records có role phù hợp.
Chỉ nên có role='student' cho học sinh thực sự.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from sqlalchemy import text

def fix_enrollment_roles():
    """
    Đảm bảo enrollment records chỉ có role='student' cho học sinh
    và xóa các enrollment không hợp lệ (teacher được enroll vào lớp của chính họ)
    """
    with engine.connect() as conn:
        # Kiểm tra xem có enrollment nào của teacher không
        result = conn.execute(text("""
            SELECT e.id, e.user_id, e.class_id, u.role as user_role, c.teacher_id
            FROM class_enrollments e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN classes c ON e.class_id = c.id
            WHERE u.role IN ('teacher', 'admin', 'superadmin')
        """))
        
        rows = result.fetchall()
        
        if rows:
            print(f"Tìm thấy {len(rows)} enrollment records của teacher/admin:")
            for row in rows:
                enr_id, user_id, class_id, user_role, teacher_id = row
                print(f"  - Enrollment ID {enr_id}: User {user_id} ({user_role}) in class {class_id}")
                
                # Nếu đây là teacher của chính lớp đó, xóa enrollment
                if user_id == teacher_id:
                    print(f"    -> Xóa enrollment này (teacher không cần enroll vào lớp của chính mình)")
                    conn.execute(text("""
                        DELETE FROM class_enrollments 
                        WHERE id = :enr_id
                    """), {"enr_id": enr_id})
                else:
                    print(f"    -> Giữ lại (có thể là teacher tham gia lớp khác)")
        else:
            print("✓ Không tìm thấy enrollment nào của teacher/admin")
        
        # Đảm bảo tất cả enrollment đều có role='student'
        conn.execute(text("""
            UPDATE class_enrollments 
            SET role = 'student' 
            WHERE role IS NULL OR role = ''
        """))
        
        conn.commit()
        print("✓ Đã cập nhật tất cả enrollment records")

if __name__ == "__main__":
    print("=== Fix Enrollment Roles ===")
    fix_enrollment_roles()
    print("=== Hoàn thành ===")
