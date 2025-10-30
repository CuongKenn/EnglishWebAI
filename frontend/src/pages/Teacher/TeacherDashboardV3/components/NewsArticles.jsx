import { useState, useEffect } from 'react';
import { newsAPI } from '../../../../services/api';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';
import './NewsArticles.css';

const NewsArticles = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Thông báo',
    icon: '📰',
    type: 'announcement',
    image: '',
    status: 'published'
  });

  const categories = ['Thông báo', 'Khuyến mãi', 'Học tập', 'Hướng dẫn', 'Sự kiện', 'Tính năng mới'];
  const types = [
    { value: 'announcement', label: 'Thông báo', icon: '📢' },
    { value: 'promotion', label: 'Khuyến mãi', icon: '🎁' },
    { value: 'tips', label: 'Mẹo học tập', icon: '💡' },
    { value: 'guide', label: 'Hướng dẫn', icon: '📖' },
    { value: 'event', label: 'Sự kiện', icon: '🎉' },
    { value: 'feature', label: 'Tính năng mới', icon: '✨' }
  ];

  const icons = ['📰', '📢', '🎁', '💡', '📖', '🎉', '✨', '🚀', '🔥', '⭐', '🎯', '📚'];

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await newsAPI.getAllNewsForManagement();
      setNewsList(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
      showError('Không thể tải danh sách tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (news = null) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        title: news.title,
        description: news.description || '',
        content: news.content,
        category: news.category,
        icon: news.icon || '📰',
        type: news.type,
        image: news.image || '',
        status: news.status
      });
    } else {
      setEditingNews(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: 'Thông báo',
        icon: '📰',
        type: 'announcement',
        image: '',
        status: 'published'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNews(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingNews) {
        await newsAPI.updateNews(editingNews.id, formData);
        showSuccess('Cập nhật tin tức thành công!');
      } else {
        await newsAPI.createNews(formData);
        showSuccess('Tạo tin tức thành công!');
      }
      handleCloseModal();
      loadNews();
    } catch (error) {
      console.error('Error saving news:', error);
      showError('Lỗi: ' + (error?.detail || 'Không thể lưu tin tức'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin tức này?')) return;
    
    try {
      await newsAPI.deleteNews(id);
      showSuccess('Đã xóa tin tức');
      loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      showError('Không thể xóa tin tức');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      published: { text: 'Đã xuất bản', color: '#10b981' },
      draft: { text: 'Nháp', color: '#f59e0b' },
      archived: { text: 'Lưu trữ', color: '#6b7280' }
    };
    const badge = badges[status] || badges.published;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 600,
        background: badge.color,
        color: 'white'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="manage-news-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📰 Quản lý Tin tức</h1>
          <p className="page-subtitle">Tạo và quản lý tin tức, thông báo cho hệ thống</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <span>➕</span> Tạo tin tức mới
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
            </div>
      ) : (
        <div className="news-table-container">
          <table className="news-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Lượt thích</th>
                <th>Tác giả</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((news) => (
                <tr key={news.id}>
                  <td>
                    <div className="news-title-cell">
                      <span className="news-icon-cell">{news.icon}</span>
            <div>
                        <div className="news-title-text">{news.title}</div>
                        <div className="news-desc-text">{news.description}</div>
            </div>
          </div>
                  </td>
                  <td>
                    <span className="category-badge">{news.category}</span>
                  </td>
                  <td>{getStatusBadge(news.status)}</td>
                  <td>👁️ {news.views || 0}</td>
                  <td>❤️ {news.likes || 0}</td>
                  <td>{news.author_name}</td>
                  <td>{new Date(news.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleOpenModal(news)}
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(news.id)}
                        title="Xóa"
                      >
                        🗑️
                      </button>
            </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {newsList.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <h3>Chưa có tin tức nào</h3>
              <p>Tạo tin tức đầu tiên để bắt đầu</p>
            </div>
          )}
          </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content-news" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNews ? 'Chỉnh sửa tin tức' : 'Tạo tin tức mới'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="news-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Tiêu đề *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Nhập tiêu đề tin tức"
                  />
            </div>
          </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mô tả ngắn</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Mô tả ngắn gọn về tin tức"
                  />
            </div>
      </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nội dung *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={6}
                    placeholder="Nội dung chi tiết của tin tức"
            />
          </div>
                </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  </div>

                <div className="form-group">
                  <label>Loại</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  </div>
                </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Icon</label>
                  <div className="icon-selector">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`icon-btn ${formData.icon === icon ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>URL Hình ảnh</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image && (
                    <div className="image-preview">
                      <img src={formData.image} alt="Preview" />
                </div>
                  )}
                  </div>
                </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="published">Xuất bản</option>
                    <option value="draft">Lưu nháp</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingNews ? 'Cập nhật' : 'Tạo mới'}
                </button>
            </div>
            </form>
              </div>
            </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default NewsArticles;
