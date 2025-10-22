// src/component/Header/Header.jsx

import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
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
          <div className="logo-icon">🎓</div>
          <span className="logo-text">English AI</span>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Tìm kiếm bài học, bài tập, từ vựng, ngữ pháp..." />
          <button>
            <i className="fas fa-search"></i>
            <span>Tìm kiếm</span>
          </button>
        </div>
        <div className="auth-buttons">
          <Link to="/login" className="login-btn">Đăng nhập</Link>
          <Link to="/register" className="register-btn">Đăng ký</Link>
        </div>
      </div>
      <nav className="header-nav">
        <ul>
          <li><a href="#">BÀI HỌC AI</a></li>
          <li><a href="#">LUYỆN TẬP</a></li>
          <li><a href="#">TỪ VỰNG</a></li>
          <li><a href="#">NGỮ PHÁP</a></li>
          <li><a href="#">KIỂM TRA</a></li>
          <li><a href="#">THEO DÕI TIẾN ĐỘ</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;