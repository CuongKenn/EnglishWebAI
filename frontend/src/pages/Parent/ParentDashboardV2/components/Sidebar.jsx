import { Home, TrendingUp, Bell, MessageCircle, Settings as SettingsIcon, Users } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentPage, onNavigate }) => {
  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Thông tin chung', icon: Home }
      ]
    },
    {
      title: 'CÀI ĐẶT',
      items: [
        { id: 'settings', label: 'Cài đặt', icon: SettingsIcon }
      ]
    }
  ];

  return (
    <div className="parent-sidebar">
      {/* Beautiful Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-content">
          <div className="sidebar-icon-wrapper">
            <Users className="sidebar-icon" />
          </div>
          <div>
            <h1 className="sidebar-subtitle">Phụ huynh</h1>
            <p className="sidebar-title">
              Tiếng Anh AI
            </p>
          </div>
        </div>
      </div>
      
      <div className="sidebar-menu">
        {menuSections.map((section, idx) => (
          <div key={idx} className="menu-section">
            <h3 className="menu-section-title">{section.title}</h3>
            <div className="menu-items">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`menu-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon className="menu-item-icon" />
                    <span className="menu-item-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

