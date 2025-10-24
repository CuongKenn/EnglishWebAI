import React from 'react';
import { BookOpen } from 'lucide-react';
import './ReportCard.css';

const ReportCard = () => {
  return (
    <div className="report-card-page">
      <div className="report-card-header">
        <BookOpen size={48} />
        <h1>Học bạ</h1>
        <p>Theo dõi kết quả học tập của bạn</p>
      </div>
      <div className="report-card-content">
        <div className="coming-soon">
          <h2>Tính năng đang được phát triển</h2>
          <p>Học bạ điện tử sẽ sớm có mặt!</p>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;

