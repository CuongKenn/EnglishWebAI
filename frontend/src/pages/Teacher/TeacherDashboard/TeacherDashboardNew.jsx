import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import './TeacherDashboardNew.css';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';

// Import teacher pages
import ClassManagement from '../ClassManagement/ClassManagement';
import MaterialsManagement from '../MaterialsManagement/MaterialsManagement';
import ManageNews from '../ManageNews/ManageNews';
import QuestionBank from '../QuestionBank/QuestionBank';
import AssignmentsTests from '../AssignmentsTests/AssignmentsTests';
import GradingFeedback from '../GradingFeedback/GradingFeedback';
import StatisticsReports from '../StatisticsReports/StatisticsReports';
import OnlineTeaching from '../OnlineTeaching/OnlineTeaching';
import TeacherOverview from '../TeacherOverview/TeacherOverview';
import CoursesManage from '../CoursesManage/CoursesManage';

const TeacherDashboardNew = ({ onLogout }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
      navigate('/');
    }
  };

  return (
    <div className="teacher-dashboard-new-wrapper">
      {/* Top Navbar - Đồng bộ với template chung */}
      <Navbar userRole="teacher" isLoggedIn={true} onLogout={handleLogout} />

      {/* Dashboard Body (Sidebar + Content) */}
      <div className="teacher-dashboard-body">
        {/* Sidebar */}
        <aside className={`teacher-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Toggle Button */}
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">👨‍🏫</span>
            {!sidebarCollapsed && (
              <div className="logo-text">
                <h2 className="sidebar-title">Teacher Dashboard</h2>
                <p className="sidebar-subtitle">Bảng điều khiển giáo viên</p>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* TỔNG QUAN */}
          <div className="nav-section">
            <div className="nav-section-title">Tổng quan</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/overview" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/overview') ? 'active' : ''}`}
                >
                  <span className="link-icon">📊</span>
                  <span className="link-text">Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* QUẢN LÝ DẠY HỌC */}
          <div className="nav-section">
            <div className="nav-section-title">Quản lý dạy học</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/classes" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/classes') ? 'active' : ''}`}
                >
                  <span className="link-icon">🏫</span>
                  <span className="link-text">Quản lý lớp học</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/courses" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/courses') ? 'active' : ''}`}
                >
                  <span className="link-icon">📚</span>
                  <span className="link-text">Khoá học công khai</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/materials" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/materials') ? 'active' : ''}`}
                >
                  <span className="link-icon">📚</span>
                  <span className="link-text">Học liệu</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/question-bank" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/question-bank') ? 'active' : ''}`}
                >
                  <span className="link-icon">💭</span>
                  <span className="link-text">Ngân hàng câu hỏi</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/news" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/news') ? 'active' : ''}`}
                >
                  <span className="link-icon">📰</span>
                  <span className="link-text">Tin tức & Bài viết</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* BÀI TẬP & ĐÁNH GIÁ */}
          <div className="nav-section">
            <div className="nav-section-title">Bài tập & Đánh giá</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/assignments" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/assignments') ? 'active' : ''}`}
                >
                  <span className="link-icon">📝</span>
                  <span className="link-text">Bài tập & Kiểm tra</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/grading" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/grading') ? 'active' : ''}`}
                >
                  <span className="link-icon">✅</span>
                  <span className="link-text">Chấm điểm & Phản hồi</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* BÁO CÁO & CÔNG CỤ */}
          <div className="nav-section">
            <div className="nav-section-title">Báo cáo & Công cụ</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/statistics" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/statistics') ? 'active' : ''}`}
                >
                  <span className="link-icon">📈</span>
                  <span className="link-text">Thống kê & Báo cáo</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/teacher-dashboard/online-teaching" 
                  className={`sidebar-link ${isActive('/teacher-dashboard/online-teaching') ? 'active' : ''}`}
                >
                  <span className="link-icon">💻</span>
                  <span className="link-text">Dạy học trực tuyến</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* TIỆN ÍCH */}
          <div className="nav-section">
            <div className="nav-section-title">Tiện ích</div>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link to="/teacher-dashboard/calendar" className="sidebar-link">
                  <span className="link-icon">📅</span>
                  <span className="link-text">Lịch giảng dạy</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link to="/teacher-dashboard/messages" className="sidebar-link">
                  <span className="link-icon">💬</span>
                  <span className="link-text">Tin nhắn</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link to="/teacher-dashboard/settings" className="sidebar-link">
                  <span className="link-icon">⚙️</span>
                  <span className="link-text">Cài đặt</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="teacher-main-content">
        <div className="dashboard-content">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="/overview" element={<TeacherOverview />} />
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/courses" element={<CoursesManage />} />
            <Route path="/materials" element={<MaterialsManagement />} />
            <Route path="/news" element={<ManageNews />} />
            <Route path="/question-bank" element={<QuestionBank />} />
            <Route path="/assignments" element={<AssignmentsTests />} />
            <Route path="/grading" element={<GradingFeedback />} />
            <Route path="/statistics" element={<StatisticsReports />} />
            <Route path="/online-teaching" element={<OnlineTeaching />} />
            <Route path="/calendar" element={<ComingSoon title="Lịch giảng dạy" />} />
            <Route path="/messages" element={<ComingSoon title="Tin nhắn" />} />
            <Route path="/settings" element={<ComingSoon title="Cài đặt" />} />
          </Routes>
        </div>
      </main>
      </div>
    </div>
  );
};

// Component Coming Soon placeholder
const ComingSoon = ({ title }) => (
  <div className="coming-soon-wrapper">
    <div className="coming-soon-icon">🚧</div>
    <h2 className="coming-soon-title">{title}</h2>
    <p className="coming-soon-text">Tính năng đang được phát triển</p>
  </div>
);

export default TeacherDashboardNew;

