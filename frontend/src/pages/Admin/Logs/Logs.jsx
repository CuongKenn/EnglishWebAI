import React from 'react';
import './Logs.css';

const Logs = () => {
  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>📋 Nhật ký hệ thống</h2>
        <p>Theo dõi các hoạt động và sự kiện trong hệ thống</p>
      </div>
      
      <div className="coming-soon-content">
        <div className="coming-soon-icon">🚧</div>
        <h3>Tính năng đang được phát triển</h3>
        <p>Trang nhật ký hệ thống sẽ sớm có mặtt</p>
      </div>
    </div>
  );
};

export default Logs;
