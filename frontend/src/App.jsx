// src/App.jsx

import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

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
import Lessons from './pages/Lessons/Lessons';
import ClassContent from './pages/ClassContent/ClassContent';
import CourseContentPage from './pages/CourseContentPage/CourseContentPage';
import MyCourses from './pages/MyCourses/MyCourses';
import StudyPlan from './pages/StudyPlan/StudyPlan';
import LearningProfile from './pages/LearningProfile/LearningProfile';
import SpeakingExercise from './pages/SpeakingExercise/SpeakingExercise';
import TestSpeaking from './pages/SpeakingExercise/TestSpeaking';
import SimpleTest from './pages/SpeakingExercise/SimpleTest';
import SpeakingExerciseDemo from './pages/SpeakingExercise/SpeakingExerciseDemo';
import SpeakingExerciseShowcase from './pages/SpeakingExercise/SpeakingExerciseShowcase'; 
import ReadingCourse from './pages/ReadingCourse/ReadingCourse';
import WritingCourse from './pages/WritingCourse/WritingCourse';
import VocabularyCourse from './pages/VocabularyCourse/VocabularyCourse';
import VocabularyDemo from './pages/VocabularyDemo/VocabularyDemo';
import VocabularyTest from './pages/VocabularyTest/VocabularyTest';

// Import Admin Pages
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';

// Import Teacher Pages
import TeacherDashboard from './pages/Teacher/TeacherDashboard/TeacherDashboard';
import TeacherMaterials from './pages/Teacher/TeacherMaterials/TeacherMaterials';

// Import Parent Pages
import ParentDashboard from './pages/Parent/ParentDashboard/ParentDashboard';

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated());
  const [userRole, setUserRole] = useState(() => {
    const user = authService.getCurrentUser();
    return user?.role || 'user';
  });
  const [showWelcome, setShowWelcome] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = (role = 'user') => {
    setIsLoggedIn(true);
    setUserRole(role);
    
    if (role === 'admin' || role === 'superadmin') {
      navigate('/admin-dashboard');
    } else if (role === 'teacher') {
      navigate('/teacher-dashboard');
    } else if (role === 'parent') {
      navigate('/parent-dashboard');
    } else {
      navigate('/');
    }
    
    setTimeout(() => {
      setShowWelcome(true);
    }, 300);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUserRole('user');
    navigate('/login');
  };

  return (
    <>
      <WelcomeNotification 
        isVisible={showWelcome}
        onClose={() => setShowWelcome(false)}
        userRole={userRole}
      />

      <Routes>
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
        
        <Route 
          path="/news" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <News />
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
          path="/speaking/:courseId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <SpeakingExercise />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/learn/:courseId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <ReadingCourse />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/writing/:courseId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <WritingCourse />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vocabulary/:courseId" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn}>
              <VocabularyCourse />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/vocabulary-demo" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <VocabularyDemo />
            </Layout>
          } 
        />
        
        <Route 
          path="/vocabulary-test" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <VocabularyTest />
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
          path="/join-class" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <JoinClass />
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
          path="/materials" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <Materials />
            </Layout>
          } 
        />
        <Route 
          path="/exercises" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <Exercises />
            </Layout>
          } 
        />
        <Route 
          path="/discussion" 
          element={
            <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
              <Discussion />
            </Layout>
          } 
        />
        
        <Route 
          path="/admin-dashboard/*" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="admin">
              <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* ================== [BẮT ĐẦU] ĐÃ SỬA LỖI TẠI ĐÂY ================== */}
        <Route 
          path="/teacher-dashboard" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="teacher">
              <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <TeacherDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        {/* ================== [KẾT THÚC] ĐÃ SỬA LỖI TẠI ĐÂY ================== */}

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

        <Route
          path="/parent-dashboard"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} userRole={userRole} requiredRole="parent">
              <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
                <ParentDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

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