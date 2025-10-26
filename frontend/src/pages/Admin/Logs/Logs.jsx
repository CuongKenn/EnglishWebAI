import React, { useState, useEffect } from 'react';
import './Logs.css';
import apiClient from '../../../services/api';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const mockLogs = [
    {
      id: 1,
      timestamp: new Date().toISOString(),
      level: 'info',
      type: 'user',
      action: 'Đăng nhập',
      user: 'admin@example.com',
      details: 'Đăng nhập thành công từ IP: 192.168.1.1',
      icon: '🔐'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'success',
      type: 'class',
      action: 'Tạo lớp học',
      user: 'teacher@example.com',
      details: 'Tạo lớp học mới: Lớp 10A1 - Tiếng Anh',
      icon: '🏫'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'warning',
      type: 'system',
      action: 'Cảnh báo',
      user: 'System',
      details: 'CPU usage cao: 85%',
      icon: '⚠️'
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: 'error',
      type: 'api',
      action: 'Lỗi API',
      user: 'student@example.com',
      details: 'Failed to fetch data: Connection timeout',
      icon: '❌'
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      level: 'info',
      type: 'user',
      action: 'Cập nhật profile',
      user: 'parent@example.com',
      details: 'Cập nhật thông tin cá nhân',
      icon: '👤'
    }
  ];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Attempt to load from API
      const res = await apiClient.get('/api/v1/admin/logs');
      setLogs(res.data || mockLogs);
    } catch (error) {
      // Fall back to mock data
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    const badges = {
      info: { bg: '#3b82f6', text: 'Thông tin' },
      success: { bg: '#10b981', text: 'Thành công' },
      warning: { bg: '#f59e0b', text: 'Cảnh báo' },
      error: { bg: '#ef4444', text: 'Lỗi' }
    };
    const badge = badges[level] || badges.info;
    return (
      <span className="log-badge" style={{ background: badge.bg }}>
        {badge.text}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesLevel && matchesSearch;
  });

  return (
    <div className="logs-page">
      {/* Header */}
      <div className="logs-header">
        <div>
          <h1 className="logs-title">📋 Nhật ký hệ thống</h1>
          <p className="logs-subtitle">Theo dõi các hoạt động và sự kiện trong hệ thống</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadLogs}>
            🔄 Làm mới
          </button>
          <button className="export-btn">
            📥 Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="logs-filters">
        <div className="filter-group">
          <label>🔍 Tìm kiếm:</label>
          <input
            type="text"
            placeholder="Tìm kiếm trong logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <label>📂 Loại:</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="user">Người dùng</option>
            <option value="class">Lớp học</option>
            <option value="system">Hệ thống</option>
            <option value="api">API</option>
          </select>
        </div>

        <div className="filter-group">
          <label>📊 Mức độ:</label>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="filter-select">
            <option value="all">Tất cả</option>
            <option value="info">Thông tin</option>
            <option value="success">Thành công</option>
            <option value="warning">Cảnh báo</option>
            <option value="error">Lỗi</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="logs-stats">
        <div className="stat-item">
          <span className="stat-label">Tổng logs:</span>
          <span className="stat-value">{logs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Đang hiển thị:</span>
          <span className="stat-value">{filteredLogs.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lỗi:</span>
          <span className="stat-value error">{logs.filter(l => l.level === 'error').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Cảnh báo:</span>
          <span className="stat-value warning">{logs.filter(l => l.level === 'warning').length}</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="logs-table-container">
        {loading ? (
          <div className="loading-state">⏳ Đang tải nhật ký...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Không có nhật ký nào</p>
          </div>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Icon</th>
                <th style={{ width: '180px' }}>Thời gian</th>
                <th style={{ width: '120px' }}>Mức độ</th>
                <th style={{ width: '150px' }}>Hành động</th>
                <th style={{ width: '180px' }}>Người dùng</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className={`log-row log-${log.level}`}>
                  <td className="log-icon">{log.icon}</td>
                  <td className="log-timestamp">{formatTimestamp(log.timestamp)}</td>
                  <td>{getLevelBadge(log.level)}</td>
                  <td className="log-action">{log.action}</td>
                  <td className="log-user">{log.user}</td>
                  <td className="log-details">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Logs;
