import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useNewsDetail } from '../../hooks';
import './News.css';

const NewsDetail = () => {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const { newsItem, loading, error } = useNewsDetail(newsId);

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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/news/${newsId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: newsItem?.title, text: newsItem?.description, url: shareUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Đã sao chép liên kết bài viết');
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Đã sao chép liên kết bài viết');
      }
    } catch (err) {
      alert('Không thể chia sẻ. Hãy sao chép liên kết: ' + shareUrl);
    }
  };

  if (loading) {
    return (
      <div className="news-page">
        <div className="news-header">
          <div className="news-header-content">
            <Link to="/" className="back-link"><i className="fas fa-arrow-left"></i> Về trang chủ</Link>
            <h1 className="news-page-title"><span className="title-icon">📰</span>Tin tức</h1>
          </div>
        </div>
        <div className="news-container"><p>Đang tải...</p></div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="news-page">
        <div className="news-header">
          <div className="news-header-content">
            <button className="back-link" onClick={() => navigate(-1)}><i className="fas fa-arrow-left"></i> Quay lại</button>
            <h1 className="news-page-title"><span className="title-icon">📰</span>Tin tức</h1>
            <p className="news-page-subtitle">Không tìm thấy bài viết.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="news-header">
        <div className="news-header-content">
          <Link to="/news" className="back-link">
            <i className="fas fa-arrow-left"></i>
            Tin tức
          </Link>
          <h1 className="news-page-title">
            <span className="title-icon">✨</span>
            {newsItem.title}
          </h1>
          {newsItem.description && (
            <p className="news-page-subtitle">{newsItem.description}</p>
          )}
        </div>
      </div>

      <div className="news-container" style={{ gridTemplateColumns: '1fr' }}>
        <main className="news-main" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="news-detail-header">
            <span className="news-detail-category" style={{ backgroundColor: getCategoryColor(newsItem.category) }}>
              {newsItem.icon || '📰'} {newsItem.category}
            </span>
            <h1 className="news-detail-title">{newsItem.title}</h1>
            {newsItem.description && (
              <p className="news-detail-description">{newsItem.description}</p>
            )}
            <div className="news-detail-meta">
              <div className="author-info-detail">
                <div className="author-avatar-detail">👤</div>
                <div className="author-details-detail">
                  <span className="author-name-detail">{newsItem.author_name || 'Admin'}</span>
                  <span className="author-role-detail">{newsItem.author_role || 'admin'}</span>
                </div>
              </div>
              <div className="post-stats-detail">
                <span className="stat-item-detail"><span className="stat-icon">⏱️</span> {newsItem.reading_time || 5} phút đọc</span>
                <span className="stat-item-detail"><span className="stat-icon">👁️</span> {newsItem.views || 0}</span>
                <span className="stat-item-detail"><span className="stat-icon">❤️</span> {newsItem.likes || 0}</span>
              </div>
            </div>
          </div>

          {newsItem.image && (
            <div className="news-detail-image">
              <img src={newsItem.image} alt={newsItem.title} />
            </div>
          )}

          <div className="news-detail-content">
            <div className="news-content-text" style={{ whiteSpace: 'pre-wrap' }}>
              {newsItem.content}
            </div>
          </div>

          <div className="news-detail-actions">
            <button className="action-btn share-btn" onClick={handleShare}>
              <i className="fas fa-share"></i> Chia sẻ bài viết
            </button>
            <Link className="action-btn" to="/news">
              <i className="fas fa-list"></i> Về danh sách
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewsDetail;
