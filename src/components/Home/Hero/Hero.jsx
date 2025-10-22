import React from 'react';
import './Hero.css';
import bannerImage from '../../../assets/banner.png'; // Thêm một cấp ../

const Hero = () => {
  return (
    <div className="hero-section">
      <img src={bannerImage} alt="Space Exploration Banner" />
      {/* OLM có các nút điều hướng trái/phải, ở đây chúng ta làm đơn giản */}
    </div>
  );
};

export default Hero;