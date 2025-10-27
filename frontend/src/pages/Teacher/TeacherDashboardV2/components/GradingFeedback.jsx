import React, { useState } from 'react';
import { Clock, CheckCircle, MessageCircle, Sparkles, UserCheck } from 'lucide-react';
import './GradingFeedback.css';

const GradingFeedback = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { label: 'Chờ chấm', value: '3 bài', icon: Clock, color: '#f97316' },
    { label: 'Đã chấm', value: '2 bài', icon: CheckCircle, color: '#10b981' },
    { label: 'Điểm TB', value: '7.8', icon: MessageCircle, color: '#8b5cf6' }
  ];

  const tabs = [
    { id: 'all', label: 'Tất cả', count: 5 },
    { id: 'pending', label: 'Chờ chấm', count: 3 },
    { id: 'graded', label: 'Đã chấm', count: 2 }
  ];

  const submissions = [
    {
      id: 1,
      studentId: 'HS001',
      studentName: 'Nguyễn Văn A',
      className: '10A1',
      assignment: 'Kiểm tra 15 phút - Unit 6',
      submittedAt: '27/10/2025 14:30',
      score: null,
      status: 'Chờ chấm',
      statusColor: '#f97316'
    },
    {
      id: 2,
      studentId: 'HS003',
      studentName: 'Lê Văn C',
      className: '11B2',
      assignment: 'Kiểm tra giữa kỳ HK1',
      submittedAt: '26/10/2025 10:20',
      score: null,
      status: 'Chờ chấm',
      statusColor: '#f97316'
    },
    {
      id: 3,
      studentId: 'HS005',
      studentName: 'Hoàng Văn E',
      className: '10A2',
      assignment: 'Bài tập về nhà - Reading',
      submittedAt: '25/10/2025 18:30',
      score: null,
      status: 'Chờ chấm',
      statusColor: '#f97316'
    }
  ];

  const filteredSubmissions = submissions.filter(sub => {
    let matchesTab = true;
    if (activeTab === 'pending') matchesTab = sub.status === 'Chờ chấm';
    else if (activeTab === 'graded') matchesTab = sub.status === 'Đã chấm';

    const matchesSearch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.assignment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="grading-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Chấm điểm & Phản hồi</h1>
          <p className="page-subtitle">Chấm bài và gửi phản hồi cho học sinh</p>
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

      {/* Tabs */}
      <div className="grading-tabs">
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
      <div className="grading-controls">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên học sinh hoặc bài kiểm tra..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="ai-grade-btn">
          <Sparkles size={16} />
          Chấm tự động (AI)
        </button>
      </div>

      {/* Submissions Table */}
      <div className="submissions-table-container">
        <table className="submissions-table">
          <thead>
            <tr>
              <th>MSSV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Bài kiểm tra</th>
              <th>Thời gian nộp</th>
              <th>Điểm</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(submission => (
              <tr key={submission.id}>
                <td className="student-id">{submission.studentId}</td>
                <td className="student-name">{submission.studentName}</td>
                <td>
                  <span className="class-badge">{submission.className}</span>
                </td>
                <td className="assignment-name">{submission.assignment}</td>
                <td className="submitted-time">{submission.submittedAt}</td>
                <td className="score">
                  {submission.score !== null ? submission.score : '-'}
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ color: submission.statusColor }}
                  >
                    {submission.status}
                  </span>
                </td>
                <td>
                  <button className="grade-action-btn">
                    <UserCheck size={16} />
                    Chấm điểm
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubmissions.length === 0 && (
        <div className="empty-state">
          <p>Không có bài nộp nào</p>
        </div>
      )}
    </div>
  );
};

export default GradingFeedback;
