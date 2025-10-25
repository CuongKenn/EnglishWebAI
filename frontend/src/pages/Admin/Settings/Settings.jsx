import React, { useState } from 'react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'English AI',
    siteEmail: 'admin@englishai.com',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
    maxStudentsPerClass: 40,
    sessionTimeout: 30,
    enableNotifications: true,
    enableFileUpload: true,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,txt,jpg,png',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Save to backend
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
      // Reset to defaults
      setSettings({
        siteName: 'English AI',
        siteEmail: 'admin@englishai.com',
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true,
        maxStudentsPerClass: 40,
        sessionTimeout: 30,
        enableNotifications: true,
        enableFileUpload: true,
        maxFileSize: 10,
        allowedFileTypes: 'pdf,doc,docx,txt,jpg,png',
      });
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1 className="page-title">⚙️ Cấu hình hệ thống</h1>
          <p className="page-subtitle">Quản lý các thiết lập tổng quan của hệ thống</p>
        </div>
        {saved && (
          <div className="save-notification">
            ✓ Đã lưu thay đổi
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        {/* General Settings */}
        <div className="settings-section">
          <h2 className="section-title">🌐 Cài đặt chung</h2>
          <div className="settings-grid">
            <div className="form-group">
              <label>Tên website</label>
              <input
                type="text"
                name="siteName"
                value={settings.siteName}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email hệ thống</label>
              <input
                type="email"
                name="siteEmail"
                value={settings.siteEmail}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Access Settings */}
        <div className="settings-section">
          <h2 className="section-title">🔐 Cài đặt truy cập</h2>
          <div className="settings-grid">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                />
                <span>Chế độ bảo trì</span>
              </label>
              <small>Tắt tất cả truy cập người dùng để bảo trì hệ thống</small>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="allowRegistration"
                  checked={settings.allowRegistration}
                  onChange={handleChange}
                />
                <span>Cho phép đăng ký mới</span>
              </label>
              <small>Người dùng có thể tự tạo tài khoản</small>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={handleChange}
                />
                <span>Yêu cầu xác thực email</span>
              </label>
              <small>Người dùng phải xác thực email trước khi sử dụng</small>
            </div>
          </div>
        </div>

        {/* Class Settings */}
        <div className="settings-section">
          <h2 className="section-title">📚 Cài đặt lớp học</h2>
          <div className="settings-grid">
            <div className="form-group">
              <label>Số học sinh tối đa mỗi lớp</label>
              <input
                type="number"
                name="maxStudentsPerClass"
                value={settings.maxStudentsPerClass}
                onChange={handleChange}
                className="form-input"
                min="1"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Thời gian hết phiên (phút)</label>
              <input
                type="number"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleChange}
                className="form-input"
                min="5"
                max="120"
              />
            </div>
          </div>
        </div>

        {/* Feature Settings */}
        <div className="settings-section">
          <h2 className="section-title">🎯 Tính năng</h2>
          <div className="settings-grid">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="enableNotifications"
                  checked={settings.enableNotifications}
                  onChange={handleChange}
                />
                <span>Bật thông báo</span>
              </label>
              <small>Gửi thông báo đến người dùng</small>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="enableFileUpload"
                  checked={settings.enableFileUpload}
                  onChange={handleChange}
                />
                <span>Cho phép tải file</span>
              </label>
              <small>Người dùng có thể tải lên tài liệu</small>
            </div>
          </div>
        </div>

        {/* File Upload Settings */}
        {settings.enableFileUpload && (
          <div className="settings-section">
            <h2 className="section-title">📁 Cài đặt tải file</h2>
            <div className="settings-grid">
              <div className="form-group">
                <label>Dung lượng tối đa (MB)</label>
                <input
                  type="number"
                  name="maxFileSize"
                  value={settings.maxFileSize}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  max="100"
                />
              </div>
              <div className="form-group">
                <label>Loại file cho phép (phân cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  name="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="pdf,doc,docx,txt,jpg,png"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="settings-actions">
          <button type="button" onClick={handleReset} className="btn-secondary">
            🔄 Khôi phục mặc định
          </button>
          <button type="submit" className="btn-primary">
            💾 Lưu cài đặt
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

