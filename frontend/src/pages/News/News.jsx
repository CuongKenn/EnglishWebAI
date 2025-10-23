import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './News.css';

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const newsData = [
    {
      id: 1,
      title: '🎉 Mua VIP tặng ngay Bộ đề ôn tập kiểm tra giữa kỳ I',
      description: 'Bộ đề ôn tập kiểm tra giữa kỳ giúp học sinh ôn tập hiệu quả và giáo viên xây dựng đề thi dễ dàng. Với hơn 500+ câu hỏi được phân loại theo chủ đề và độ khó.',
      content: 'Chương trình ưu đãi đặc biệt trong tháng 10! Khi mua gói VIP, bạn sẽ nhận được hoàn toàn miễn phí bộ đề ôn tập kiểm tra giữa kỳ I với đầy đủ các môn học. Đặc biệt, mỗi đề thi đều có đáp án chi tiết và hướng dẫn giải.',
      icon: '🎁',
      type: 'promotion',
      category: 'Khuyến mãi',
      date: '15/10/2025',
      image: 'https://via.placeholder.com/600x400/667eea/ffffff?text=VIP+Promotion'
    },
    {
      id: 2,
      title: '🔥 Chỉ còn ít tuổi! Giải pháp bứt phá điểm kiểm tra cho con',
      description: 'Phương pháp học thông minh giúp con tiến bộ vượt bậc trong thời gian ngắn với công nghệ AI cá nhân hóa.',
      content: 'Hệ thống AI của chúng tôi sẽ phân tích điểm mạnh, điểm yếu của từng học sinh và đưa ra lộ trình học tập phù hợp nhất. Kết quả: 90% học sinh cải thiện điểm số sau 1 tháng.',
      icon: '🚀',
      type: 'tips',
      category: 'Học tập',
      date: '12/10/2025',
      image: 'https://via.placeholder.com/600x400/764ba2/ffffff?text=Study+Tips'
    },
    {
      id: 3,
      title: '📚 Hướng dẫn tham gia lớp học trực tuyến năm 2025-2026',
      description: 'Hướng dẫn chi tiết cách tham gia lớp học trực tuyến, sử dụng các tính năng học tập hiệu quả.',
      content: 'Video hướng dẫn từng bước để phụ huynh và học sinh có thể dễ dàng tham gia vào lớp học trực tuyến. Bao gồm cách sử dụng các công cụ tương tác, nộp bài tập, và giao tiếp với giáo viên.',
      icon: '📖',
      type: 'guide',
      category: 'Hướng dẫn',
      date: '10/10/2025',
      image: 'https://via.placeholder.com/600x400/f093fb/ffffff?text=Online+Class'
    },
    {
      id: 4,
      title: '🏆 Đấu trường Trí thức 2025 - 2026 chính thức trở lại!',
      description: 'Cuộc thi tri thức lớn nhất năm dành cho học sinh trên toàn quốc với nhiều giải thưởng hấp dẫn.',
      content: 'Cuộc thi với tổng giá trị giải thưởng lên đến 100 triệu đồng. Các vòng thi bao gồm: vòng loại online, vòng bán kết và chung kết tại Hà Nội. Đăng ký ngay hôm nay!',
      icon: '🎯',
      type: 'event',
      category: 'Sự kiện',
      date: '08/10/2025',
      image: 'https://via.placeholder.com/600x400/4facfe/ffffff?text=Contest+2025'
    },
    {
      id: 5,
      title: '✨ Ra mắt tính năng AI Speaking Coach',
      description: 'Luyện phát âm tiếng Anh với trợ lý AI thông minh, nhận phản hồi tức thì về cách phát âm của bạn.',
      content: 'Tính năng mới cho phép học sinh luyện tập phát âm với AI, nhận được đánh giá chi tiết về độ chính xác, ngữ điệu và lưu loát. Hỗ trợ nhiều giọng: Anh - Mỹ.',
      icon: '🎤',
      type: 'feature',
      category: 'Tính năng mới',
      date: '05/10/2025',
      image: 'https://via.placeholder.com/600x400/00f2fe/ffffff?text=AI+Speaking'
    },
    {
      id: 6,
      title: '📅 Lịch thi học kỳ I năm học 2025-2026',
      description: 'Công bố lịch thi chính thức cho học kỳ I, các em học sinh cần lưu ý và chuẩn bị kỹ càng.',
      content: 'Kỳ thi giữa kỳ I sẽ diễn ra từ ngày 15/11 - 20/11/2025. Kỳ thi cuối kỳ từ 20/12 - 25/12/2025. Học sinh vui lòng xem chi tiết lịch thi theo từng khối lớp.',
      icon: '📆',
      type: 'announcement',
      category: 'Thông báo',
      date: '01/10/2025',
      image: 'https://via.placeholder.com/600x400/a18cd1/ffffff?text=Exam+Schedule'
    }
  ];

  const categories = ['all', 'Khuyến mãi', 'Học tập', 'Hướng dẫn', 'Sự kiện', 'Tính năng mới', 'Thông báo'];

  const filteredNews = selectedCategory === 'all' 
    ? newsData 
    : newsData.filter(item => item.category === selectedCategory);

  return (
    <div className="news-page">
      <div className="news-header">
        <div className="news-header-content">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            Về trang chủ
          </Link>
          <h1 className="news-page-title">
            <span className="title-icon">📰</span>
            Tin tức & Sự kiện
          </h1>
          <p className="news-page-subtitle">
            Cập nhật những thông tin mới nhất về chương trình học, sự kiện và khuyến mãi đặc biệt
          </p>
        </div>
      </div>

      <div className="news-container">
        <aside className="news-sidebar">
          <div className="category-filter">
            <h3>Danh mục</h3>
            <div className="category-list">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'Tất cả' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="news-stats-sidebar">
            <h3>Thống kê</h3>
            <div className="stat-box">
              <div className="stat-number">{newsData.length}</div>
              <div className="stat-label">Tổng tin tức</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">15</div>
              <div className="stat-label">Tin mới tuần này</div>
            </div>
          </div>
        </aside>

        <main className="news-content">
          <div className="news-grid">
            {filteredNews.map((item) => (
              <article key={item.id} className={`news-article news-${item.type}`}>
                <div className="news-article-image">
                  <img src={item.image} alt={item.title} />
                  <span className="news-category-badge">{item.category}</span>
                </div>
                <div className="news-article-content">
                  <div className="news-article-header">
                    <span className="news-icon">{item.icon}</span>
                    <span className="news-date">
                      <i className="far fa-calendar-alt"></i>
                      {item.date}
                    </span>
                  </div>
                  <h2 className="news-article-title">{item.title}</h2>
                  <p className="news-article-description">{item.description}</p>
                  <p className="news-article-excerpt">{item.content}</p>
                  <button className="read-more-btn">
                    Đọc thêm
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default News;

