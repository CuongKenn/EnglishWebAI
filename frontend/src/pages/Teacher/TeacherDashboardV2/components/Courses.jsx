import React, { useState } from 'react';
import { BookOpen, Users, TrendingUp, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import './Courses.css';

const Courses = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { label: 'Tổng khóa học', value: 6, icon: BookOpen, color: '#3b82f6' },
    { label: 'Đã hoàn thành', value: 1, icon: Users, color: '#10b981' },
    { label: 'Đang học', value: 4, icon: TrendingUp, color: '#f97316' },
    { label: 'Tổng học sinh', value: 190, icon: Users, color: '#8b5cf6' }
  ];

  const tabs = [
    { id: 'all', label: 'Tất cả', count: 6 },
    { id: 'vocabulary', label: 'Từ vựng', count: 1 },
    { id: 'grammar', label: 'Ngữ pháp', count: 1 },
    { id: 'reading', label: 'Đọc', count: 1 },
    { id: 'writing', label: 'Viết', count: 1 },
    { id: 'listening', label: 'Nghe', count: 1 },
    { id: 'speaking', label: 'Nói', count: 1 }
  ];

  const courses = [
    {
      id: 1,
      title: 'Speaking Cơ Bản Plus',
      type: 'Đang học',
      grade: 'Lớp 10',
      lessons: 24,
      duration: '32 HS',
      progress: 65,
      level: 'PRE-INTERMEDIATE',
      color: '#f3e8ff',
      illustration: '🗣️',
      category: 'speaking'
    },
    {
      id: 2,
      title: 'Writing Cơ Bản Plus 2',
      type: 'Đang học',
      grade: 'Lớp 10',
      lessons: 20,
      duration: '30 HS',
      progress: 45,
      level: 'PRE-INTERMEDIATE',
      color: '#fef3c7',
      illustration: '✍️',
      category: 'writing'
    },
    {
      id: 3,
      title: 'Reading Cơ Bản',
      type: 'Đang học',
      grade: 'Lớp 11',
      lessons: 18,
      duration: '28 HS',
      progress: 80,
      level: 'PRE-INTERMEDIATE',
      color: '#dbeafe',
      illustration: '📖',
      category: 'reading'
    },
    {
      id: 4,
      title: 'Từ Vựng Cơ Bản Plus',
      type: 'Đang học',
      grade: 'Lớp 10',
      lessons: 30,
      duration: '35 HS',
      progress: 30,
      level: 'PRE-INTERMEDIATE',
      color: '#fef9c3',
      illustration: '📚',
      category: 'vocabulary'
    },
    {
      id: 5,
      title: 'Grammar Nâng Cao',
      type: 'Đang học',
      grade: 'Lớp 11',
      lessons: 22,
      duration: '25 HS',
      progress: 55,
      level: 'INTERMEDIATE',
      color: '#d1fae5',
      illustration: '📝',
      category: 'grammar'
    },
    {
      id: 6,
      title: 'Listening Cơ Bản',
      type: 'Hoàn thành',
      grade: 'Lớp 10',
      lessons: 16,
      duration: '30 HS',
      progress: 100,
      level: 'BEGINNER',
      color: '#fce7f3',
      illustration: '🎧',
      category: 'listening'
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesTab = activeTab === 'all' || course.category === activeTab;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <h1 className="page-title">Khóa học</h1>
          <p className="page-subtitle">Quản lý khóa học và cung cấp cho học sinh</p>
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

      {/* Search and Filters */}
      <div className="courses-controls">
        <input
          type="text"
          placeholder="Tìm kiếm khóa học..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="controls-right">
          <select className="filter-select">
            <option>Tất cả lớp</option>
            <option>Lớp 10</option>
            <option>Lớp 11</option>
            <option>Lớp 12</option>
          </select>
          <button className="create-btn">
            <Plus size={18} />
            Tạo khóa học
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="courses-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="courses-grid">
        {filteredCourses.map(course => (
          <div key={course.id} className="course-card" style={{ background: course.color }}>
            <div className="course-header">
              <span className="course-level">{course.level}</span>
            </div>
            
            <div className="course-illustration">
              {course.illustration}
            </div>

            <div className="course-content">
              <h3 className="course-title">{course.title}</h3>
              
              <div className="course-meta">
                <span className="course-badge">{course.type}</span>
                <span className="course-grade">{course.grade}</span>
              </div>

              <div className="course-stats">
                <span>📚 {course.lessons} bài học</span>
                <span>👥 {course.duration}</span>
              </div>

              <div className="course-progress">
                <div className="progress-label">
                  <span>Tiến độ</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <div className="course-actions">
                <button className="action-btn view-btn" title="Xem">
                  <Eye size={16} />
                </button>
                <button className="action-btn edit-btn" title="Sửa">
                  <Edit size={16} />
                </button>
                <button className="action-btn delete-btn" title="Xóa">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Courses;

