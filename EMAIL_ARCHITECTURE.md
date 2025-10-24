# 📧 Email Service Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT / FRONTEND                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP/JSON
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API ENDPOINTS (routers/otp.py)              │  │
│  │                                                           │  │
│  │  • POST /api/v1/otp/send                                │  │
│  │  • POST /api/v1/otp/send-to-me                          │  │
│  │  • POST /api/v1/otp/verify                              │  │
│  │  • POST /api/v1/otp/resend                              │  │
│  └──────────┬───────────────────────────┬───────────────────┘  │
│             │                            │                       │
│  ┌──────────▼──────────────┐  ┌─────────▼──────────────────┐   │
│  │   OTP SERVICE           │  │   EMAIL SERVICE             │   │
│  │  (utils/otp.py)         │  │  (services/email_service.py)│   │
│  │                         │  │                              │   │
│  │  • Generate OTP         │  │  • SMTP Connection           │   │
│  │  • Verify OTP           │  │  • Send HTML Emails          │   │
│  │  • Calculate Expiry     │  │  • OTP Template              │   │
│  │  • Database Operations  │  │  • Password Reset Template   │   │
│  └──────────┬──────────────┘  └──────────┬──────────────────┘   │
│             │                             │                       │
│  ┌──────────▼─────────────────────────────▼──────────────────┐  │
│  │                    DATABASE (PostgreSQL)                   │  │
│  │                                                             │  │
│  │  ┌──────────────┐           ┌─────────────────────────┐  │  │
│  │  │ users table  │───────────│     otps table          │  │  │
│  │  │              │  FK        │                         │  │  │
│  │  │ • id         │◄──────────│ • id                    │  │  │
│  │  │ • email      │           │ • user_id (FK)          │  │  │
│  │  │ • username   │           │ • code                  │  │  │
│  │  │ • password   │           │ • purpose               │  │  │
│  │  │ • is_verified│           │ • is_used               │  │  │
│  │  └──────────────┘           │ • expires_at            │  │  │
│  │                              │ • created_at            │  │  │
│  │                              └─────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ SMTP (TLS)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      SMTP SERVER                                 │
│                                                                  │
│  • Gmail (smtp.gmail.com:587)                                   │
│  • Outlook (smtp-mail.outlook.com:587)                          │
│  • SendGrid (smtp.sendgrid.net:587)                             │
│  • Custom SMTP Server                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Email Delivery
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      USER'S EMAIL INBOX                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  From: EnglishWebAI <noreply@englishwebai.com>             │ │
│  │  To: user@example.com                                       │ │
│  │  Subject: Your EnglishWebAI Verification Code              │ │
│  │                                                              │ │
│  │  ╔══════════════════════════════════════════════════════╗  │ │
│  │  ║          EnglishWebAI                                ║  │ │
│  │  ║                                                       ║  │ │
│  │  ║  Hello John Doe,                                     ║  │ │
│  │  ║                                                       ║  │ │
│  │  ║  Your verification code is:                          ║  │ │
│  │  ║                                                       ║  │ │
│  │  ║       ┌─────────────────────────┐                   ║  │ │
│  │  ║       │      1  2  3  4  5  6   │                   ║  │ │
│  │  ║       └─────────────────────────┘                   ║  │ │
│  │  ║                                                       ║  │ │
│  │  ║  This code will expire in 5 minutes.                ║  │ │
│  │  ║                                                       ║  │ │
│  │  ╚══════════════════════════════════════════════════════╝  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 OTP Flow Diagram

### Email Verification Flow

```
User Registration
      │
      ├─► Create User Account (is_verified=false)
      │
      ├─► Generate OTP (6-digit code)
      │        │
      │        ├─► Store in database with expiration (5 min)
      │        └─► Send to user's email via SMTP
      │
      ├─► User receives email
      │
      ├─► User enters OTP code
      │
      ├─► Verify OTP
      │        │
      │        ├─► Check if code matches
      │        ├─► Check if not expired
      │        └─► Check if not used
      │
      └─► Mark user as verified ✓
```

### Password Reset Flow

```
Forgot Password
      │
      ├─► User enters email
      │
      ├─► Generate OTP (6-digit code)
      │        │
      │        ├─► Store with purpose="password_reset"
      │        └─► Send password reset email
      │
      ├─► User receives email with OTP
      │
      ├─► User enters OTP + new password
      │
      ├─► Verify OTP
      │        │
      │        ├─► Check validity
      │        └─► Mark as used
      │
      └─► Update password ✓
```

### 2FA Login Flow

