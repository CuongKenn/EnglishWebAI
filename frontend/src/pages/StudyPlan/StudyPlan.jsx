import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, CheckCircle, Clock, ChevronRight, Calendar
} from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';
import './StudyPlan.css';

// Dữ liệu giả cho kế hoạch học
const studyPlanData = {
  '2025-04': {
    month: 'Tháng 4 Năm 2025',
    sessions: [
      {
        id: 1,
        sessionNumber: 1,
        date: 'Th 5, 24 Thg 4',
        fullDate: '2025-04-24',
        title: 'Mở đầu khóa Từ vựng',
        category: 'Vocabulary',
        status: 'completed',
        cupsEarned: 3,
        totalCups: 3,
        completedDate: 'Hoàn thành: 21/6'
      },
      {
        id: 2,
        sessionNumber: 2,
        date: 'Th 6, 25 Thg 4',
        fullDate: '2025-04-25',
        title: 'Bài giới thiệu khóa Ngữ pháp',
        category: 'Grammar',
        status: 'in-progress',
        cupsEarned: 0,
        totalCups: 3,
        message: 'Bạn chưa hoàn thành buổi học này'
      },
      {
        id: 3,
        sessionNumber: 3,
        date: 'Th 5, 24 Thg 4',
        fullDate: '2025-04-24',
        title: 'Tổng quan phát âm',
        category: 'Pronunciation',
        status: 'completed',
        cupsEarned: 3,
        totalCups: 3,
        completedDate: 'Hoàn thành trước'
      },
      {
        id: 4,
        sessionNumber: 4,
        date: 'Th 7, 26 Thg 4',
        fullDate: '2025-04-26',
        title: 'Thế giới tự nhiên',
        category: 'Vocabulary',
        status: 'completed',
        cupsEarned: 2,
        totalCups: 3,
        completedDate: 'Hoàn thành: 2/7'
      },
      {
        id: 5,
        sessionNumber: 5,
        date: 'CN, 27 Thg 4',
        fullDate: '2025-04-27',
        title: 'Danh từ',
        category: 'Grammar',
        status: 'in-progress',
        cupsEarned: 0,
        totalCups: 3,
        message: 'Bạn chưa hoàn thành buổi học này'
      },
      {
        id: 6,
        sessionNumber: 6,
        date: 'Th 2, 28 Thg 4',
        fullDate: '2025-04-28',
        title: 'Bài nghe chép chính tả 1',
        category: 'Listening',
        status: 'in-progress',
        cupsEarned: 1,
        totalCups: 3,
        message: 'Bạn chưa hoàn thành buổi học này'
      },
      {
        id: 7,
        sessionNumber: 7,
        date: 'Th 3, 29 Thg 4',
        fullDate: '2025-04-29',
        title: 'Các lời phát âm thường gặp',
        category: 'Pronunciation',
        status: 'completed',
        cupsEarned: 2,
        totalCups: 3,
        completedDate: 'Hoàn thành trước'
      },
      {
        id: 8,
        sessionNumber: 8,
        date: 'Th 3, 29 Thg 4',
        fullDate: '2025-04-29',
        title: 'Bài kiểm tra 1 - Từ vựng',
        category: 'Vocabulary',
        status: 'completed',
        cupsEarned: 3,
        totalCups: 3,
        completedDate: 'Hoàn thành: 3/7'
      },
      {
        id: 9,
        sessionNumber: 9,
        date: 'Th 4, 30 Thg 4',
        fullDate: '2025-04-30',
        title: 'Mind map 1',
        category: 'Grammar',
        status: 'in-progress',
        cupsEarned: 0,
        totalCups: 3,
        message: 'Bạn chưa hoàn thành buổi học này'
      }
    ]
  },
  '2025-05': {
    month: 'Tháng 5 Năm 2025',
    sessions: [
      {
        id: 10,
        sessionNumber: 10,
        date: 'Th 5, 1 Thg 5',
        fullDate: '2025-05-01',
        title: 'Dị nghĩa chính chính tả',
        category: 'Vocabulary',
        status: 'not-started',
        cupsEarned: 0,
        totalCups: 3
      },
      {
        id: 11,
        sessionNumber: 11,
        date: 'Th 6, 2 Thg 5',
        fullDate: '2025-05-02',
        title: 'Bài kiểm tra 1 - Phát âm',
        category: 'Pronunciation',
        status: 'not-started',
        cupsEarned: 1,
        totalCups: 3
      },
      {
        id: 12,
        sessionNumber: 12,
        date: 'Th 7, 3 Thg 5',
        fullDate: '2025-05-03',
        title: 'Hoạt động thực nghĩa',
        category: 'Grammar',
        status: 'completed',
        cupsEarned: 3,
        totalCups: 3,
        completedDate: 'Đã Hoàn Thành: Thứ Bảy, 5 Tháng 7'
      }
    ]
  }
};

