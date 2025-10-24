// src/App.jsx

import React, { useState } from 'react'; // 1. Import useState
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
        path="/lessons" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <Lessons />
          </Layout>
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/join-class" 
        element={
          <Layout userRole={userRole} isLoggedIn={isLoggedIn} onLogout={handleLogout}>
            <JoinClass />
          </Layout>
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
      
      {/* Admin Dashboard - Protected with Sidebar */}
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

      {/* Teacher Dashboard - Protected */}
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

      {/* Parent Dashboard - Protected */}
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
