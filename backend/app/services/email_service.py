import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from app.core.config import settings
from datetime import datetime


class EmailService:
    """Service for sending emails via SMTP"""
    
    @staticmethod
    def _create_smtp_connection():
        """Create and return SMTP connection"""
        context = ssl.create_default_context()
        try:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls(context=context)
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            return server
        except Exception as e:
            raise Exception(f"Failed to connect to SMTP server: {str(e)}")
    
    @staticmethod
    def send_email(
        to_email: str | List[str],
        subject: str,
        html_content: str,
        text_content: str = None
    ) -> bool:
        """
        Send email via SMTP
        
        Args:
            to_email: Recipient email address or list of addresses
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            
            # Handle single or multiple recipients
            if isinstance(to_email, str):
                message["To"] = to_email
                recipients = [to_email]
            else:
                message["To"] = ", ".join(to_email)
                recipients = to_email
            
            # Add text content if provided
            if text_content:
                part1 = MIMEText(text_content, "plain")
                message.attach(part1)
            
            # Add HTML content
            part2 = MIMEText(html_content, "html")
            message.attach(part2)
            
            # Send email
            with EmailService._create_smtp_connection() as server:
                server.sendmail(settings.SMTP_FROM_EMAIL, recipients, message.as_string())
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False
    
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, username: str = None) -> bool:
        """
        Send OTP verification email
        
        Args:
            to_email: Recipient email address
            otp_code: OTP code to send
            username: User's name (optional)
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Your {settings.APP_NAME} Verification Code"
        
        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background-color: #f9f9f9;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    color: #4CAF50;
                    margin-bottom: 30px;
                }}
                .otp-box {{
                    background-color: #fff;
                    border: 2px solid #4CAF50;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .otp-code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #4CAF50;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #777;
                }}
                .warning {{
                    color: #ff9800;
                    font-size: 14px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{settings.APP_NAME}</h1>
                </div>
                
                <p>Hello{' ' + username if username else ''},</p>
                
                <p>You have requested a verification code. Please use the following One-Time Password (OTP) to complete your verification:</p>
                
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                </div>
                
                <p>This code will expire in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
                
                <p class="warning">⚠️ If you did not request this code, please ignore this email and ensure your account is secure.</p>
                
                <p>Best regards,<br>
                The {settings.APP_NAME} Team</p>
                
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; {datetime.now().year} {settings.APP_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create plain text content
        text_content = f"""
        {settings.APP_NAME} - Verification Code
        
        Hello{' ' + username if username else ''},
        
        You have requested a verification code. Please use the following One-Time Password (OTP) to complete your verification:
        
        {otp_code}
        
        This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.
        
        If you did not request this code, please ignore this email and ensure your account is secure.
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        return EmailService.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    def send_password_reset_email(to_email: str, reset_code: str, username: str = None) -> bool:
        """
        Send password reset email
        
        Args:
            to_email: Recipient email address
            reset_code: Reset code to send
            username: User's name (optional)
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Reset Your {settings.APP_NAME} Password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .container {{
                    background-color: #f9f9f9;
                    border-radius: 10px;
                    padding: 30px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    color: #2196F3;
                    margin-bottom: 30px;
                }}
                .code-box {{
                    background-color: #fff;
                    border: 2px solid #2196F3;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .reset-code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #2196F3;
                    letter-spacing: 8px;
                    font-family: 'Courier New', monospace;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #777;
                }}
                .warning {{
                    color: #f44336;
                    font-size: 14px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{settings.APP_NAME}</h1>
                    <h2>Password Reset Request</h2>
                </div>
                
                <p>Hello{' ' + username if username else ''},</p>
                
                <p>We received a request to reset your password. Please use the following code to reset your password:</p>
                
                <div class="code-box">
                    <div class="reset-code">{reset_code}</div>
                </div>
                
                <p>This code will expire in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
                
                <p class="warning">🔒 If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
                
                <p>Best regards,<br>
                The {settings.APP_NAME} Team</p>
                
                <div class="footer">
                    <p>This is an automated message, please do not reply to this email.</p>
                    <p>&copy; {datetime.now().year} {settings.APP_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        {settings.APP_NAME} - Password Reset Request
        
        Hello{' ' + username if username else ''},
        
        We received a request to reset your password. Please use the following code to reset your password:
        
        {reset_code}
        
        This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.
        
        If you did not request a password reset, please ignore this email and your password will remain unchanged.
        
        Best regards,
        The {settings.APP_NAME} Team
        """
        
        return EmailService.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
