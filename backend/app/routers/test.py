from fastapi import APIRouter, HTTPException
from app.services.email_service import EmailService

router = APIRouter()

@router.post("/test-email/{email}")
async def test_email(email: str):
    """Test endpoint to send a test email"""
    try:
        success = EmailService.send_test_email(email)
        if success:
            return {"message": f"Test email sent successfully to {email}"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))