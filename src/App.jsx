// src/App.jsx

import React, { useState } from 'react'; // 1. Import useState
import { Routes, Route, useNavigate } from 'react-router-dom';

// Import các trang của bạn
import HomeStudent from './pages/HomeStudent/HomeStudent';
import Login from './components/Login/Login';
import Register from './components/Register/Register';

function App() {
  // 2. Tạo state trung tâm, mặc định là chưa đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Lấy hàm navigate để chuyển trang sau khi đăng nhập
  const navigate = useNavigate();

  // 3. Hàm xử lý đăng nhập (sau này sẽ gọi API thật)
  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/'); // Chuyển người dùng về trang chủ sau khi đăng nhập
  };

  // 4. Hàm xử lý đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Routes>
      {/* 5. Truyền state và các hàm xử lý xuống các trang cần thiết */}
      <Route 
        path="/" 
        element={<HomeStudent isLoggedIn={isLoggedIn} onLogout={handleLogout} />} 
      />
      <Route 
        path="/login" 
        element={<Login onLogin={handleLogin} />} 
      />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;