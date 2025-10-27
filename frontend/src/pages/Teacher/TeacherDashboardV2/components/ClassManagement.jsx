import React, { useState } from 'react';
import { Users, TrendingUp, Plus, Eye, UserPlus } from 'lucide-react';
import './ClassManagement.css';

const ClassManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { label: 'Tổng số lớp', value: 4, icon: Users, color: '#3b82f6' },
    { label: 'Tổng học sinh', value: 118, icon: Users, color: '#10b981' },
    { label: 'Điểm TB chung', value: 7.9, icon: TrendingUp, color: '#8b5cf6' }
  ];

  const classes = [
    {
      id: 1,
      name: 'Lớp 10A1',
      subject: 'Tiếng Anh',
      grade: 'Khối 10',
      studentCount: 32,
      schedule: 'T2, T4, T6 (7:00 - 7:45)',
      averageScore: 7.8,
      completionRate: 85
    },
    {
      id: 2,
      name: 'Lớp 10A2',
      subject: 'Tiếng Anh',
      grade: 'Khối 10',
      studentCount: 30,
      schedule: 'T3, T5, T7 (8:00 - 8:45)',
      averageScore: 8.2,
      completionRate: 92
    },
    {
      id: 3,
      name: 'Lớp 11B1',
      subject: 'Tiếng Anh',
      grade: 'Khối 11',
      studentCount: 28,
      schedule: 'T2, T4, T6 (8:00 - 8:45)',
      averageScore: 7.5,
      completionRate: 78
    },
    {
      id: 4,
      name: 'Lớp 11B2',
      subject: 'Tiếng Anh',
      grade: 'Khối 11',
      studentCount: 28,
      schedule: 'T3, T5, T7 (9:00 - 9:45)',
      averageScore: 8.0,
      completionRate: 88
    }
  ];

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="class-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý lớp học</h1>
          <p className="page-subtitle">Quản lý thông tin các lớp học và học sinh</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color }}>
                <Icon size={24} color="white" />
              </div>
              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Add */}
      <div className="class-controls">
        <input
          type="text"
          placeholder="Tìm kiếm lớp học..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="add-btn">
          <Plus size={18} />
          Thêm lớp mới
        </button>
      </div>

      {/* Classes Grid */}
      <div className="classes-grid">
        {filteredClasses.map(cls => (
          <div key={cls.id} className="class-card">
            <div className="class-header">
              <div>
                <h3 className="class-name">{cls.name}</h3>
                <p className="class-subject">{cls.subject}</p>
              </div>
              <div className="class-grade-badge">{cls.grade}</div>
            </div>

            <div className="class-info">
              <div className="info-row">
                <span className="info-label">Sĩ số:</span>
                <span className="info-value">{cls.studentCount} học sinh</span>
              </div>
              <div className="info-row">
                <span className="info-label">Lịch học:</span>
                <span className="info-value">{cls.schedule}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Điểm TB:</span>
                <span className="info-value">{cls.averageScore}</span>
              </div>
            </div>

            <div className="class-progress">
              <div className="progress-label">
                <span>Hoàn thành bài tập</span>
                <span>{cls.completionRate}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${cls.completionRate}%` }}
                />
              </div>
            </div>

            <div className="class-actions">
              <button className="action-btn primary-btn">
                <Eye size={16} />
                Xem chi tiết
              </button>
              <button className="action-btn secondary-btn">
                <UserPlus size={16} />
                Học sinh
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassManagement;
