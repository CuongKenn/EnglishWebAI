import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrackProgress from './components/TrackProgress';
import Notifications from './components/Notifications';
import TeacherCommunication from './components/TeacherCommunication';
import Settings from './components/Settings';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import './ParentDashboardV2.css';

const ParentDashboardV2 = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
      navigate('/');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'track-progress':
        return <TrackProgress />;
      case 'notifications':
        return <Notifications />;
      case 'teacher-communication':
        return <TeacherCommunication />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
      <div className="parent-dashboard-v2">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <div className="dashboard-main">
          {renderPage()}
        </div>
      </div>
    </>
  );
};

export default ParentDashboardV2;

