import { Card } from '../../../../components/ui/card';
import { Settings } from 'lucide-react';
import './SharedComponents.css';

const SettingsPage = () => {
  return (
    <div className="component-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cài đặt</h1>
          <p className="page-subtitle">Quản lý tài khoản và tùy chỉnh hệ thống</p>
        </div>
      </div>

      <Card className="placeholder-card">
        <Settings size={48} color="#cbd5e1" />
        <h3>Cài đặt tài khoản</h3>
        <p>Chức năng cài đặt sẽ được tích hợp ở đây</p>
        <p className="placeholder-hint">
          Bao gồm: Thông tin cá nhân, Đổi mật khẩu, Thông báo, Tùy chọn giao diện
        </p>
      </Card>
    </div>
  );
};

export default SettingsPage;

