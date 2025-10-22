// src/component/Header/Header.jsx

import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';
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
          <Link to="/login" className="login-btn">Đăng nhập</Link>
          <Link to="/register" className="register-btn">Đăng ký</Link>
        </div>
      </div>
      <nav className="header-nav">
        <ul>
          <li><a href="#">THAM GIA LỚP HỌC</a></li>
          <li><a href="#">HỎI LIỆU CƠ BẢN</a></li>
          <li><a href="#">LÀM BÀI TẬP</a></li>
          <li><a href="#">XEM LẠI KẾT QUẢ</a></li>
          <li><a href="#">THẢO LUẬN/HỎI ĐÁP</a></li>
          <li><a href="#">THEO DÕI TIẾN ĐỘ HỌC CÁ NHÂN</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;