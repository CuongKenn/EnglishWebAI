import React, { useEffect, useState } from 'react';
import './OverviewStats.css';
import apiClient from '../../../services/api';

const OverviewStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    activeUsers: 0,
    totalClasses: 0,
    activeClasses: 0,
    averageStudents: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get('/api/v1/admin/stats/overview');
      setStats(res.data || {});
    } catch (e) {
      setError('Không tải được thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="admin-container">
      <div className="admin-content">
        {/* Header */}
        <div className="admin-header">
          <h1>📊 Thống kê tổng quan</h1>
          <p>Xem báo cáo và phân tích hiệu suất hệ thống</p>
        </div>

        {/* Main Statistics Cards (Real Data) */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tổng người dùng</span>
            </div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-subtitle">Toàn hệ thống</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Giáo viên</span>
            </div>
            <div className="stat-value">{stats.totalTeachers}</div>
            <div className="stat-subtitle">Đang hoạt động</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Học sinh</span>
            </div>
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-subtitle">Đã đăng ký</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Người dùng hoạt động</span>
            </div>
            <div className="stat-value">{stats.activeUsers}</div>
            <div className="stat-subtitle">Đang active</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Tổng lớp học</span>
            </div>
            <div className="stat-value">{stats.totalClasses}</div>
            <div className="stat-subtitle">Toàn hệ thống</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Lớp đang mở</span>
            </div>
            <div className="stat-value">{stats.activeClasses}</div>
            <div className="stat-subtitle">Sẵn sàng</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">TB học sinh / lớp</span>
            </div>
            <div className="stat-value">{stats.averageStudents}</div>
            <div className="stat-subtitle">Số học sinh</div>
          </div>
        </div>

        {error && (
          <div style={{ color: '#b91c1c', marginTop: '10px' }}>{error}</div>
        )}
        {loading && (
          <div style={{ color: '#6b7280', marginTop: '10px' }}>Đang tải dữ liệu...</div>
        )}
      </div>
    </div>
  );
};

export default OverviewStats;

