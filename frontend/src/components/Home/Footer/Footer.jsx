import React from 'react';
import { GraduationCap } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Logo và mô tả */}
        <div className="footer-section footer-about">
          <div className="footer-logo">
            <GraduationCap className="logo-icon" size={32} />
            <h2>Smart Learn</h2>
          </div>
          <p className="footer-description">
            Smart Learn là nền tảng giáo dục trực tuyến với công nghệ AI tiên tiến. 
            Chúng tôi cung cấp các khóa học Tiếng Anh từ cơ bản đến nâng cao cho học sinh 
            từ lớp 1 đến lớp 12. Các bài học được cá nhân hóa và phân tích thời gian thực 
            giúp học sinh nâng cao kỹ năng tiếng Anh hiệu quả.
          </p>
          <div className="footer-social">
            <span>Theo dõi Smart Learn trên:</span>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
              <a href="#" aria-label="TikTok"><i className="fab fa-tiktok"></i></a>
            </div>
          </div>
        </div>

        {/* Về chúng tôi */}
        <div className="footer-section">
          <h3>Về chúng tôi</h3>
          <ul>
            <li><a href="#">Giới thiệu Smart Learn</a></li>
            <li><a href="#">Dành cho Học sinh</a></li>
            <li><a href="#">Dành cho Giáo viên</a></li>
            <li><a href="#">Dành cho Phụ huynh</a></li>
            <li><a href="#">Công nghệ AI</a></li>
          </ul>
        </div>

        {/* Tài nguyên */}
        <div className="footer-section">
          <h3>Tài nguyên</h3>
          <ul>
            <li><a href="#">Trung tâm trợ giúp</a></li>
            <li><a href="#">Hướng dẫn sử dụng</a></li>
            <li><a href="#">Câu hỏi thường gặp</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Điều khoản sử dụng</a></li>
            <li><a href="#">Phản hồi với Smart Learn</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>

        {/* Ứng dụng Mobile */}
        <div className="footer-section">
          <h3>Ứng dụng Mobile</h3>
          <div className="app-downloads">
            <a href="#" className="app-button">
              <i className="fab fa-apple"></i>
              <div>
                <span className="small">Available on the</span>
                <span className="large">App Store</span>
              </div>
            </a>
            <a href="#" className="app-button">
              <i className="fab fa-google-play"></i>
              <div>
                <span className="small">GET IT ON</span>
                <span className="large">Google Play</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>© 2013 - 2025 EnglishAI.vn - Email: contact@englishai.vn</p>
      </div>
    </footer>
  );
};

export default Footer;

