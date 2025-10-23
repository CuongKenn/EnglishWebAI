import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNews } from '../../hooks';
import './News.css';

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { news: newsData, loading, error } = useNews();

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
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải tin tức...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="news-grid">
              {filteredNews.map((item) => (
                <article key={item.id} className={`news-article news-${item.type || 'general'}`}>
                  <div className="news-article-image">
                    <img src={item.image || 'https://via.placeholder.com/600x400'} alt={item.title} />
                    <span className="news-category-badge">{item.category}</span>
                  </div>
                  <div className="news-article-content">
                    <div className="news-article-header">
                      <span className="news-icon">{item.icon || '📰'}</span>
                      <span className="news-date">
                        <i className="far fa-calendar-alt"></i>
                        {item.date || item.created_at || 'N/A'}
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
          )}
        </main>
      </div>
    </div>
  );
};

export default News;

