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

function App() {
  // 2. Tạo state trung tâm, mặc định là chưa đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('student'); // Thêm state cho role
  
  // Lấy hàm navigate để chuyển trang sau khi đăng nhập
  const navigate = useNavigate();

  // 3. Hàm xử lý đăng nhập (sau này sẽ gọi API thật)
  const handleLogin = (role = 'student') => {
    setIsLoggedIn(true);
    setUserRole(role);
    navigate('/'); // Chuyển người dùng về trang chủ sau khi đăng nhập
  };

  // 4. Hàm xử lý đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('student');
  };

  return (
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
    </Routes>
  );
}

export default App;