// src/App.jsx

import React, { useState } from 'react'; // 1. Import useState
import { Routes, Route, useNavigate } from 'react-router-dom';

// Import Layout và các trang
import Layout from './components/Layout/Layout';
import HomeStudent from './pages/HomeStudent/HomeStudent';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import JoinClass from './pages/JoinClass/JoinClass';
import Materials from './pages/Materials/Materials';
import Discussion from './pages/Discussion/Discussion';
import Exercises from './pages/Exercises/Exercises';
import News from './pages/News/News';
import Lessons from './pages/Lessons/Lessons';

// Import Admin Pages
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import AdminDashboard from './pages/Admin/AdminDashboard/AdminDashboard';

// Import Teacher Pages
import TeacherDashboard from './pages/Teacher/TeacherDashboard/TeacherDashboard';

// Import Welcome Notification
import WelcomeNotification from './components/WelcomeNotification/WelcomeNotification';

function App() {
  // 2. Tạo state trung tâm, mặc định là chưa đăng nhập
  // FOR TESTING: Set to true and change role to test different views
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('student'); // 'student' | 'teacher' | 'admin' | 'parent'
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Lấy hàm navigate để chuyển trang sau khi đăng nhập
  const navigate = useNavigate();

  // 3. Hàm xử lý đăng nhập (nhận role từ API)
  const handleLogin = (role = 'student') => {
    setIsLoggedIn(true);
    setUserRole(role);
    
    // Tất cả user đều về trang home sau khi đăng nhập
    navigate('/');
    
    // Hiển thị thông báo chào mừng
    setTimeout(() => {
      setShowWelcome(true);
    }, 300); // Delay nhỏ để navigate hoàn tất trước
  };

  // 4. Hàm xử lý đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('student');
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
      </Routes>
    </>
  );
}

export default App;