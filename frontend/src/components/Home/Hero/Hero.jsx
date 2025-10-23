import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Học tiếng Anh thông minh
            <br />
            <span className="gradient-text">với công nghệ AI</span>
          </h1>
          <p className="hero-subtitle">
            Nền tảng học tiếng Anh trực tuyến với trí tuệ nhân tạo, 
            cá nhân hóa lộ trình học tập cho mọi học sinh từ lớp 1 đến lớp 12
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">
              <i className="fas fa-rocket"></i>
              Bắt đầu học ngay
            </button>
            <button className="btn-secondary">
              <i className="fas fa-play-circle"></i>
              Xem giới thiệu
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Học sinh</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Bài học AI</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">95%</span>
              <span className="stat-label">Hài lòng</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="planet-container">
            <div className="main-planet"></div>
            <div className="small-planet planet-sm-1"></div>
            <div className="small-planet planet-sm-2"></div>
            <div className="small-planet planet-sm-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;