import smtplib
import ssl
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from app.core.config import settings
from datetime import datetime

# Configure logger for email service
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Configure file handler
file_handler = logging.FileHandler(os.path.join(logs_dir, 'email_service.log'))
file_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(file_handler)


class EmailService:
    """Service for sending emails via SMTP"""
    
    @staticmethod
    def send_test_email(to_email: str) -> bool:
        """
        Send a test email to verify email service configuration
        
        Args:
            to_email: Recipient email address
            
        Returns:
            bool: True if email sent successfully
        """
        logger.info(f"Sending test email to {to_email}")
        
        subject = f"Test Email from {settings.APP_NAME}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{settings.APP_NAME}</h1>
                </div>
                <div class="content">
                    <h2>Test Email</h2>
                    <p>This is a test email to verify the email service configuration.</p>
                    <p>If you received this email, it means the email service is working correctly.</p>
                    <p>Sent at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Test Email from {settings.APP_NAME}
        
        This is a test email to verify the email service configuration.
        If you received this email, it means the email service is working correctly.
        
        Sent at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        """
        
        return EmailService.send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )
    
    @staticmethod
    def _create_smtp_connection():
        """Create and return SMTP connection"""
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        try:
            logger.info(f"Attempting to connect to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}")
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            
            logger.info("Initiating TLS connection")
            server.starttls(context=context)
            
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                logger.info(f"Authenticating with SMTP server using username: {settings.SMTP_USERNAME}")
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                logger.info("SMTP authentication successful")
            
            return server
        except Exception as e:
            logger.error(f"SMTP connection failed: {str(e)}")
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
            logger.info(f"Preparing to send email with subject: {subject}")
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            
            # Handle single or multiple recipients
            if isinstance(to_email, str):
                message["To"] = to_email
                recipients = [to_email]
                logger.info(f"Single recipient: {to_email}")
            else:
                message["To"] = ", ".join(to_email)
                recipients = to_email
                logger.info(f"Multiple recipients: {len(recipients)} addresses")
            
            # Add text content if provided
            if text_content:
                logger.debug("Adding plain text content to email")
                part1 = MIMEText(text_content, "plain")
                message.attach(part1)
            
            # Add HTML content
            logger.debug("Adding HTML content to email")
            part2 = MIMEText(html_content, "html")
            message.attach(part2)
            
            # Send email
            logger.info("Establishing SMTP connection")
            with EmailService._create_smtp_connection() as server:
                logger.info(f"Sending email from {settings.SMTP_FROM_EMAIL} to {len(recipients)} recipient(s)")
                server.sendmail(settings.SMTP_FROM_EMAIL, recipients, message.as_string())
                logger.info("Email sent successfully")
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}", exc_info=True)
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
        logger.info(f"Preparing OTP email for {to_email}")
        if username:
            logger.info(f"Sending OTP to user: {username}")
        logger.debug(f"OTP code generated: {otp_code[:2]}{'*' * (len(otp_code)-4)}{otp_code[-2:]}")  # Log partially masked OTP
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
        logger.info(f"Preparing password reset email for {to_email}")
        if username:
            logger.info(f"Sending password reset to user: {username}")
        logger.debug(f"Reset code generated: {reset_code[:2]}{'*' * (len(reset_code)-4)}{reset_code[-2:]}")  # Log partially masked reset code
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
