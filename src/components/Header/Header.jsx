// src/component/Header/Header.jsx

import React, { useState, useEffect } from 'react'; 
import './Header.css';

const Header = () => {
 // state để theo dõi trạng thái cuộn trang
  const [isScrolled, setIsScrolled] = useState(false);

  //  Sử dụng useEffect để thêm và gỡ bỏ event listener
  useEffect(() => {
    const handleScroll = () => {
      // Nếu vị trí cuộn > 0 (nghĩa là đã cuộn xuống), set state là true
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

   
    window.addEventListener('scroll', handleScroll);

   
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    
    <header className={`header-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-top">
        <div className="logo">
          {/* Thay bằng logo của bạn */}
          <img src="https://olm.vn/images/logo.svg" alt="Learn App" />
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Tìm kiếm bài học, bài tập, mã lớp, mã khóa học..." />
          <button>Tìm Kiếm</button>
        </div>
        <div className="auth-buttons">
          <button className="login-btn">Đăng nhập</button>
          <button className="register-btn">Đăng ký</button>
        </div>
      </div>
      <nav className="header-nav">
        <ul>
          <li><a href="#">HỌC BÀI</a></li>
          <li><a href="#">HỎI BÀI</a></li>
          <li><a href="#">KIỂM TRA</a></li>
          <li><a href="#">ĐGNL</a></li>
          <li><a href="#">THI ĐẤU</a></li>
          <li><a href="#">THƯ VIỆN SỐ</a></li>
          <li><a href="#">BÀI VIẾT</a></li>
          <li><a href="#">TRỢ GIÚP</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;