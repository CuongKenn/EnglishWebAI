import { BarChart3, BookOpen, Calendar, FileText, GraduationCap, Home, MessageSquare, Notebook, PenTool, Settings as SettingsIcon, TrendingUp, Video, MessageCircle, Brain, Sparkles, Wand2, Upload, Users, ClipboardList, FileBarChart } from 'lucide-react';

const Sidebar = ({ currentPage, onNavigate }) => {
  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'bg-purple-500' }
      ]
    },
    {
      title: 'QUẢN LÝ DẠY HỌC',
      items: [
        { id: 'class-management', label: 'Quản lý lớp học', icon: GraduationCap },
        { id: 'courses', label: 'Khóa học', icon: BookOpen },
        { id: 'question-bank', label: 'Ngân hàng câu hỏi', icon: Brain },
        { id: 'news-articles', label: 'Tin tức & Bài viết', icon: FileText }
      ]
    },
    {
      title: 'BÀI TẬP & ĐÁNH GIÁ',
      items: [
        { id: 'exercises-tests', label: 'Bài tập & Kiểm tra', icon: Notebook },
        { id: 'grading-feedback', label: 'Chấm điểm & Phản hồi', icon: PenTool },
        { id: 'weekly-assessments', label: 'Phiếu đánh giá tuần', icon: ClipboardList },
        { id: 'error-analysis', label: 'Xuất phân tích lỗi', icon: FileBarChart }
      ]
    },
    {
      title: 'TRỢ LÝ AI',
      items: [
        { id: 'lesson-plans', label: 'Tạo giáo án', icon: Wand2 },
        { id: 'worksheets', label: 'Tạo phiếu học tập', icon: Sparkles },
        { id: 'student-analytics', label: 'Phân tích tiến độ', icon: TrendingUp },
        { id: 'support-groups', label: 'Nhóm cần hỗ trợ', icon: Users }
      ]
    },
    {
      title: 'BÁO CÁO & CÔNG CỤ',
      items: [
        { id: 'statistics', label: 'Thống kê & Báo cáo', icon: BarChart3 },
        { id: 'export-reports', label: 'Xuất báo cáo', icon: Upload },
        { id: 'online-teaching', label: 'Dạy học trực tuyến', icon: Video }
      ]
    },
    {
      title: 'TIỆN ÍCH',
      items: [
        { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar },
        { id: 'messages', label: 'Tin nhắn', icon: MessageCircle },
        { id: 'settings', label: 'Cài đặt', icon: SettingsIcon }
      ]
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Beautiful Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-600">Giáo viên</h1>
            <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Tiếng Anh AI
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="text-xs text-gray-400 mb-3 px-3 font-semibold">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                const bgColor = item.color || (isActive ? 'bg-purple-500' : 'bg-gray-100');
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? `${bgColor} text-white`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{item.label}</span>
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