const categoryStyles = {
  Vocabulary: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  Grammar: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  Pronunciation: { bg: '#dbeafe', border: '#93c5fd', text: '#1e3a8a' },
  Listening: { bg: '#fce7f3', border: '#f9a8d4', text: '#831843' },
  Reading: { bg: '#e0e7ff', border: '#c7d2fe', text: '#3730a3' },
  Writing: { bg: '#fed7aa', border: '#fdba74', text: '#7c2d12' },
  Speaking: { bg: '#e9d5ff', border: '#d8b4fe', text: '#6b21a8' }
};

const StudyPlan = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeMenuItem, setActiveMenuItem] = useState('study-plan');
  const [selectedMonth, setSelectedMonth] = useState('2025-04');
  const [isContentPushed, setIsContentPushed] = useState(false);

  const months = Object.keys(studyPlanData);
  const currentMonthData = studyPlanData[selectedMonth];

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'completed': return 'session-completed';
      case 'in-progress': return 'session-in-progress';
      case 'not-started': return 'session-not-started';
      default: return '';
    }
  };

  const getSessionBadgeText = (sessionNumber) => {
    return `Buổi ${sessionNumber}`;
  };

  const handleMenuItemClick = (itemId) => {
    setActiveMenuItem(itemId);
    setIsContentPushed(true);
  };

  return (
    <ConsistentSidebarLayout 
      activeMenuItem={activeMenuItem}
      onMenuItemClick={handleMenuItemClick}
      courseTitle="Học bài"
    >
      <div className={`study-plan-content-wrapper ${isContentPushed ? 'pushed-out' : ''}`}>
        {/* Header */}
        <div className="study-plan-header">
          <div className="header-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Tổng quan
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="study-plan-content">
          {/* Month Selector */}
          <div className="month-selector">
            {months.map(month => (
              <button
                key={month}
                className={`month-btn ${selectedMonth === month ? 'active' : ''}`}
                onClick={() => setSelectedMonth(month)}
              >
                {studyPlanData[month].month}
              </button>
            ))}
          </div>

          {/* Month Title */}
          <h2 className="month-title">{currentMonthData?.month || 'Tháng 4 Năm 2025'}</h2>

          {/* Sessions Grid */}
          <div className="sessions-grid">
            {currentMonthData?.sessions?.map(session => {
              const categoryStyle = categoryStyles[session.category] || categoryStyles.Vocabulary;
              
              return (
                <div 
                  key={session.id} 
                  className={`session-card ${getStatusBadgeClass(session.status)}`}
                >
                  {/* Session Header */}
                  <div className="session-header">
                    <div 
                      className="session-badge"
                      style={{
                        background: session.status === 'completed' ? '#10b981' : 
                                   session.status === 'in-progress' ? '#f59e0b' : '#94a3b8'
                      }}
                    >
                      {getSessionBadgeText(session.sessionNumber)}
                      {(session.status === 'completed' || session.cupsEarned > 0) && <CheckCircle size={14} className="check-icon" />}
                    </div>
                    <span className="session-date">{session.date}</span>
                  </div>

                  {/* Session Content */}
                  <div className="session-content">
                    <div className="session-indicator">
                      <div className="indicator-dot"></div>
                      <span className="session-title">{session.title}</span>
                    </div>
                    
                    <div 
                      className="session-category"
                      style={{
                        background: categoryStyle.bg,
                        borderColor: categoryStyle.border,
                        color: categoryStyle.text
                      }}
                    >
                      {session.category}
                    </div>

                    {/* Status Messages */}
                    {session.message && (
                      <p className="session-message">{session.message}</p>
                    )}
                  </div>

                  {/* Session Footer */}
                  <div className="session-footer">
                    <div className="cups-indicator">
                      <Award size={16} className="cup-icon" />
                      <span className="cups-text">{session.cupsEarned}/{session.totalCups}</span>
                    </div>
                    <button className="session-action-btn">
                      {session.cupsEarned === session.totalCups ? 'Xem lại' : 
                       session.cupsEarned > 0 ? 'Tiếp tục' : 'Bắt đầu'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            }) || []}
          </div>
        </div>
      </div>
    </ConsistentSidebarLayout>
  );
};

export default StudyPlan;

