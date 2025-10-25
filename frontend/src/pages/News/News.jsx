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

  // Get featured post (first post)
  const featuredPost = filteredNews[0];
  const regularPosts = filteredNews.slice(1);

  // Get trending posts (most viewed)
  const trendingPosts = [...newsData]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const getCategoryColor = (category) => {
    const colors = {
      'Khuyến mãi': '#FF6B6B',
      'Học tập': '#4ECDC4',
      'Hướng dẫn': '#45B7D1',
      'Sự kiện': '#FFA07A',
      'Tính năng mới': '#98D8C8',
      'Thông báo': '#6C5CE7',
    };
    return colors[category] || '#667eea';
  };

  return (
    <div className="news-page">
      <div className="news-header">
        <div className="news-header-content">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            Về trang chủ
          </Link>
          <h1 className="news-page-title">
            <span className="title-icon">✨</span>
            Bài viết nổi bật
          </h1>
          <p className="news-page-subtitle">
            Nhận các bài viết mới nhất về học tiếng Anh và AI qua email mỗi tuần
          </p>
        </div>
      </div>

      <div className="news-container">
        <main className="news-main">
          {/* Category Filter Tabs */}
          <div className="category-tabs">
            <button
              className={`tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span>📚</span> Tất cả
            </button>
            {categories.filter(c => c !== 'all').map((cat) => (
              <button
                key={cat}
                className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                style={{ '--tab-color': getCategoryColor(cat) }}
              >
                {cat}
              </button>
            ))}
          </div>

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
            <>
              {/* Featured Post */}
              {featuredPost && (
                <article className="featured-post">
                  <div className="featured-image">
                    <img 
                      src={featuredPost.image || 'https://via.placeholder.com/1200x600/667eea/ffffff?text=Featured+Post'} 
                      alt={featuredPost.title} 
                    />
                    <span 
                      className="featured-badge"
                      style={{ backgroundColor: getCategoryColor(featuredPost.category) }}
                    >
                      {featuredPost.category}
                    </span>
                  </div>
                  <div className="featured-content">
                    <h2 className="featured-title">{featuredPost.title}</h2>
                    <p className="featured-description">{featuredPost.description}</p>
                    <div className="featured-meta">
                      <div className="author-info">
                        <div className="author-avatar">
                          {featuredPost.author_role === 'teacher' ? '👨‍🏫' : '👤'}
                        </div>
                        <div className="author-details">
                          <span className="author-name">{featuredPost.author_name || 'Admin'}</span>
                          <span className="author-role">
                            {featuredPost.author_role === 'teacher' ? 'Giáo viên' : 'Admin'}
                          </span>
                        </div>
                      </div>
                      <div className="post-stats">
                        <span className="stat-item">
                          <i className="far fa-clock"></i> {featuredPost.reading_time || 5} phút đọc
                        </span>
                        <span className="stat-item">
                          <i className="far fa-eye"></i> {featuredPost.views || 0}
                        </span>
                        <span className="stat-item">
                          <i className="far fa-heart"></i> {featuredPost.likes || 0}
                        </span>
                        <span className="stat-item">
                          <i className="far fa-calendar"></i> {featuredPost.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Regular Posts Grid */}
              <div className="posts-grid">
                {regularPosts.map((post) => (
                  <article key={post.id} className="post-card">
                    <div className="post-image">
                      <img 
                        src={post.image || 'https://via.placeholder.com/600x400/667eea/ffffff?text=Post'} 
                        alt={post.title} 
                      />
                      <span 
                        className="post-category"
                        style={{ backgroundColor: getCategoryColor(post.category) }}
                      >
                        {post.category}
                      </span>
                    </div>
                    <div className="post-content">
                      <h3 className="post-title">{post.title}</h3>
                      <p className="post-description">{post.description}</p>
                      <div className="post-footer">
                        <div className="post-author">
                          <span className="author-avatar-sm">
                            {post.author_role === 'teacher' ? '👨‍🏫' : '👤'}
                          </span>
                          <span className="author-name-sm">{post.author_name || 'Admin'}</span>
                        </div>
                        <div className="post-meta">
                          <span><i className="far fa-clock"></i> {post.reading_time || 5} phút</span>
                          <span><i className="far fa-eye"></i> {post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="news-sidebar">
          {/* Trending Posts */}
          <div className="sidebar-widget">
            <h3 className="widget-title">
              <span>🔥</span> Đang thịnh hành
            </h3>
            <div className="trending-list">
              {trendingPosts.map((post, index) => (
                <div key={post.id} className="trending-item">
                  <div className="trending-number">{index + 1}</div>
                  <div className="trending-content">
                    <h4 className="trending-title">{post.title}</h4>
                    <div className="trending-meta">
                      <span className="trending-author">{post.author_name || 'Admin'}</span>
                      <span className="trending-stats">
                        <i className="far fa-eye"></i> {post.views || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="sidebar-widget newsletter-widget">
            <h3 className="widget-title">
              <span>📬</span> Đặc biệt
            </h3>
            <p className="newsletter-text">Đăng ký nhận tin 🎁</p>
            <p className="newsletter-subtext">
              Nhận các bài viết mới nhất về học tiếng Anh và AI qua email mỗi tuần
            </p>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Email của bạn" 
                className="newsletter-input"
              />
              <button className="newsletter-btn">Đăng ký ngay 🚀</button>
            </div>
          </div>

          {/* Stats */}
          <div className="sidebar-widget stats-widget">
            <div className="stat-box-sidebar">
              <div className="stat-icon">📄</div>
              <div className="stat-info">
                <div className="stat-number">{newsData.length}</div>
                <div className="stat-label">Bài viết</div>
              </div>
            </div>
            <div className="stat-box-sidebar">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-number">2.4K</div>
                <div className="stat-label">Độc giả</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default News;

