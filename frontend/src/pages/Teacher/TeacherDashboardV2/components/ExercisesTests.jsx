import React, { useState } from 'react';
import { Plus, Download, Sparkles, Eye, Edit, UserCheck, Trash2 } from 'lucide-react';
import './ExercisesTests.css';

const ExercisesTests = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'all', label: 'Tất cả', count: 3 },
    { id: 'published', label: 'Đã xuất bản', count: 2 },
    { id: 'draft', label: 'Bản nháp', count: 1 },
    { id: 'completed', label: 'Hoàn thành', count: 0 }
  ];

  const exercises = [
    {
      id: 1,
      className: '10A1',
      classColor: '#ede9fe',
      classTextColor: '#7c3aed',
      title: 'Kiểm tra 15 phút - Unit 6',
      status: 'Đã xuất bản',
      statusColor: '#dbeafe',
      statusTextColor: '#2563eb',
      type: 'Kiểm tra 15 phút',
      questions: 20,
      duration: '15 phút',
      dueDate: '28/10/2025',
      skills: ['reading', 'vocabulary'],
      progress: 88,
      totalStudents: 32
    },
    {
      id: 2,
      className: '11B2',
      classColor: '#fce7f3',
      classTextColor: '#db2777',
      title: 'Kiểm tra giữa kỳ HK1',
      status: 'Đã xuất bản',
      statusColor: '#dbeafe',
      statusTextColor: '#2563eb',
      type: 'Kiểm tra giữa kỳ',
      questions: 50,
      duration: '90 phút',
      dueDate: '30/10/2025',
      skills: ['listening', 'reading', 'writing'],
      progress: 89,
      totalStudents: 28
    },
    {
      id: 3,
      className: '10A3',
      classColor: '#dbeafe',
      classTextColor: '#2563eb',
      title: 'Bài tập về nhà - Reading comprehension',
      status: 'Bản nháp',
      statusColor: '#fef3c7',
      statusTextColor: '#92400e',
      type: 'Bài tập về nhà',
      questions: 15,
      duration: '45 phút',
      dueDate: '01/11/2025',
      skills: ['reading'],
      progress: 0,
      totalStudents: 30
    }
  ];

  const filteredExercises = exercises.filter(ex => {
    let matchesTab = true;
    if (activeTab === 'published') matchesTab = ex.status === 'Đã xuất bản';
    else if (activeTab === 'draft') matchesTab = ex.status === 'Bản nháp';
    else if (activeTab === 'completed') matchesTab = ex.progress === 100;

    const matchesSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.className.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getSkillLabel = (skill) => {
    const labels = {
      'listening': 'listening',
      'speaking': 'speaking',
      'reading': 'reading',
      'writing': 'writing',
      'vocabulary': 'vocabulary',
      'grammar': 'grammar'
    };
    return labels[skill] || skill;
  };

  return (
    <div className="exercises-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bài tập & Kiểm tra</h1>
          <p className="page-subtitle">Quản lý đề bài tập, kiểm tra và chấm điểm</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="exercises-tabs">
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

      {/* Search and Controls */}
      <div className="exercises-controls">
        <input
          type="text"
          placeholder="Tìm kiếm bài kiểm tra..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="controls-right">
          <button className="import-btn">
            <Download size={16} />
            Import đề
          </button>
          <button className="ai-btn">
            <Sparkles size={16} />
            Tạo đề bằng AI
          </button>
          <button className="create-btn">
            <Plus size={16} />
            Tạo mới
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="exercises-list">
        {filteredExercises.map(exercise => (
          <div key={exercise.id} className="exercise-card">
            <div className="exercise-header">
              <div className="exercise-left">
                <span 
                  className="class-badge"
                  style={{ 
                    background: exercise.classColor,
                    color: exercise.classTextColor 
                  }}
                >
                  {exercise.className}
                </span>
                <span 
                  className="status-badge"
                  style={{ 
                    background: exercise.statusColor,
                    color: exercise.statusTextColor 
                  }}
                >
                  {exercise.status}
                </span>
                <span className="type-badge">{exercise.type}</span>
              </div>
              <div className="exercise-actions">
                <button className="icon-btn view-btn" title="Chi tiết">
                  <Eye size={16} />
                  Chi tiết
                </button>
                <button className="icon-btn edit-btn" title="Sửa">
                  <Edit size={16} />
                  Sửa
                </button>
                <button className="icon-btn grade-btn" title="Chấm điểm">
                  <UserCheck size={16} />
                  Chấm điểm
                </button>
                <button className="icon-btn delete-btn" title="Xóa">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>

            <h3 className="exercise-title">{exercise.title}</h3>

            <div className="exercise-meta">
              <div className="meta-item">
                <span className="meta-label">Số câu hỏi</span>
                <span className="meta-value">{exercise.questions} câu</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Thời gian</span>
                <span className="meta-value">{exercise.duration}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Hạn nộp</span>
                <span className="meta-value">{exercise.dueDate}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Kỹ năng</span>
                <span className="meta-value">
                  {exercise.skills.map(skill => getSkillLabel(skill)).join(', ')}
                </span>
              </div>
            </div>

            <div className="exercise-progress">
              <div className="progress-label">
                <span>Tiến độ: {Math.round(exercise.progress * exercise.totalStudents / 100)}/{exercise.totalStudents} học sinh</span>
                <span>{exercise.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${exercise.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="empty-state">
          <p>Không tìm thấy bài tập nào</p>
        </div>
      )}
    </div>
  );
};

export default ExercisesTests;
