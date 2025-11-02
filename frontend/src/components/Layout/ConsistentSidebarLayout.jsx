import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  BookOpenIcon, 
  AcademicCapIcon, 
  UserIcon, 
  CalendarIcon,
  LightBulbIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
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
    { 
      id: 'overview', 
      label: 'Tổng quan', 
      icon: HomeIcon, 
      path: '/lessons',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'study-plan', 
      label: 'Kế hoạch học tập', 
      icon: CalendarIcon, 
      path: '/study-plan',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'my-courses', 
      label: 'Khóa học của tôi', 
      icon: BookOpenIcon, 
      path: '/my-courses',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'profile', 
      label: 'Hồ sơ học tập', 
      icon: UserIcon, 
      path: '/learning-profile',
      gradient: 'from-orange-500 to-red-500'
    }
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
          {/* Header với gradient icon */}
          <div className="program-selector">
            <div className="program-badge">
              <div className="program-icon-wrapper">
                <AcademicCapIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="program-title">{courseTitle}</div>
                <div className="program-subtitle">Hệ thống học tập</div>
              </div>
            </div>
          </div>
          
          <nav className="menu-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`menu-item ${activeMenuItem === item.id ? 'active' : ''}`}
                onClick={(e) => handleMenuItemClick(item.id, e)}
              >
                <div className={`menu-icon-wrapper bg-gradient-to-br ${item.gradient}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="menu-content">
                  <span className="menu-label">{item.label}</span>
                </div>
                {activeMenuItem === item.id && (
                  <>
                    <div className="active-indicator" />
                    <div className={`active-overlay bg-gradient-to-br ${item.gradient}`} />
                  </>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="tip-card">
              <div className="tip-icon">
                <LightBulbIcon className="w-6 h-6 text-white" />
              </div>
              <div className="tip-content">
                <div className="tip-title">Mẹo học tập</div>
                <div className="tip-text">Học đều đặn mỗi ngày để tiến bộ nhanh hơn!</div>
              </div>
            </div>
            <button className="back-to-home-btn" onClick={() => navigate('/')}>
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Trở về trang chủ</span>
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
