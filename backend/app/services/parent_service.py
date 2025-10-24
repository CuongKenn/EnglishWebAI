from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.parent_student import ParentStudent
from app.models.user import User, UserRole
from typing import List, Optional


class ParentService:
    @staticmethod
    def link_parent(db: Session, student_id: int, parent_email: str) -> ParentStudent:
        """Link a parent to a student"""
        # Find parent by email
        parent = db.query(User).filter(User.email == parent_email).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent account not found"
            )
        
        # Verify parent has parent role
        if parent.role != UserRole.PARENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must have parent role"
            )
        
        # Check if link already exists
        existing_link = db.query(ParentStudent).filter(
            ParentStudent.parent_id == parent.id,
            ParentStudent.student_id == student_id
        ).first()
        
        if existing_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent link already exists"
            )
        
        # Create new link
        link = ParentStudent(
            parent_id=parent.id,
            student_id=student_id,
            is_verified=False  # Student needs to verify
        )
        db.add(link)
        db.commit()
        db.refresh(link)
        return link
    
    @staticmethod
    def unlink_parent(db: Session, student_id: int, parent_id: int) -> bool:
        """Unlink a parent from a student"""
        link = db.query(ParentStudent).filter(
            ParentStudent.parent_id == parent_id,
            ParentStudent.student_id == student_id
        ).first()
        
        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent link not found"
            )
        
        db.delete(link)
        db.commit()
        return True
    
    @staticmethod
    def get_student_parents(db: Session, student_id: int) -> List[ParentStudent]:
        """Get all parents linked to a student"""
        return db.query(ParentStudent).filter(
            ParentStudent.student_id == student_id
        ).all()
    
    @staticmethod
    def get_parent_children(db: Session, parent_id: int) -> List[ParentStudent]:
        """Get all children linked to a parent"""
        return db.query(ParentStudent).filter(
            ParentStudent.parent_id == parent_id
        ).all()
    
    @staticmethod
    def verify_parent_link(db: Session, student_id: int, parent_id: int) -> ParentStudent:
        """Verify a parent link (student confirms)"""
        link = db.query(ParentStudent).filter(
            ParentStudent.parent_id == parent_id,
            ParentStudent.student_id == student_id
        ).first()
        
        if not link:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent link not found"
            )
        
        link.is_verified = True
        from sqlalchemy import func
        link.verified_at = func.now()
        db.commit()
        db.refresh(link)
        return link
