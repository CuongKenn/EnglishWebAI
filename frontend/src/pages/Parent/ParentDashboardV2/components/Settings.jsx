import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Lock, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    grades: true,
    activities: true,
  });

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const settingsSections = [
    {
      title: 'Tài khoản',
      items: [
        {
          icon: User,
          label: 'Thông tin cá nhân',
          description: 'Cập nhật thông tin tài khoản',
          action: () => {}
        },
        {
          icon: Lock,
          label: 'Bảo mật',
          description: 'Mật khẩu và xác thực',
          action: () => {}
        }
      ]
    },
    {
      title: 'Trợ giúp',
      items: [
        {
          icon: HelpCircle,
          label: 'Trung tâm trợ giúp',
          description: 'Hướng dẫn và câu hỏi thường gặp',
          action: () => {}
        }
      ]
    }
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">
          <SettingsIcon className="settings-title-icon" />
          Cài đặt
        </h1>
        <p className="settings-subtitle">Quản lý tài khoản và tùy chọn của bạn</p>
      </div>

      <div className="settings-content">
        {/* Notifications Settings */}
        <div className="settings-card">
          <div className="card-header-settings">
            <Bell className="card-icon" />
            <h2 className="card-title">Thông báo</h2>
          </div>
          <div className="settings-list">
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-label">Thông báo qua Email</p>
                <p className="setting-description">Nhận thông báo qua email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-label">Thông báo Push</p>
                <p className="setting-description">Nhận thông báo trên trình duyệt</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={() => handleNotificationChange('push')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-label">Thông báo điểm số</p>
                <p className="setting-description">Nhận thông báo khi có điểm mới</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.grades}
                  onChange={() => handleNotificationChange('grades')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="setting-item">
              <div className="setting-info">
                <p className="setting-label">Hoạt động học tập</p>
                <p className="setting-description">Nhận thông báo về hoạt động của con</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.activities}
                  onChange={() => handleNotificationChange('activities')}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Other Settings */}
        {settingsSections.map((section, index) => (
          <div key={index} className="settings-card">
            <div className="card-header-settings">
              <h2 className="card-title">{section.title}</h2>
            </div>
            <div className="settings-list">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="setting-item clickable"
                    onClick={item.action}
                  >
                    <Icon className="setting-icon" />
                    <div className="setting-info">
                      <p className="setting-label">{item.label}</p>
                      <p className="setting-description">{item.description}</p>
                    </div>
                    <ChevronRight className="chevron-icon" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <div className="settings-card">
          <button className="logout-btn">
            <LogOut className="logout-icon" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

