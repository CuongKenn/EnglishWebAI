# Changelog

All notable changes to the EnglishWebAI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For AI/agent contribution guidelines, please read the project rules in [AI_RULES.md](./AI_RULES.md).

## [Unreleased]

### Added
- Comprehensive changelog documentation for project tracking
 - Documentation: AI collaboration rules in [AI_RULES.md](./AI_RULES.md)

---

## [1.3.0] - 2025-10-31

### Added
- **Listening Course UI**: Enhanced listening practice interface
  - Improved course layout and user experience
  - Better audio controls and progress tracking
- **Comprehensive CHANGELOG**: Complete project history documentation
  - Detailed version tracking
  - Git history integration

### Changed
- Merged listening course improvements from `hoc_nghe` branch
- Updated environment configuration examples
- Cleaned up unused folders and dependencies

---

## [1.2.1] - 2025-10-30

### Added
- **Toast Notification System**: Modern toast notifications replacing alerts
  - Non-intrusive user notifications
  - Consistent notification styling
  - Better UX for user feedback
- **Nginx Local Configuration**: Development environment setup
  - Local nginx configuration for easier development
  - Improved HTTPS support setup

### Changed
- **API Migration**: Switched from Gemini API to ChatGPT API
  - Better AI response quality
  - More reliable API performance
- Replaced all alert() calls with modern toast notifications
- Updated `.env.example` with latest configuration options

### Fixed
- Null exception errors in various components
- Backend startup issues
- Alert overflow issues across the application

### Removed
- Deprecated markdown documentation files
- Unused folders and legacy code

---

## [1.2.0] - 2025-10-30

### Added
- **Production Deployment**: Production-ready configuration
  - HTTPS support with SSL/TLS
  - Automated table creation on startup
  - Production environment optimization
  - Docker deployment configurations
