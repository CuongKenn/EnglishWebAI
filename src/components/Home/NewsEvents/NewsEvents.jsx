import React from 'react';
import './NewsEvents.css';

const NewsEvents = () => {
  const news = [
    {
      id: 1,
      title: '🎉 Mua VIP tặng ngay Bộ đề ôn tập kiểm tra giữa kỳ I',
      description: 'Bộ đề ôn tập kiểm tra giữa kỳ giúp học sinh ôn tập hiệu quả và giáo viên xây dựng đề thi dễ dàng',
      icon: '🎁',
      type: 'promotion',
      date: '15/10/2025'
    },
    {
      id: 2,
      title: '🔥 Chi còn ít tuổi! Giải pháp bứt phá điểm kiểm tra cho con',
      description: 'Phương pháp học thông minh giúp con tiến bộ vượt bậc trong thời gian ngắn',
      icon: '🚀',
      type: 'tips',
      date: '12/10/2025'
    },
    {
      id: 3,
      title: '📚 Hướng dẫn tham gia lớp học trực tuyến năm 2025-2026',
      description: 'Hướng dẫn chi tiết cách tham gia lớp học trực tuyến, sử dụng các tính năng học tập hiệu quả',
      icon: '📖',
      type: 'guide',
      date: '10/10/2025'
    },
    {
      id: 4,
      title: '🏆 Đấu trường Trí thức 2025 - 2026 chính thức trở lại!',
      description: 'Cuộc thi tri thức lớn nhất năm dành cho học sinh trên toàn quốc với nhiều giải thưởng hấp dẫn',
      icon: '🎯',
      type: 'event',
      date: '08/10/2025'
    }
  ];

  return (
    <section className="news-events-section">
      <div className="section-header">
        <div className="header-badge badge-green">
          <span className="badge-icon">📰</span>
          <span className="badge-text">Latest Updates</span>
        </div>
        <h2 className="section-title">Thông tin - Sự kiện</h2>
        <p className="section-subtitle">
          Cập nhật tin tức mới nhất về chương trình học và sự kiện đặc biệt
        </p>
      </div>

      <div className="news-grid">
        {news.map((item) => (
          <div key={item.id} className={`news-card news-card-${item.type}`}>
            <div className="news-icon">
              <span>{item.icon}</span>
            </div>
            <div className="news-content">
              <div className="news-type-badge">{item.type}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="news-footer">
                <span className="news-date">
                  <i className="far fa-calendar"></i>
                  {item.date}
                </span>
                <button className="read-more-btn">
                  Xem chi tiết
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="view-all-container">
        <button className="view-all-large-btn">
          <span>Xem tất cả tin tức</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </section>
  );
};

export default NewsEvents;

