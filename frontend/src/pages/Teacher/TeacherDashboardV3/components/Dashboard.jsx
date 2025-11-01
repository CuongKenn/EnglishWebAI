import { Card } from '../../../../components/ui/card';
import { Users, FileCheck, Brain, TrendingUp, Clock, CheckCircle, Sun, Moon, Coffee, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiV1 } from '../../../../services/api';

const Dashboard = () => {
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState(Sun);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

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

    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiV1.get('/teacher/dashboard/overview');
      console.log('Dashboard data received:', response.data);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set empty data structure to show empty state
      setDashboardData({
        stats: {
          total_classes: 0,
          total_students: 0,
          total_tests: 0,
          total_questions: 0
        },
        recent_activities: [],
        upcoming_tests: []
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = dashboardData ? [
    { label: 'Tổng số lớp', value: dashboardData.stats.total_classes.toString(), icon: Users, color: 'bg-blue-500' },
    { label: 'Học sinh', value: dashboardData.stats.total_students.toString(), icon: Users, color: 'bg-green-500' },
    { label: 'Bài kiểm tra', value: dashboardData.stats.total_tests.toString(), icon: FileCheck, color: 'bg-purple-500' },
    { label: 'Câu hỏi', value: dashboardData.stats.total_questions.toLocaleString('vi-VN'), icon: Brain, color: 'bg-orange-500' }
  ] : [];

  const recentActivities = dashboardData?.recent_activities || [];
  const upcomingTests = dashboardData?.upcoming_tests?.map(test => ({
    class: test.class_name,
    title: test.title,
    date: test.date,
    students: test.students
  })) || [];

  const GreetingIcon = greetingIcon;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

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
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, idx) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có hoạt động nào gần đây</p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Tests */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Bài kiểm tra sắp tới</h2>
          </div>
          <div className="space-y-4">
            {upcomingTests.length > 0 ? (
              upcomingTests.map((test, idx) => (
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
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Chưa có bài kiểm tra sắp tới</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

