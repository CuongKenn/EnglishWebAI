// src/App.jsx

import React, { useState, lazy, Suspense } from 'react'; // Add lazy and Suspense
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Import ErrorBoundary
import ErrorBoundary from './components/ErrorBoundary';

// Import Layout và các trang (critical - load immediately)
import Layout from './components/Layout/Layout';
import HomeStudent from './pages/HomeStudent/HomeStudent';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';

// Lazy load heavy components
const JoinClass = lazy(() => import('./pages/JoinClass/JoinClass'));
const Materials = lazy(() => import('./pages/Materials/Materials'));
const Discussion = lazy(() => import('./pages/Discussion/Discussion'));
const Exercises = lazy(() => import('./pages/Exercises/Exercises'));
const News = lazy(() => import('./pages/News/News'));
const NewsDetail = lazy(() => import('./pages/News/NewsDetail'));
const Lessons = lazy(() => import('./pages/Lessons/Lessons'));
const ClassContent = lazy(() => import('./pages/ClassContent/ClassContent'));
const AIPractice = lazy(() => import('./pages/student/AIPractice'));
const MyClasses = lazy(() => import('./pages/student/MyClasses/MyClasses'));
const ExerciseHub = lazy(() => import('./pages/student/ExerciseHub/ExerciseHub'));
const DoExercise = lazy(() => import('./pages/student/DoExercise/DoExercise'));
const TakeExam = lazy(() => import('./pages/student/TakeExam/TakeExam'));
const WritingAI = lazy(() => import('./components/ai/WritingAI').then(m => ({ default: m.WritingAI })));
const ReadingAI = lazy(() => import('./components/ai/ReadingAI').then(m => ({ default: m.ReadingAI })));
const CourseContentPage = lazy(() => import('./pages/CourseContentPage/CourseContentPage'));
const MyCourses = lazy(() => import('./pages/MyCourses/MyCourses'));
const StudyPlan = lazy(() => import('./pages/StudyPlan/StudyPlan'));
const LearningProfile = lazy(() => import('./pages/LearningProfile/LearningProfile'));
const SpeakingExercise = lazy(() => import('./pages/SpeakingExercise/SpeakingExercise'));
const SpeakingExerciseDemo = lazy(() => import('./pages/SpeakingExercise/SpeakingExerciseDemo'));
const SpeakingExerciseShowcase = lazy(() => import('./pages/SpeakingExercise/SpeakingExerciseShowcase'));
const ReadingExercise = lazy(() => import('./pages/ReadingExercise/ReadingExercise'));
const WritingExercise = lazy(() => import('./pages/WritingExercise/WritingExercise'));
const ListeningExercise = lazy(() => import('./pages/ListeningExercise/ListeningExercise'));
const CourseLessons = lazy(() => import('./pages/CourseLessons/CourseLessons'));

// Lazy load Admin Pages
const AdminDashboardV2 = lazy(() => import('./pages/Admin/AdminDashboardV2/AdminDashboardV2'));

// Lazy load Teacher Pages
const TeacherDashboardV3 = lazy(() => import('./pages/Teacher/TeacherDashboardV3/TeacherDashboardV3'));
const TeacherMaterials = lazy(() => import('./pages/Teacher/TeacherMaterials/TeacherMaterials'));
const SubmissionGradingPage = lazy(() => import('./pages/Teacher/Grading/SubmissionGradingPage'));

// Lazy load Parent Pages
const ParentDashboardV2 = lazy(() => import('./pages/Parent/ParentDashboardV2/ParentDashboardV2'));
const TrackProgressPage = lazy(() => import('./pages/Parent/TrackProgress/TrackProgressPage'));
const NotificationsPage = lazy(() => import('./pages/Parent/Notifications/NotificationsPage'));
const TeacherCommunication = lazy(() => import('./pages/Parent/TeacherCommunication/TeacherCommunication'));

// Import non-lazy components
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import WelcomeNotification from './components/WelcomeNotification/WelcomeNotification';
import Profile from './components/Profile/Profile';

// Lazy load other pages
const ReportCard = lazy(() => import('./pages/ReportCard/ReportCard'));
const InviteFriends = lazy(() => import('./pages/InviteFriends/InviteFriends'));

// Import services
import authService from './services/authService';

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    fontSize: '18px',
    color: '#64748b'
  }}>
    <div>
      <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>⏳</div>
      <div>Đang tải...</div>
    </div>
  </div>
);

