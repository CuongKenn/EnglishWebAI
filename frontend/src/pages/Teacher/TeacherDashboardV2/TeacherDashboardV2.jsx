import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';
import ClassManagement from './components/ClassManagement';
import Courses from './components/Courses';
import QuestionBank from './components/QuestionBank';
import ExercisesTests from './components/ExercisesTests';
import GradingFeedback from './components/GradingFeedback';
import StatisticsReports from './components/StatisticsReports';
import MessagesPage from './components/MessagesPage';
import './TeacherDashboardV2.css';

const TeacherDashboardV2 = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'classes':
        return <ClassManagement />;
      case 'courses':
        return <Courses />;
      case 'question-bank':
        return <QuestionBank />;
      case 'news':
        return <div className="placeholder-page">
          <h2>Tin tức & Bài viết</h2>
          <p>Coming soon...</p>
        </div>;
      case 'exercises':
        return <ExercisesTests />;
      case 'grading':
        return <GradingFeedback />;
      case 'statistics':
        return <StatisticsReports />;
      case 'online-teaching':
        return <div className="placeholder-page">
          <h2>Dạy học trực tuyến</h2>
          <p>Coming soon...</p>
        </div>;
      case 'schedule':
        return <div className="placeholder-page">
          <h2>Lịch giảng dạy</h2>
          <p>Coming soon...</p>
        </div>;
      case 'messages':
        return <MessagesPage />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="teacher-dashboard-v2">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="dashboard-main">
        {renderPage()}
      </div>
    </div>
  );
};

export default TeacherDashboardV2;

