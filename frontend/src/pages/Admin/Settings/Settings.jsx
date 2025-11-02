import React, { useState, useEffect } from 'react';
import './Settings.css';
import { adminAPI } from '../../../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Smart Learn',
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getSystemSettings();
      
      // Map backend settings to frontend format
      setSettings({
        siteName: data.site_name || 'Smart Learn',
        siteEmail: data.email_from || 'admin@englishai.com',
        maintenanceMode: data.maintenance_mode || false,
        allowRegistration: data.registration_enabled ?? true,
        requireEmailVerification: data.email_verification_required || false,
        maxStudentsPerClass: data.max_students_per_class || 40,
        sessionTimeout: 30, // TODO: Add to backend
        enableNotifications: data.notification_enabled ?? true,
        enableFileUpload: true, // TODO: Add to backend
        maxFileSize: data.max_file_size_mb || 10,
        allowedFileTypes: data.allowed_file_types || 'pdf,doc,docx,txt,jpg,png',
      });
    } catch (e) {
      console.error('Failed to load settings:', e);
      setError('Không thể tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Map frontend settings to backend format
      const backendSettings = {
        site_name: settings.siteName,
        email_from: settings.siteEmail,
        maintenance_mode: settings.maintenanceMode,
        registration_enabled: settings.allowRegistration,
        email_verification_required: settings.requireEmailVerification,
        max_students_per_class: parseInt(settings.maxStudentsPerClass),
        notification_enabled: settings.enableNotifications,
        max_file_size_mb: parseInt(settings.maxFileSize),
        allowed_file_types: settings.allowedFileTypes,
      };
      
      await adminAPI.updateSystemSettings(backendSettings);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      setError('Không thể lưu cấu hình. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
      try {
        setLoading(true);
        setError('');
        
        // Initialize default settings on backend
        await adminAPI.initializeDefaultSettings();
        
        // Reload settings
        await loadSettings();
        
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        console.error('Failed to reset settings:', e);
        setError('Không thể khôi phục cài đặt mặc định');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !settings.siteName) {
    return (
      <div className="settings-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải cấu hình...</p>
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="error-notification">
          ❌ {error}
        </div>
      )}

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
          <button type="button" onClick={handleReset} className="btn-secondary" disabled={loading}>
            🔄 Khôi phục mặc định
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

