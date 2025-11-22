import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './AdminDashboardV2.css';
import './common-admin-styles.css';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import { useNavigate } from 'react-router-dom';

// Import Sidebar
import Sidebar from './components/Sidebar';

// Import admin pages
import OverviewStats from '../OverviewStats/OverviewStats';
import ManageAccounts from '../ManageAccounts/ManageAccounts';
import ManageClasses from '../ManageClasses/ManageClasses';
import ManageNews from '../ManageNews/ManageNews';
import AIAnalytics from '../AIAnalytics/AIAnalytics';
import AISettings from '../AISettings/AISettings';
import Settings from '../Settings/Settings';
import Backup from '../Backup/Backup';
import Logs from '../Logs/Logs';

const AdminDashboardV2 = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('overview-stats');
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      authService.logout();
      navigate('/');
    }
  };

  return (
    <>
      <Navbar userRole="admin" isLoggedIn={true} onLogout={handleLogout} />
      
      <div className="admin-dashboard-v2">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        
        <main className="admin-main">
          <Routes>
            <Route index element={<Navigate to="overview-stats" replace />} />
            <Route path="/" element={<Navigate to="overview-stats" replace />} />
            <Route path="/overview-stats" element={<OverviewStats />} />
            <Route path="/manage-accounts" element={<ManageAccounts />} />
            <Route path="/manage-classes" element={<ManageClasses />} />
            <Route path="/manage-news" element={<ManageNews />} />
            <Route path="/ai-analytics" element={<AIAnalytics />} />
            <Route path="/ai-settings" element={<AISettings />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/logs" element={<Logs />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default AdminDashboardV2;