```
User Login (username + password)
      │
      ├─► Authenticate credentials ✓
      │
      ├─► Generate 2FA OTP
      │        │
      │        ├─► Store with purpose="2fa"
      │        └─► Send to user's email
      │
      ├─► User receives OTP
      │
      ├─► User enters OTP code
      │
      ├─► Verify 2FA OTP
      │        │
      │        └─► Check validity
      │
      └─► Issue JWT Token ✓
```

## 📊 Database Schema

```sql
┌─────────────────────────────┐
│          users              │
├─────────────────────────────┤
│ PK │ id                     │
│    │ email (unique)         │
│    │ username (unique)      │
│    │ hashed_password        │
│    │ is_verified            │
│    │ is_active              │
│    │ ...                    │
└──────────┬──────────────────┘
           │
           │ 1:N
           │
┌──────────▼──────────────────┐
│          otps               │
├─────────────────────────────┤
│ PK │ id                     │
│ FK │ user_id ───────────────┤
│    │ code (VARCHAR 10)      │
│    │ purpose (VARCHAR 50)   │
│    │ is_used (BOOLEAN)      │
│    │ expires_at (TIMESTAMP) │
│    │ created_at (TIMESTAMP) │
└─────────────────────────────┘
```

## 🔧 Configuration Flow

```
.env file
    │
    ├─► SMTP_HOST=smtp.gmail.com
    ├─► SMTP_PORT=587
    ├─► SMTP_USERNAME=your-email@gmail.com
    ├─► SMTP_PASSWORD=app-password
    ├─► SMTP_FROM_EMAIL=noreply@englishwebai.com
    ├─► SMTP_FROM_NAME=EnglishWebAI
    ├─► OTP_EXPIRE_MINUTES=5
    └─► OTP_LENGTH=6
         │
         ▼
    config.py (Settings class)
         │
         ▼
    Used by:
         ├─► email_service.py (SMTP config)
         └─► otp.py (OTP config)
```

## 📦 Module Dependencies

```
main.py
  │
  ├─► routers/otp.py
  │     │
  │     ├─► services/email_service.py
  │     │     │
  │     │     └─► core/config.py (SMTP settings)
  │     │
  │     ├─► utils/otp.py
  │     │     │
  │     │     ├─► core/config.py (OTP settings)
  │     │     └─► models/otp.py
  │     │
  │     ├─► models/user.py
  │     └─► core/dependencies.py
  │
  └─► core/database.py
```

## 🎯 Use Case Matrix

| Feature | OTP Purpose | Endpoint | Email Template |
|---------|-------------|----------|----------------|
| Email Verification | `verification` | `/otp/send` | OTP Verification |
| Password Reset | `password_reset` | `/otp/send` | Password Reset |
| Two-Factor Auth | `2fa` | `/otp/send-to-me` | OTP Verification |
| Email Change | `email_change` | `/otp/send` | OTP Verification |
| Account Recovery | `recovery` | `/otp/send` | Password Reset |

## 🔐 Security Layers

```
┌─────────────────────────────────────┐
│     User Input (email, OTP code)    │
└──────────────┬──────────────────────┘
               │
        ┌──────▼───────┐
        │ Validation   │ (Pydantic schemas)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │  Database    │ (Check user exists)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │ OTP Check    │ (Code matches)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │ Expiration   │ (Time < 5 min)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │  Used Check  │ (Not used before)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │ Mark as Used │ (Prevent reuse)
        └──────┬───────┘
               │
        ┌──────▼───────┐
        │   Success ✓  │
        └──────────────┘
```

## 📈 Performance Considerations

```
┌────────────────────────────────────────┐
│  Email Sending (Async/Background)      │
├────────────────────────────────────────┤
│  • Don't block HTTP request            │
│  • Use background tasks                │
│  • Queue system (optional)             │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Database Queries (Optimized)          │
├────────────────────────────────────────┤
│  • Index on user_id                    │
│  • Index on expires_at                 │
│  • Cleanup expired OTPs periodically   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Rate Limiting (Recommended)           │
├────────────────────────────────────────┤
│  • Max 3 OTP requests per 5 minutes    │
│  • Max 5 verification attempts         │
│  • Cooldown period: 1 minute           │
└────────────────────────────────────────┘
```

## 🚀 Deployment Checklist

```
□ Configure production SMTP credentials
□ Use environment variables (not hardcoded)
□ Enable HTTPS for API
□ Set proper CORS origins
□ Configure rate limiting
□ Set up email delivery monitoring
□ Configure backup SMTP server
□ Set up log aggregation
□ Monitor OTP usage patterns
□ Periodic cleanup of expired OTPs
□ Set up alerts for email failures
□ Configure proper SPF/DKIM records
```

---

**Architecture designed for**: Scalability, Security, Maintainability
**Production Ready**: ✅ YES