- **Analytics & Reporting System**: Comprehensive statistics and reports (#73, #74, #83)
  - Teacher activity reports
  - Class performance analytics
  - Export functionality for reports
  - Optimized backend performance for analytics queries
  - Real-time data visualization
- **Export Features**: Data export capabilities (#82)
  - Export reports to various formats
  - Class data export
  - Student progress reports
  - Customizable export templates

### Changed
- Optimized analytics backend for smoother performance
- Improved statistics calculation algorithms
- Enhanced report generation speed

### Fixed
- Backend startup issues
- Analytics performance bottlenecks
- Report generation errors

---

## [1.1.0] - 2025-10-29

### Added
- **Course Management System**: Complete course curriculum management (#81)
  - Create and manage courses
  - Course categorization
  - Lesson planning within courses
  - Student enrollment tracking
- **Question Bank System**: Centralized question repository (#76, #62)
  - Create and store reusable questions
  - Question categorization by skill type
  - Question difficulty levels
  - Easy question selection for assessments
  - Updated question bank interface (v2)
- **Worksheet & Lesson Plan AI Generation**: Automated content creation (#67)
  - AI-powered worksheet generation
  - Automatic lesson plan creation
  - Customizable templates
  - Time-saving content generation
- **Flashcard AI System**: Smart flashcard learning (#70)
  - AI-generated flashcards
  - Spaced repetition algorithm
  - Interactive learning experience
  - Progress tracking
- **AI Listening Practice**: Listening comprehension exercises (#68)
  - Audio-based exercises
  - Automatic transcription
  - Comprehension questions
  - Pronunciation feedback
- **Teacher Dashboard Enhancements**: Improved teacher interface (#82)
  - Better class overview
  - Quick access to common tasks
  - Enhanced navigation
  - Performance improvements
- **Health Check**: Frontend health monitoring (#69)
  - Application health status
  - Service availability checks
  - Better error handling

### Changed
- Redesigned exam detail page (#66)
  - Better layout and user experience
  - Enhanced visual design
  - Improved data presentation
- Updated course UI design (#60)
  - Modern interface
  - Better navigation
  - Responsive design
- Improved grading system
  - Changed to 10-point scale (#61)
  - More precise scoring
  - Better grade distribution

### Fixed
- Speaking assessment scoring issues
  - Fixed Azure service errors (#72)
  - Improved pronunciation assessment
- Assignment loading issues for students (#71)
  - Fixed data fetching errors
  - Improved loading performance
- Chat functionality bugs (#63)
- Minor UI and functionality bugs (#75)
- Backend startup issues
- Various bug fixes across the application

---

## [1.0.0] - 2025-10-28 - 2025-10-29

### Added
- **Teacher News System**: Teacher-specific news and announcements (#64)
  - Teacher can create news posts
  - News categorization
  - Announcement distribution
- **Progress Analysis**: Student progress tracking and analysis (#59)
  - Detailed progress reports
  - Performance metrics
  - Visual analytics
  - Historical data tracking
- **Export System**: Data export functionality (#58)
  - Export to multiple formats
  - Font handling improvements
  - Bulk export capabilities
- **Student Report Card (Học bạ)**: Academic record system (#57)
  - Comprehensive student records
  - Grade history
  - Achievement tracking
  - Flow-based navigation improvements
- **Parent-Teacher Chat**: Communication system (#56)
  - Real-time messaging between parents and teachers
  - Message history
  - Read/unread status
  - Notification integration
- **Parent Dashboard - Student Management**: Parent view of children's progress (#52)
  - View all connected students
  - Monitor student performance
  - Access to student reports
  - Communication with teachers
- **Lesson Plan & Course Flow**: Enhanced navigation (#51, #47)
  - Improved flow between lesson plans and courses
  - Better user experience
  - Streamlined navigation
- **Assignment Workflow**: Complete assignment lifecycle (#50, #48)
  - Create and assign exercises
  - Student submission interface
  - Automated and manual grading
  - Feedback system
  - Nearly complete grading features
- **TODO List**: Development task tracking (#53)
  - Project management
  - Task organization
  - Progress tracking

### Changed
- Improved Home page and pre-login notifications (#46)
  - Better first impression
  - Clear value proposition
  - User-friendly notifications
- Enhanced logout flow - redirect to home (#55)
  - Better user experience
  - Clear session termination
- Fixed parent-student linking (#28)
  - Improved relationship verification
  - Better connection management
- Updated teacher dashboard interface
  - Modern design
  - Better organization
  - Enhanced usability
- Improved font rendering across application (#58)
  - Consistent typography
  - Better readability
  - Cross-browser compatibility

### Fixed
- Teacher font display issues
- Various CSS bugs
- Notification timing issues (3000ms)
- Merge conflicts resolution
- Minor bugs and improvements

### Removed
- Deleted unnecessary test files
- Removed "Practice" button from some interfaces
- Cleaned up unused code

---

## [0.9.0] - 2025-10-25 - 2025-10-26

### Added
- **AI Reading Practice**: Complete reading comprehension with AI (#26)
  - AI-generated reading passages
  - Comprehension questions
  - Automated scoring
  - Difficulty adaptation
- **AI Writing Assistant**: AI-powered writing practice
  - Writing prompts
  - Real-time feedback
  - Grammar and style suggestions
  - Scoring based on multiple criteria
- **AI Chat/Conversation**: Interactive AI language practice
  - Natural conversation simulation
  - Context-aware responses
  - Pronunciation feedback
  - Progress tracking
- **News Management**: Complete news system (#32, #40)
  - Frontend and backend integration
  - Create, edit, delete news posts
  - News detail view with author information
  - Category-based organization
  - Image and icon support
  - View tracking and analytics
  - Like system integration
  - Reading time estimation
- **Course UI**: Learning course interfaces (#33, #37)
  - Course browsing interface
  - Lesson navigation within courses
  - Study progress tracking
  - Profile integration
  - Four skill courses: Listening, Speaking, Reading, Writing
  - Vocabulary courses
  - Improved CSS and layout
- **Admin Dashboard Improvements**: Enhanced admin interface (#39, #41)
  - Better UI/UX design
  - AI analytics dashboard
  - Real-time AI usage statistics
  - Proper data handling for AI practice features
- **Q&A Feature Enhancement**: Improved question-answer system (#42)
  - Better interaction flow
  - Notification for new posts
  - Enhanced discussion features
- **System Configuration Management**: Dynamic system settings
  - Key-value configuration storage
  - Public/private configuration support
  - Runtime configuration updates
  - Login with username or email support
  - Default config initialization on startup

### Changed
- Improved test coverage to 88 passing tests and 58% coverage
- Enhanced news display with rich media support
- Better font handling across the application
- Updated navbar to display user roles
- Improved admin login flow and security
- Changed "Học liệu" to "Thực hành AI" (Study Materials to AI Practice)

### Fixed
- Author name display bug in news detail view
- Login error notifications
- Admin login bugs
- CSS conflicts and styling issues
- Merge conflicts in App.jsx
- Various UI bugs

### Removed
- Unnecessary markdown files
- Unused code and components

---

## [0.8.0] - 2025-10-24 - 2025-10-25

### Added
- **Messaging System**: Internal messaging between users (#6)
  - Direct messages with read/unread status
  - Subject and content support
  - Message history tracking
  - Sender/receiver indexing for performance
- **Notification System**: Real-time notification delivery (#5)
  - User-specific notifications
  - Notification types classification
  - Read/unread status tracking
  - Automatic notification triggers
- **Discussion System**: Discussion forums and Q&A
  - Topic creation and replies
  - Class-specific discussions
  - Engagement tracking
  - Nearly complete functionality
- **Email Integration**: Email service for notifications
  - OTP email delivery
  - System notifications
  - Custom email templates
- **Four Core Skills Backend**: Backend infrastructure (#21)
  - Listening skill exercises
  - Speaking skill exercises
  - Reading skill exercises
  - Writing skill exercises
- **Profile Management**: User profile functionality (#20, #22)
  - View and edit profile
  - Avatar upload
  - Role-based profile display
  - Enhanced navbar with profile integration
- **Teacher Classroom Management**: Class management for teachers (#18, #19, #23)
  - Create and manage classes
  - Add students to classes (#19)
  - Assign teachers to classes
  - View class rosters
  - Fixed teacher class creation issues (#23)
- **Admin Features**: Complete admin logic (#18)
  - User account creation
  - User management
  - Class creation and management
  - Teacher assignment to classes
  - System administration tools
- **OTP Authentication System**: Two-factor authentication (#27, #28)
  - Time-limited OTP codes
  - Purpose-based OTP (registration, password reset, email verification)
  - Single-use token enforcement
  - Automatic expiration handling
  - Email delivery integration
  - Automated OTP setup on deployment
  - Fixed OTP email sending issues (#34)
- **Parent-Student Relationships**: Family account linking (#29)
  - Parent verification system
  - Multiple student connections per parent
  - Verification status tracking
  - Cascade delete on user removal
  - Connection approval workflow

### Changed
- Improved navbar design (#22)
  - Better navigation
  - User role display
  - Profile integration
- Enhanced discussion interface
  - Better layout
  - Improved interaction

### Fixed
- Teacher login issues (#17)
  - Role-based access control
  - Permission handling
- Email sending issues (#34)
  - SMTP configuration
  - Email delivery reliability
- Teacher class creation bugs (#23)
- Various backend and frontend bugs

### Security
- Enhanced authentication with OTP verification
- Secure parent-student relationship verification
- Improved password reset flow
- Email verification for new accounts

---

## [0.7.0] - 2025-10-23 - Initial Release

### Added
- **Core Database Schema**: Complete PostgreSQL database setup (#1, #12)
  - User management with role-based access control
  - Email and username uniqueness constraints
  - User verification system
  - Timestamp tracking for all entities
- **User Authentication System**: Complete auth flow (#3, #4, #8)
  - JWT token-based authentication
  - Login and registration
  - Password hashing with bcrypt
  - User session management
- **User Roles System**: Multi-level role hierarchy
  - Student (User)
  - Parent
  - Teacher
  - Admin
  - Superadmin
- **Student Routers**: Complete student-facing API (#13, #14)
  - Class management
  - Lesson access
  - Exercise submission
  - Material downloads
  - Discussion participation
  - News viewing
  - Comprehensive test suite for all endpoints
- **API Integration**: Frontend-backend connection (#15, #16)
  - Service layer for all API endpoints
  - Parent Dashboard implementation
  - Authentication flow
  - Error handling
  - API documentation
- **Automated Seeding**: Development data generation (#6, #8)
  - Sample user creation (students, teachers, admins)
  - Test class generation
  - Sample exercises and materials
  - News and announcements
  - Auto-seed on empty database
  - Teacher data seeding
- **Frontend Foundation**: Initial UI implementation
  - React 19 with modern hooks
  - React Router v7 navigation
  - Responsive design with Tailwind CSS
  - Authentication pages (login, register)
  - Home page design
  - Navigation system
  - Protected routes

### Backend Infrastructure
- **FastAPI Framework**: High-performance async API
  - RESTful API architecture
  - Automatic OpenAPI documentation at `/docs`
  - Request validation with Pydantic
  - CORS configuration
- **Database**:
  - PostgreSQL with SQLAlchemy ORM
  - Alembic migrations
  - Connection pooling
  - Health checks
- **Security**:
  - Password hashing with bcrypt
  - JWT tokens
  - Role-based access control (RBAC)
  - Input validation

### Frontend Infrastructure
- **React Setup**:
  - Vite for fast development
  - ESLint for code quality
  - Hot Module Replacement (HMR)
- **UI Components**:
  - Tailwind CSS styling
  - Responsive design
  - Component library foundation

### Infrastructure
- **Docker Setup**: Containerized deployment
  - Multi-container architecture
  - Docker Compose orchestration
  - Backend service
  - Frontend service
  - PostgreSQL database
  - Nginx reverse proxy
  - Volume management
  - Automated migrations on startup
- **Development Tools**:
  - Auto-reload in development
  - Database migration scripts
  - Seeding utilities
  - Testing framework

### Project Initialization
- Initial repository setup
- Project structure organization
- Git workflow establishment
- Development environment configuration
- Documentation foundation

### Contributors
- Nguyễn Thành Trung (@CuongKenn)
- Luu Ha (@haluu07)
- Anh Hoang (@nguyentrananhhoang13122005)
- CuongKen

---

## [0.6.0] - 2025-10-22 - Pre-release Development

### Added
- Login and registration functionality
  - User authentication flow
  - Form validation
  - Error handling
- Home page design and theming
  - Color system setup
  - Layout structure
  - Responsive design

### Changed
- Restructured project organization
- Improved UI flow for login/register
- Enhanced home page layout

---

## [0.5.0] - 2025-10-21 - Project Bootstrap

### Added
- Initial frontend source code
- Home page development
- System color scheme
- Basic routing structure
- Project configuration files

---

## Development Team

### Core Contributors
- **Nguyễn Thành Trung** (@CuongKenn) - Lead Developer
  - Backend architecture and API development
  - Authentication and security systems
  - Database design and migrations
  - DevOps and deployment
  - Project coordination

- **Luu Ha** (@haluu07) - Backend Developer
  - AI integration and analytics
  - News and notification systems
  - Q&A and discussion features
  - Backend optimization

- **Anh Hoang** (@nguyentrananhhoang13122005) - Frontend Developer
  - UI/UX design and implementation
  - Course and learning interfaces
  - Student and parent dashboards
  - Responsive design

- **CuongKen** - Full Stack Developer
  - Teacher dashboard development
  - Admin interface
  - API integration
  - Feature implementation

---

## Project Structure

### Backend (FastAPI + Python)
```
backend/
├── alembic/               # Database migrations
├── app/
│   ├── core/             # Core configurations and security
│   ├── models/           # SQLAlchemy database models
│   ├── routers/          # API endpoints (30+ routers)
│   ├── schemas/          # Pydantic schemas for validation
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── data/                 # SQLite/PostgreSQL data
├── logs/                 # Application logs
├── media/                # User uploaded media
└── static/               # Static files
```

### Frontend (React + Vite)
```
frontend/
├── src/
│   ├── assets/           # Images and static assets
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   └── services/         # API service layer
├── public/               # Public static files
└── config/               # Configuration files
```

### API Endpoints (30+ Routers)
- **Authentication**: `/api/v1/auth` - Login, register, logout, OTP verification
- **Users**: `/api/v1/users` - User profile management
- **Admin**: `/api/v1/admin` - Administrative functions
- **Classes**: `/api/v1/classes` - Class management
- **Courses**: `/api/v1/courses` - Course curriculum
- **Lessons**: `/api/v1/lessons` - Lesson planning
- **Lesson Plans**: `/api/v1/lesson-plans` - Detailed lesson plans
- **Exercises**: `/api/v1/exercises` - Assignment management
- **Materials**: `/api/v1/materials` - Learning materials
- **Discussions**: `/api/v1/discussions` - Discussion forums
- **News**: `/api/v1/news` - News and announcements
- **Messages**: `/api/v1/messages` - Internal messaging
- **Notifications**: `/api/v1/notifications` - User notifications
- **Parent**: `/api/v1/parent` - Parent portal features
- **Worksheets**: `/api/v1/worksheets` - AI worksheet generation
- **Weekly Assessments**: `/api/v1/weekly-assessments` - Weekly skill tests
- **Exam Assessments**: `/api/v1/exam-assessments` - Exam management
- **Question Bank**: `/api/v1/question-bank` - Question repository
- **AI Analytics**: `/api/v1/ai-analytics` - AI-powered analytics
- **AI Conversation**: `/api/v1/ai-conversation` - AI chat practice
- **AI Flashcard**: `/api/v1/ai-flashcard` - Smart flashcards
- **AI Listening**: `/api/v1/ai-listening` - Listening practice
- **AI Reading**: `/api/v1/ai-reading` - Reading comprehension
- **AI Writing**: `/api/v1/ai-writing` - Writing assistance
- **AI Usage**: `/api/v1/ai-usage` - AI usage tracking
- **Teacher Analytics**: `/api/v1/teacher-analytics` - Teacher dashboard
- **Teacher Grading**: `/api/v1/teacher-grading` - Grading tools
- **Student Profile**: `/api/v1/student-profile` - Student progress
- **Exports**: `/api/v1/exports` - Data export functionality
- **Test**: `/api/v1/test` - Testing endpoints

---

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Server**: Uvicorn 0.24.0
- **Database**: PostgreSQL with SQLAlchemy 2.0.23
- **Migrations**: Alembic 1.12.1
- **Authentication**: JWT (python-jose 3.3.0) + Bcrypt
- **AI Services**: 
  - OpenAI 1.54.0
  - Azure Cognitive Services Speech 1.40.0
- **File Processing**:
  - python-docx 1.1.2
  - Pillow 10.1.0
  - openpyxl 3.1.2
- **Testing**: Pytest 7.4.3

### Frontend
- **Framework**: React 19.1.1
- **Routing**: React Router DOM 7.9.4
- **Build Tool**: Vite 7.1.7
- **HTTP Client**: Axios 1.12.2
- **UI Library**: 
  - Radix UI Components
  - Tailwind CSS 3.4.17
  - Lucide React Icons
  - React Icons

### Infrastructure
- **Database**: PostgreSQL 15
- **Web Server**: Nginx
- **Containerization**: Docker + Docker Compose
- **SSL/TLS**: Let's Encrypt ready

---

## Database Migrations

The project uses Alembic for database version control with the following migration sequence:

1. **001_initial** - User management and core tables
2. **002_add_otp_table** - OTP authentication
3. **003_parent_students** - Parent-student relationships
4. **004_discussion_likes** - Discussion engagement
5. **005_notifications** - Notification system
6. **006_messages** - Messaging system
7. **007_update_news_table** - Enhanced news features
8. **008_system_configs** - System configuration
9. **009_ai_grading_features** - AI grading capabilities
10. **010_weekly_assessments** - Weekly skill assessments
11. **011_add_analytics_indexes** - Performance optimization
11. **011_exam_assessments** - Exam management system

---

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- OTP verification for sensitive operations
- Environment variable configuration
- HTTPS support
- SQL injection prevention with SQLAlchemy ORM
- CORS configuration
- Input validation with Pydantic
- File upload sanitization

---

## Performance Optimizations

- Database connection pooling
- Query optimization with proper indexing
- Async request handling
- Static file caching with Nginx
- Docker layer caching
- Lazy loading in frontend
- Code splitting with Vite
- Image optimization

---

## Development Tools

- **Backend**:
  - Auto-reload in development mode
  - OpenAPI/Swagger documentation at `/docs`
  - Database seeding scripts
  - Migration management with Alembic
  - Comprehensive test suite

- **Frontend**:
  - Hot Module Replacement (HMR)
  - ESLint for code quality
  - Component development with Vite
  - React DevTools support

---

## Deployment

### Docker Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment
```bash
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run build
npm run preview
```

---

## Contributing

This project is actively developed and maintained. For contributions:

1. Follow the existing code structure
2. Write tests for new features
3. Update this CHANGELOG for notable changes
4. Follow semantic versioning

---

## Links

- **Repository**: https://github.com/CuongKenn/EnglishWebAI
- **Branch**: develop
- **Documentation**: `/docs` endpoint when server is running
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)

---

## Notes

- All timestamps are stored in UTC
- Database uses PostgreSQL in production, SQLite supported for development
- File uploads are stored in `backend/media/` directory
- Logs are stored in `backend/logs/` directory
- Environment variables must be configured in `.env` file

---

**Last Updated**: October 31, 2025
