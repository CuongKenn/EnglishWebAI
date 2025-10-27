import { 
  Home, 
  GraduationCap, 
  BookOpen, 
  Brain, 
  FileCheck, 
  Target, 
  FileText,
  TrendingUp,
  Video,
  Calendar, 
  MessageSquare
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentPage, onNavigate }) => {
  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home }
      ]
    },
    {
      title: 'QUẢN LÝ DẠY HỌC',
      items: [
        { id: 'classes', label: 'Quản lý lớp học', icon: GraduationCap },
        { id: 'courses', label: 'Khóa học', icon: BookOpen },
        { id: 'question-bank', label: 'Ngân hàng câu hỏi', icon: Brain },
        { id: 'news', label: 'Tin tức & Bài viết', icon: FileText }
      ]
    },
    {
      title: 'BÀI TẬP & ĐÁNH GIÁ',
      items: [
        { id: 'exercises', label: 'Bài tập & Kiểm tra', icon: FileCheck },
        { id: 'grading', label: 'Chấm điểm & Phản hồi', icon: Target }
      ]
    },
    {
      title: 'BÁO CÁO & CÔNG CỤ',
      items: [
        { id: 'statistics', label: 'Thống kê & Báo cáo', icon: TrendingUp },
        { id: 'online-teaching', label: 'Dạy học trực tuyến', icon: Video }
      ]
    },
    {
      title: 'TIỆN ÍCH',
      items: [
        { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar },
        { id: 'messages', label: 'Tin nhắn', icon: MessageSquare }
      ]
    }
  ];

  return (
    <div className="teacher-sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Giáo viên - Tiếng Anh AI</h1>
      </div>
      
      <div className="sidebar-menu">
        {menuSections.map((section, idx) => (
          <div key={idx} className="menu-section">
            <h3 className="section-title">{section.title}</h3>
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
                    <Icon className="menu-icon" size={18} />
                    <span className="menu-label">{item.label}</span>
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

