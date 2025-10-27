import { Users, BookOpen, FileText, BarChart3, Brain, Settings as SettingsIcon, Database, FileCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ currentPage, onNavigate }) => {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { id: 'overview-stats', label: 'Thống kê tổng quan', icon: BarChart3, route: '/admin-dashboard/overview-stats' }
      ]
    },
    {
      title: 'QUẢN LÝ TÀI KHOẢN',
      items: [
        { id: 'manage-accounts', label: 'Tài khoản người dùng', icon: Users, route: '/admin-dashboard/manage-accounts' }
      ]
    },
    {
      title: 'QUẢN LÝ LỚP HỌC',
      items: [
        { id: 'manage-classes', label: 'Lớp học & Phân công', icon: BookOpen, route: '/admin-dashboard/manage-classes' }
      ]
    },
    {
      title: 'QUẢN LÝ NỘI DUNG',
      items: [
        { id: 'manage-news', label: 'Tin tức & Thông báo', icon: FileText, route: '/admin-dashboard/manage-news' }
      ]
    },
    {
      title: 'QUẢN LÝ AI',
      items: [
        { id: 'ai-analytics', label: 'AI Analytics', icon: Brain, route: '/admin-dashboard/ai-analytics' },
        { id: 'ai-settings', label: 'AI Settings', icon: Sparkles, route: '/admin-dashboard/ai-settings' }
      ]
    },
    {
      title: 'CÀI ĐẶT HỆ THỐNG',
      items: [
        { id: 'settings', label: 'Cấu hình hệ thống', icon: SettingsIcon, route: '/admin-dashboard/settings' },
        { id: 'backup', label: 'Sao lưu dữ liệu', icon: Database, route: '/admin-dashboard/backup' },
        { id: 'logs', label: 'Nhật ký hệ thống', icon: FileCheck, route: '/admin-dashboard/logs' }
      ]
    }
  ];

  const handleNavigation = (id, route) => {
    onNavigate(id);
    navigate(route);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Beautiful Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-600">Quản trị viên</h1>
            <p className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
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
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id, item.route)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>{item.label}</span>
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

