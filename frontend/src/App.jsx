// src/App.jsx

import React, { useState } from 'react'; // 1. Import useState
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast'; // Import Toast Provider
import RouteErrorBoundary from './components/ErrorBoundary/RouteErrorBoundary'; // Import Route Error Boundary
import ChatBot from './components/ChatBot/ChatBot'; // Import ChatBot

// Import Layout và các trang
import Layout from './components/Layout/Layout';
import HomeStudent from './pages/HomeStudent/HomeStudent';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import JoinClass from './pages/JoinClass/JoinClass';
import Materials from './pages/Materials/Materials';
import Discussion from './pages/Discussion/Discussion';
import Exercises from './pages/Exercises/Exercises';
import News from './pages/News/News';
import NewsDetail from './pages/News/NewsDetail';
import Lessons from './pages/Lessons/Lessons';
import ClassContent from './pages/ClassContent/ClassContent';
import AIPractice from './pages/student/AIPractice';
import MyClasses from './pages/student/MyClasses/MyClasses';
import ExerciseHub from './pages/student/ExerciseHub/ExerciseHub';
import DoExercise from './pages/student/DoExercise/DoExercise';
import TakeExam from './pages/student/TakeExam/TakeExam';
import { WritingAI } from './components/ai/WritingAI';
import { ReadingAI } from './components/ai/ReadingAI';
import CourseContentPage from './pages/CourseContentPage/CourseContentPage';
import MyCourses from './pages/MyCourses/MyCourses';
import StudyPlan from './pages/StudyPlan/StudyPlan';
import LearningProfile from './pages/LearningProfile/LearningProfile';
import SpeakingExercise from './pages/SpeakingExercise/SpeakingExercise';
import SpeakingExerciseDemo from './pages/SpeakingExercise/SpeakingExerciseDemo';
import SpeakingExerciseShowcase from './pages/SpeakingExercise/SpeakingExerciseShowcase';
import ReadingExercise from './pages/ReadingExercise/ReadingExercise';
import WritingExercise from './pages/WritingExercise/WritingExercise';
import ListeningExercise from './pages/ListeningExercise/ListeningExercise';
import ImageRecognition from './pages/ImageRecognition/ImageRecognition';
import CourseLessons from './pages/CourseLessons/CourseLessons';


// Import Admin Pages
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminDashboardV2 from './pages/Admin/AdminDashboardV2/AdminDashboardV2';

// Import Teacher Pages
import TeacherDashboardV3 from './pages/Teacher/TeacherDashboardV3/TeacherDashboardV3';
import TeacherMaterials from './pages/Teacher/TeacherMaterials/TeacherMaterials';
import SubmissionGradingPage from './pages/Teacher/Grading/SubmissionGradingPage';

// Import Parent Pages
import ParentDashboardV2 from './pages/Parent/ParentDashboardV2/ParentDashboardV2';
import TrackProgressPage from './pages/Parent/TrackProgress/TrackProgressPage';
import NotificationsPage from './pages/Parent/Notifications/NotificationsPage';
import TeacherCommunication from './pages/Parent/TeacherCommunication/TeacherCommunication';

// Import Welcome Notification
import WelcomeNotification from './components/WelcomeNotification/WelcomeNotification';

// Import 404 Page
import NotFound from './pages/NotFound/NotFound';

// Import Profile
import Profile from './components/Profile/Profile';

// Import Other Pages
import ReportCard from './pages/ReportCard/ReportCard';
import InviteFriends from './pages/InviteFriends/InviteFriends';
import AboutUs from './pages/AboutUs/AboutUs';

// Import services
import authService from './services/authService';

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
    <ToastProvider>
      {/* Welcome Notification */}
      <WelcomeNotification
        isVisible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userRole={userRole}
      />

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
      <Route
        path="/about"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <AboutUs />
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
            <RouteErrorBoundary routeName="AI Practice">
              <AIPractice />
            </RouteErrorBoundary>
          </Layout>
        } 
      />
      <Route 
        path="/ai-writing" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <RouteErrorBoundary routeName="AI Writing">
              <WritingAI />
            </RouteErrorBoundary>
          </Layout>
        } 
      />
      <Route 
        path="/ai-reading" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <RouteErrorBoundary routeName="AI Reading">
              <ReadingAI />
            </RouteErrorBoundary>
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
            <RouteErrorBoundary routeName="Exercise">
              <DoExercise />
            </RouteErrorBoundary>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/exam/:examId" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <RouteErrorBoundary routeName="Exam">
              <TakeExam />
            </RouteErrorBoundary>
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
        path="/image-recognition"
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <ImageRecognition />
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
              <RouteErrorBoundary routeName="Course Content">
                <CourseContentPage />
              </RouteErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reading-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <RouteErrorBoundary routeName="Reading Exercise">
              <ReadingExercise />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/writing-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <RouteErrorBoundary routeName="Writing Exercise">
              <WritingExercise />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/speaking-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <RouteErrorBoundary routeName="Speaking Exercise">
                <SpeakingExercise />
              </RouteErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/listening-exercise/:courseId/:lessonId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <RouteErrorBoundary routeName="Listening Exercise">
              <ListeningExercise />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:courseId/lessons"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <RouteErrorBoundary routeName="Course Lessons">
                <CourseLessons />
              </RouteErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />



      {/* Admin Dashboard - Protected, No Layout wrapper for fullscreen */}
      <Route
        path="/admin-dashboard/*"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="admin">
            <RouteErrorBoundary routeName="Admin Dashboard">
              <AdminDashboardV2 onLogout={handleLogout} />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Teacher Dashboard V3 - NEW Beautiful Design with Full Features */}
      <Route
        path="/teacher-dashboard/*"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <RouteErrorBoundary routeName="Teacher Dashboard">
              <TeacherDashboardV3 onLogout={handleLogout} />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Teacher: Single submission grading full page */}
      <Route
        path="/teacher-grading/submissions/:submissionId"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <RouteErrorBoundary routeName="Submission Grading">
              <SubmissionGradingPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* DEPRECATED: Old class route - now using CourseContentPage for all courses */}
      <Route
        path="/class/:classId/content"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <CourseContentPage />
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
              <RouteErrorBoundary routeName="Teacher Materials">
                <TeacherMaterials />
              </RouteErrorBoundary>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Parent Dashboard V2 - NEW Beautiful Design */}
      <Route
        path="/parent-dashboard"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <RouteErrorBoundary routeName="Parent Dashboard">
              <ParentDashboardV2 />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Parent - Track Progress Page */}
      <Route
        path="/track-progress"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <RouteErrorBoundary routeName="Track Progress">
              <TrackProgressPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Parent - Notifications Page */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <RouteErrorBoundary routeName="Notifications">
              <NotificationsPage />
            </RouteErrorBoundary>
          </ProtectedRoute>
        }
      />

      {/* Parent - Teacher Communication Page */}
      <Route
        path="/teacher-communication"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <RouteErrorBoundary routeName="Teacher Communication">
              <TeacherCommunication />
            </RouteErrorBoundary>
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
      
      {/* 404 Not Found - Must be last route */}
      <Route path="*" element={<NotFound />} />
      </Routes>

      {/* ChatBot - Only show when logged in */}
      {isLoggedIn && <ChatBot />}
    </ToastProvider>
  );
}

export default App;
