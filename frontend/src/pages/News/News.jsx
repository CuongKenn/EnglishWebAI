import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { newsAPI } from '../../services/api';
import { useNews } from '../../hooks';
import ShareModal from '../../components/ShareModal/ShareModal';
import { 
  Sparkles, 
  BookOpen, 
  ArrowLeft,
  PartyPopper,
  FileText,
  Tag,
  Megaphone,
  GraduationCap,
  User,
  Clock,
  Eye,
  Heart,
  Calendar,
  TrendingUp,
  Mail,
  FileCheck,
  Flame
} from 'lucide-react';
import './News.css';

const News = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedNews, setSelectedNews] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
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

  const handleOpenDetail = async (post) => {
    setSelectedNews(post);
    try {
      // Fetch detail to increase view count and update views
      const data = await newsAPI.getNewsDetail(post.id);
      setSelectedNews(prev => prev ? { ...prev, views: data.views } : { ...post, views: data.views });
    } catch {
      // Ignore if detail fetch fails - still show modal with existing data
    }
  };

  const handleCloseDetail = () => {
    setSelectedNews(null);
  };

  const handleLike = async () => {
    if (!selectedNews) return;
    try {
      const res = await newsAPI.likeNews(selectedNews.id);
      setSelectedNews({ ...selectedNews, likes: res.likes });
    } catch {
      // Error liking news - user may need to log in
      alert('Vui lòng đăng nhập để thích bài viết');
    }
  };

  const handleShare = async () => {
    if (!selectedNews) return;
    const shareUrl = `${window.location.origin}/news/${selectedNews.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: selectedNews.title, text: selectedNews.description, url: shareUrl });
      } else {
        setShareUrl(shareUrl);
        setShowShareModal(true);
      }
    } catch {
      /* Share API failed - fallback to modal */
      setShareUrl(shareUrl);
      setShowShareModal(true);
    }
  };

  return (
    <div className="news-page">
      <div className="news-header">
        <div className="news-header-content">
          <Link to="/" className="back-link">
            <ArrowLeft className="h-4 w-4 mr-2 inline-block" />
            Về trang chủ
          </Link>
          <h1 className="news-page-title">
            <Sparkles className="h-8 w-8 inline-block mr-3" />
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
            {categories.map((cat) => {
              const isAll = cat === 'all';
              const label = isAll ? 'Tất cả' : cat;
              const accent = isAll ? '#6366f1' : getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ '--tab-color': accent }}
                >
                  {isAll && <BookOpen className="h-4 w-4 inline-block mr-1.5" />}
                  <span className="tab-label">{label}</span>
                </button>
              );
            })}
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
                <article className="featured-post" onClick={() => handleOpenDetail(featuredPost)} style={{ cursor: 'pointer' }}>
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
                          {featuredPost.author_role === 'teacher' ? (
                            <GraduationCap className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
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
                          <Clock className="stat-icon h-4 w-4 inline" /> {featuredPost.reading_time || 5} phút đọc
                        </span>
                        <span className="stat-item">
                          <Eye className="stat-icon h-4 w-4 inline" /> {featuredPost.views || 0}
                        </span>
                        <span className="stat-item">
                          <Heart className="stat-icon h-4 w-4 inline" /> {featuredPost.likes || 0}
                        </span>
                        <span className="stat-item">
                          <Calendar className="stat-icon h-4 w-4 inline" /> {featuredPost.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Regular Posts Grid */}
              <div className="posts-grid">
                {regularPosts.map((post) => (
                  <article key={post.id} className="post-card" onClick={() => handleOpenDetail(post)} style={{ cursor: 'pointer' }}>
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
                            {post.author_role === 'teacher' ? (
                              <GraduationCap className="h-4 w-4 inline" />
                            ) : (
                              <User className="h-4 w-4 inline" />
                            )}
                          </span>
                          <span className="author-name-sm">{post.author_name || 'Admin'}</span>
                        </div>
                        <div className="post-meta">
                          <span><Clock className="far h-4 w-4 inline" /> {post.reading_time || 5} phút</span>
                          <span><Eye className="far h-4 w-4 inline" /> {post.views || 0}</span>
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
              <Flame className="inline h-5 w-5 mr-2" /> Đang thịnh hành
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
                        <Eye className="stat-icon h-4 w-4 inline" /> {post.views || 0}
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
              <Mail className="inline h-5 w-5 mr-2" /> Đặc biệt
            </h3>
            <p className="newsletter-text">Đăng ký nhận tin <Sparkles className="inline h-4 w-4" /></p>
            <p className="newsletter-subtext">
              Nhận các bài viết mới nhất về học tiếng Anh và AI qua email mỗi tuần
            </p>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Email của bạn" 
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                Đăng ký ngay <TrendingUp className="inline h-4 w-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="sidebar-widget stats-widget">
            <div className="stat-box-sidebar">
              <div className="stat-icon">
                <FileCheck className="h-8 w-8" />
              </div>
              <div className="stat-info">
                <div className="stat-number">{newsData.length}</div>
                <div className="stat-label">Bài viết</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content-news-detail" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseDetail}>×</button>

            <div className="news-detail-header">
              <span
                className="news-detail-category"
                style={{ backgroundColor: getCategoryColor(selectedNews.category) }}
              >
                {selectedNews.icon} {selectedNews.category}
              </span>
              <h1 className="news-detail-title">{selectedNews.title}</h1>
              <p className="news-detail-description">{selectedNews.description}</p>

              <div className="news-detail-meta">
                <div className="author-info-detail">
                  <div className="author-avatar-detail">
                    {selectedNews.author_role === 'teacher' ? (
                      <GraduationCap className="h-6 w-6" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div className="author-details-detail">
                    <span className="author-name-detail">{selectedNews.author_name || 'Admin'}</span>
                    <span className="author-role-detail">
                      {selectedNews.author_role === 'teacher' ? 'Giáo viên' : 'Admin'}
                    </span>
                  </div>
                </div>
                <div className="post-stats-detail">
                <span className="stat-item-detail">
                  <Clock className="stat-icon h-4 w-4 inline" /> {selectedNews.reading_time || 5} phút đọc
                </span>
                <span className="stat-item-detail">
                  <Eye className="stat-icon h-4 w-4 inline" /> {selectedNews.views || 0}
                </span>
                <span className="stat-item-detail">
                  <Heart className="stat-icon h-4 w-4 inline" /> {selectedNews.likes || 0}
                </span>
                <span className="stat-item-detail">
                  <Calendar className="stat-icon h-4 w-4 inline" /> {selectedNews.date}
                </span>
                </div>
              </div>
            </div>

            {selectedNews.image && (
              <div className="news-detail-image">
                <img src={selectedNews.image} alt={selectedNews.title} />
              </div>
            )}

            <div className="news-detail-content">
              <div className="news-content-text" style={{ whiteSpace: 'pre-wrap' }}>
                {selectedNews.content}
              </div>
            </div>

            <div className="news-detail-actions">
              <button className="action-btn like-btn" onClick={handleLike}>
                <i className="far fa-heart"></i> Thích ({selectedNews.likes || 0})
              </button>
              <button className="action-btn share-btn" onClick={handleShare}>
                <i className="fas fa-share"></i> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title="Chia sẻ bài viết"
      />
    </div>
  );
};

export default News;

