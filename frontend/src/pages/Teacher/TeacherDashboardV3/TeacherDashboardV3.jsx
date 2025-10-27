import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClassManagement from './components/ClassManagement';
import Courses from './components/Courses';
import QuestionBank from './components/QuestionBank';
import ExercisesTests from './components/ExercisesTests';
import GradingFeedback from './components/GradingFeedback';
import Statistics from './components/Statistics';
import Materials from './components/Materials';
import Messages from './components/Messages';
import Settings from './components/Settings';
import NewsArticles from './components/NewsArticles';
import OnlineTeaching from './components/OnlineTeaching';
import Schedule from './components/Schedule';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import './TeacherDashboardV3.css';
import './components/common.css';
import './components/enhanced-ui.css';

const TeacherDashboardV3 = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'class-management':
        return <ClassManagement />;
      case 'courses':
        return <Courses />;
      case 'question-bank':
        return <QuestionBank />;
      case 'news-articles':
        return <NewsArticles />;
      case 'exercises-tests':
        return <ExercisesTests />;
      case 'grading-feedback':
        return <GradingFeedback />;
      case 'statistics':
        return <Statistics />;
      case 'materials':
        return <Materials />;
      case 'online-teaching':
        return <OnlineTeaching />;
      case 'schedule':
        return <Schedule />;
      case 'messages':
        return <Messages />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Navbar userRole="teacher" isLoggedIn={true} onLogout={handleLogout} />
      <div className="teacher-dashboard-v3">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="dashboard-main">
          {renderPage()}
        </div>
      </div>
    </>
  );
};

export default TeacherDashboardV3;

