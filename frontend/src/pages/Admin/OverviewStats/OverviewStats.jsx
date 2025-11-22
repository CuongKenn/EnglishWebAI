import React, { useEffect, useState } from 'react';
import { MdPeople, MdSchool, MdPersonOutline, MdCheckCircle, MdClass, MdLibraryBooks, MdBarChart } from 'react-icons/md';
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
    } catch {
      // Error loading overview stats
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
          <h1><MdBarChart className="inline-block mr-2" /> Thống kê tổng quan</h1>
          <p>Xem báo cáo và phân tích hiệu suất hệ thống</p>
        </div>

        {/* Main Statistics Cards (Real Data) */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-box blue"><MdPeople size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Tổng người dùng</div>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-subtitle">Toàn hệ thống</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box green"><MdSchool size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Giáo viên</div>
              <div className="stat-value">{stats.totalTeachers}</div>
              <div className="stat-subtitle">Đang hoạt động</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box orange"><MdPersonOutline size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Học sinh</div>
              <div className="stat-value">{stats.totalStudents}</div>
              <div className="stat-subtitle">Đã đăng ký</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box purple"><MdCheckCircle size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Người dùng hoạt động</div>
              <div className="stat-value">{stats.activeUsers}</div>
              <div className="stat-subtitle">Đang active</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box blue"><MdClass size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Tổng lớp học</div>
              <div className="stat-value">{stats.totalClasses}</div>
              <div className="stat-subtitle">Toàn hệ thống</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box green"><MdLibraryBooks size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">Lớp đang mở</div>
              <div className="stat-value">{stats.activeClasses}</div>
              <div className="stat-subtitle">Sẵn sàng</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box orange"><MdBarChart size={32} /></div>
            <div className="stat-info">
              <div className="stat-title">TB học sinh / lớp</div>
              <div className="stat-value">{stats.averageStudents}</div>
              <div className="stat-subtitle">Trung bình</div>
            </div>
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

