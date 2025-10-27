import { Card } from '../../../../components/ui/card';
import { Users, FileCheck, Brain, TrendingUp, Clock, CheckCircle, Sun, Moon, Coffee } from 'lucide-react';
import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(Sun);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Chào buổi sáng');
      setGreetingIcon(Sun);
    } else if (hour < 18) {
      setGreeting('Chào buổi chiều');
      setGreetingIcon(Coffee);
    } else {
      setGreeting('Chào buổi tối');
      setGreetingIcon(Moon);
    }
  }, []);

  const stats = [
    { label: 'Tổng số lớp', value: '8', icon: Users, color: 'bg-blue-500' },
    { label: 'Học sinh', value: '245', icon: Users, color: 'bg-green-500' },
    { label: 'Bài kiểm tra', value: '32', icon: FileCheck, color: 'bg-purple-500' },
    { label: 'Câu hỏi', value: '1,248', icon: Brain, color: 'bg-orange-500' }
  ];

  const recentActivities = [
    { title: 'Lớp 10A1 hoàn thành bài kiểm tra giữa kỳ', time: '10 phút trước', status: 'completed' },
    { title: 'Đã thêm 15 câu hỏi mới vào ngân hàng', time: '1 giờ trước', status: 'info' },
    { title: 'Bài kiểm tra "Unit 5 - Listening" đã được tạo', time: '2 giờ trước', status: 'info' },
    { title: 'Lớp 11B2 cần chấm điểm (25 bài)', time: '3 giờ trước', status: 'pending' }
  ];

  const upcomingTests = [
    { class: '10A1', title: 'Kiểm tra 15 phút - Unit 6', date: '28/10/2025', students: 32 },
    { class: '11B2', title: 'Kiểm tra giữa kỳ HK1', date: '30/10/2025', students: 28 },
    { class: '10A3', title: 'Bài tập về nhà - Reading', date: '01/11/2025', students: 30 }
  ];

  const GreetingIcon = greetingIcon;

  return (
    <div className="p-8">
      {/* Beautiful Greeting Section */}
      <div className="mb-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GreetingIcon className="w-8 h-8 animate-pulse" />
              <h1 className="text-4xl font-bold">{greeting}, Thầy/Cô!</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Tổng quan hoạt động giảng dạy của bạn hôm nay
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-purple-200">Hôm nay</p>
              <p className="text-2xl font-bold">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'completed' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-gray-900 text-sm">{activity.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Tests */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Bài kiểm tra sắp tới</h2>
          </div>
          <div className="space-y-4">
            {upcomingTests.map((test, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs mb-2">
                      {test.class}
                    </span>
                    <p className="text-gray-900 text-sm font-medium">{test.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{test.date}</span>
                  <span>{test.students} học sinh</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

