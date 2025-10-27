import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, BookOpen, GraduationCap, User, Calendar
} from 'lucide-react';
import './ConsistentSidebarLayout.css';

const ConsistentSidebarLayout = ({ 
  children, 
  activeMenuItem = 'study-plan',
  onMenuItemClick,
  showBackButton = true,
  courseTitle = "Học bài"
}) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Tổng quan', icon: Home, path: '/lessons' },
    { id: 'study-plan', label: 'Kế hoạch học tập', icon: Calendar, path: '/study-plan' },
    { id: 'my-courses', label: 'Khóa học của tôi', icon: BookOpen, path: '/my-courses' },
    { id: 'profile', label: 'Hồ sơ học tập', icon: User, path: '/learning-profile' }
  ];

  const handleMenuItemClick = (itemId, e) => {
    e.preventDefault();
    if (onMenuItemClick) {
      onMenuItemClick(itemId);
    }
    // Navigate to the path
    const menuItem = menuItems.find(item => item.id === itemId);
    if (menuItem && menuItem.path) {
      navigate(menuItem.path);
    }
  };

  return (
    <div className="consistent-sidebar-layout">
      {/* Sidebar Trái - Cố định vị trí */}
      <aside className="consistent-sidebar-left">
        <div className="sidebar-menu">
          <div className="program-selector">
            <div className="program-badge">
              <GraduationCap size={20} />
              <span>{courseTitle}</span>
            </div>
          </div>
          
          <nav className="menu-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
                onClick={(e) => handleMenuItemClick(item.id, e)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="back-to-home-btn" onClick={() => navigate('/')}>
              ← Trở về trang chủ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - Luôn có vị trí cố định */}
      <main className="consistent-main-content">
        {children}
      </main>
    </div>
  );
};

export default ConsistentSidebarLayout;
