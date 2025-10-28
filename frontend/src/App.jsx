// src/App.jsx

import React, { useState } from 'react'; // 1. Import useState
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

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
import CourseLessons from './pages/CourseLessons/CourseLessons';


// Import Admin Pages
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';
import AdminDashboardV2 from './pages/Admin/AdminDashboardV2/AdminDashboardV2';

// Import Teacher Pages
import TeacherDashboard from './pages/Teacher/TeacherDashboard/TeacherDashboard';
import TeacherDashboardNew from './pages/Teacher/TeacherDashboard/TeacherDashboardNew';
import TeacherDashboardV2 from './pages/Teacher/TeacherDashboardV2/TeacherDashboardV2';
import TeacherDashboardV3 from './pages/Teacher/TeacherDashboardV3/TeacherDashboardV3';
import TeacherMaterials from './pages/Teacher/TeacherMaterials/TeacherMaterials';

// Import Parent Pages
import ParentDashboard from './pages/Parent/ParentDashboard/ParentDashboard';
import ParentDashboardV2 from './pages/Parent/ParentDashboardV2/ParentDashboardV2';
import TrackProgressPage from './pages/Parent/TrackProgress/TrackProgressPage';
import NotificationsPage from './pages/Parent/Notifications/NotificationsPage';
import TeacherCommunication from './pages/Parent/TeacherCommunication/TeacherCommunication';

// Import Welcome Notification
import WelcomeNotification from './components/WelcomeNotification/WelcomeNotification';

// Import Profile
import Profile from './components/Profile/Profile';

// Import Other Pages
import ReportCard from './pages/ReportCard/ReportCard';
import InviteFriends from './pages/InviteFriends/InviteFriends';

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

    // Navigate dựa trên role
    if (role === 'admin' || role === 'superadmin') {
      navigate('/admin-dashboard');
    } else if (role === 'teacher') {
      navigate('/teacher-dashboard');
    } else if (role === 'parent') {
      navigate('/parent-dashboard');
    } else {
      navigate('/');
    }

    // Hiển thị thông báo chào mừng
    setTimeout(() => {
      setShowWelcome(true);
    }, 300);
  };

  // 4. Hàm xử lý đăng xuất
  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUserRole('user');
    navigate('/login');
  };

  return (
    <>
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
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <DoExercise />
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
            <AdminDashboardV2 />
          </ProtectedRoute>
        }
      />

      {/* Teacher Dashboard V3 - NEW Beautiful Design with Full Features */}
      <Route
        path="/teacher-dashboard/*"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <TeacherDashboardV3 />
          </ProtectedRoute>
        }
      />
      
      {/* Teacher Dashboard V2 - Backup */}
      <Route
        path="/teacher-dashboard-v2/*"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <TeacherDashboardV2 />
          </ProtectedRoute>
        }
      />

      {/* Teacher Dashboard New - Backup (Old Beautiful) */}
      <Route
        path="/teacher-dashboard-old"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <TeacherDashboardNew />
          </ProtectedRoute>
        }
      />

      {/* Teacher Dashboard Legacy - Very Old */}
      <Route
        path="/teacher-dashboard-legacy"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <TeacherDashboard />
            </Layout>
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

      {/* Parent Dashboard - Legacy */}
      <Route
        path="/parent-dashboard-legacy"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <ParentDashboard />
            </Layout>
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
    </>
  );
}

export default App;
