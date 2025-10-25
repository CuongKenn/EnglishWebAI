from app.services.email_service import EmailService
from datetime import datetime

def send_test_mail(to_email: str):
    subject = "Test Email từ EnglishWebAI"
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
                <h1>EnglishWebAI</h1>
            </div>
            <div class="content">
                <h2>Email Test</h2>
                <p>Đây là email test từ hệ thống EnglishWebAI.</p>
                <p>Nếu bạn nhận được email này, có nghĩa là dịch vụ email đang hoạt động bình thường.</p>
                <p>Thời gian gửi: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Email Test từ EnglishWebAI
    
    Đây là email test từ hệ thống EnglishWebAI.
    Nếu bạn nhận được email này, có nghĩa là dịch vụ email đang hoạt động bình thường.
    
    Thời gian gửi: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    """
    
    result = EmailService.send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content
    )
    
    if result:
        print(f"✅ Email đã được gửi thành công đến {to_email}")
    else:
        print(f"❌ Không thể gửi email đến {to_email}")

if __name__ == "__main__":
    send_test_mail("trunglqm07@gmail.com")