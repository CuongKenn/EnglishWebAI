"""
Test script for email service
Run this to test if your SMTP configuration is working correctly
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email_service import EmailService
from app.core.config import settings


def test_email_service():
    """Test the email service with a simple email"""
    print("🧪 Testing Email Service...")
    print(f"📧 SMTP Host: {settings.SMTP_HOST}")
    print(f"📧 SMTP Port: {settings.SMTP_PORT}")
    print(f"📧 From: {settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>")
    print()
    
    # Get recipient email
    to_email = input("Enter recipient email address: ").strip()
    
    if not to_email:
        print("❌ No email address provided!")
        return
    
    # Test 1: Send OTP email
    print("\n📨 Test 1: Sending OTP email...")
    test_otp = "123456"
    
    success = EmailService.send_otp_email(
        to_email=to_email,
        otp_code=test_otp,
        username="Test User"
    )
    
    if success:
        print(f"✅ OTP email sent successfully to {to_email}")
        print(f"📋 OTP Code: {test_otp}")
    else:
        print(f"❌ Failed to send OTP email to {to_email}")
        return
    
    # Test 2: Send password reset email
    print("\n📨 Test 2: Sending password reset email...")
    test_reset_code = "789012"
    
    success = EmailService.send_password_reset_email(
        to_email=to_email,
        reset_code=test_reset_code,
        username="Test User"
    )
    
    if success:
        print(f"✅ Password reset email sent successfully to {to_email}")
        print(f"📋 Reset Code: {test_reset_code}")
    else:
        print(f"❌ Failed to send password reset email to {to_email}")
        return
    
    # Test 3: Send custom email
    print("\n📨 Test 3: Sending custom email...")
    
    html_content = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>Test Email</h2>
            <p>This is a test email from EnglishWebAI.</p>
            <p>If you received this, the email service is working correctly! ✅</p>
        </body>
    </html>
    """
    
    text_content = "This is a test email from EnglishWebAI. If you received this, the email service is working correctly!"
    
    success = EmailService.send_email(
        to_email=to_email,
        subject="Test Email from EnglishWebAI",
        html_content=html_content,
        text_content=text_content
    )
    
    if success:
        print(f"✅ Custom email sent successfully to {to_email}")
    else:
        print(f"❌ Failed to send custom email to {to_email}")
    
    print("\n✅ All tests completed!")
    print("📬 Check your inbox (and spam folder) for the test emails.")


if __name__ == "__main__":
    print("=" * 60)
    print("       Email Service Test Script")
    print("=" * 60)
    print()
    
    try:
        # Check if SMTP credentials are configured
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            print("⚠️  WARNING: SMTP credentials not configured!")
            print("Please update your .env file with:")
            print("  SMTP_USERNAME=your-email@gmail.com")
            print("  SMTP_PASSWORD=your-app-password")
            print()
            print("For Gmail, you need to:")
            print("1. Enable 2-Factor Authentication")
            print("2. Generate an App Password")
            print("3. Use that App Password in SMTP_PASSWORD")
            sys.exit(1)
        
        test_email_service()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Test cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nPlease check:")
        print("1. Your .env file has correct SMTP settings")
        print("2. Your firewall allows SMTP connections")
        print("3. Your email credentials are correct")
