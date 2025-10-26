import { Card } from '../../../../components/ui/card';
import { MessageSquare } from 'lucide-react';
import './SharedComponents.css';

const MessagesPage = () => {
  return (
    <div className="component-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tin nhắn</h1>
          <p className="page-subtitle">Trao đổi với học sinh và phụ huynh</p>
        </div>
      </div>

      <Card className="placeholder-card">
        <MessageSquare size={48} color="#cbd5e1" />
        <h3>Hệ thống tin nhắn</h3>
        <p>Chức năng tin nhắn sẽ được tích hợp ở đây</p>
        <p className="placeholder-hint">
          Có thể kết nối với hệ thống tin nhắn hiện có hoặc xây dựng mới với WebSocket
        </p>
      </Card>
    </div>
  );
};

export default MessagesPage;