function App() {
  // 2. Tạo state trung tâm, sử dụng authService để check trạng thái
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [userRole, setUserRole] = useState(() => {
    const user = authService.getCurrentUser();
    return user?.role || 'user';
  });
  const [showWelcome, setShowWelcome] = useState(false);

  // Lấy hàm navigate để chuyển trang sau khi đăng nhập
  const navigate = useNavigate();

  // 3. Hàm xử lý đăng nhập (nhận role từ API)
  const handleLogin = (role = 'user') => {
    setIsLoggedIn(true);
    setUserRole(role);

    // Tất cả các role đều về trang home
    navigate('/');

    // Hiển thị thông báo chào mừng
    setTimeout(() => {
      setShowWelcome(true);
    }, 300);
  };

  // 4. Hàm xử lý đăng xuất
  const handleLogout = () => {
    // Clear localStorage first
    authService.logout();
    
    // Update state immediately
    setIsLoggedIn(false);
    setUserRole('user');
    
    // Dispatch custom event to notify all components (including Navbar)
    window.dispatchEvent(new Event('storage'));
    
    // Navigate to home page (not login page)
    navigate('/');
  };

  return (
    <>
      {/* Welcome Notification */}
      <WelcomeNotification
        isVisible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userRole={userRole}
      />

      <ErrorBoundary fallbackMessage="Đã xảy ra lỗi khi tải trang. Vui lòng thử lại.">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* 5. Truyền state và các hàm xử lý xuống các trang cần thiết */}
          <Route
            path="/"
            element={
              <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <HomeStudent />
              </Layout>
            }
          />
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Public Routes */}
        <Route
          path="/news"
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <News />
            </Layout>
          }
        />
        <Route
          path="/news/:newsId"
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <NewsDetail />
            </Layout>
          }
        />
        <Route
          path="/lessons"
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <Lessons />
            </Layout>
          }
        />

        {/* Student Routes */}
      {/* Redirect old route to new design */}
      <Route path="/join-class" element={<Navigate to="/my-classes" replace />} />
      <Route
        path="/materials"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <Materials />
          </Layout>
        }
      />
      <Route 
        path="/ai-practice" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <AIPractice />
          </Layout>
        } 
      />
      <Route 
        path="/ai-writing" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <WritingAI />
          </Layout>
        } 
      />
      <Route 
        path="/ai-reading" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <ReadingAI />
          </Layout>
        } 
      />
      <Route 
        path="/my-classes" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <MyClasses />
          </Layout>
        } 
      />
      <Route 
        path="/exercise-hub" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <ExerciseHub />
          </Layout>
        } 
      />
      <Route 
        path="/exercise/:exerciseId" 
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <DoExercise />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam/:examId" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <TakeExam />
          </Layout>
        } 
      />
      {/* Redirect old route to new design */}
      <Route path="/exercises" element={<Navigate to="/exercise-hub" replace />} />
      <Route
        path="/discussion"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <Discussion />
          </Layout>
        }
      />

      <Route
        path="/my-courses"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <MyCourses />
          </Layout>
        }
      />

      <Route
        path="/study-plan"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <StudyPlan />
          </Layout>
        }
      />

      <Route
        path="/learning-profile"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <LearningProfile />
          </Layout>
        }
      />







      <Route
        path="/speaking-demo"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <SpeakingExerciseDemo />
          </Layout>
        }
      />

      <Route
        path="/speaking-showcase"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <SpeakingExerciseShowcase />
          </Layout>
        }
      />

      <Route
        path="/course/:courseId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <CourseContentPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reading-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <ReadingExercise />
          </ProtectedRoute>
        }
      />

      <Route
        path="/writing-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <WritingExercise />
          </ProtectedRoute>
        }
      />

      <Route
        path="/speaking-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <SpeakingExercise />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/listening-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <ListeningExercise />
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:courseId/lessons"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <CourseLessons />
            </Layout>
          </ProtectedRoute>
        }
      />



      {/* Admin Dashboard - Protected, No Layout wrapper for fullscreen */}
      <Route
        path="/admin-dashboard/*"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="admin">
            <AdminDashboardV2 onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Teacher Dashboard V3 - NEW Beautiful Design with Full Features */}
      <Route
        path="/teacher-dashboard/*"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <TeacherDashboardV3 onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Teacher: Single submission grading full page */}
      <Route
        path="/teacher-grading/submissions/:submissionId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <SubmissionGradingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/class/:classId/content"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <ClassContent />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Teacher Materials - Protected */}
      <Route
        path="/teacher-materials"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <TeacherMaterials />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Parent Dashboard V2 - NEW Beautiful Design */}
      <Route
        path="/parent-dashboard"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <ParentDashboardV2 />
          </ProtectedRoute>
        }
      />

      {/* Parent - Track Progress Page */}
      <Route
        path="/track-progress"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <TrackProgressPage />
          </ProtectedRoute>
        }
      />

      {/* Parent - Notifications Page */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Parent - Teacher Communication Page */}
      <Route
        path="/teacher-communication"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <TeacherCommunication />
          </ProtectedRoute>
        }
      />

      {/* Profile Route - Protected */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Report Card Route - Protected */}
      <Route
        path="/report-card"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <ReportCard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Invite Friends Route - Protected */}
      <Route
        path="/invite-friends"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <InviteFriends />
            </Layout>
          </ProtectedRoute>
        }
      />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
