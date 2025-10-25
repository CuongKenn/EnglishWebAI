import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentAPI } from '../../../services/parentService';
import { ArrowLeft, TrendingUp, Calendar, Award, BookOpen } from 'lucide-react';

const TrackProgressTailwind = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const data = await parentAPI.getChildren();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
        loadProgress(data[0].id);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async (childId) => {
    try {
      const data = await parentAPI.getChildProgress(childId);
      setProgress(data);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const handleChildChange = (child) => {
    setSelectedChild(child);
    loadProgress(child.id);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Theo dõi tiến độ học tập</h1>
              <p className="text-blue-100 mt-1">Xem chi tiết quá trình học tập của con</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Child Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fade-in">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn học sinh
          </label>
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => {
              const child = children.find(c => c.id === Number(e.target.value));
              handleChildChange(child);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.full_name} - {child.email}
              </option>
            ))}
          </select>
        </div>

        {progress && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Classes */}
              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform animate-slide-in">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Lớp học</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {progress.total_classes || 0}
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Tổng số lớp đã tham gia</p>
              </div>

              {/* Average Score */}
              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform animate-slide-in">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Điểm TB</p>
                    <p className="text-3xl font-bold text-green-600">
                      {progress.average_score?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Điểm trung bình các bài tập</p>
              </div>

              {/* Attendance Rate */}
              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform animate-slide-in">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Calendar className="w-8 h-8 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Điểm danh</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {progress.attendance_rate?.toFixed(0) || '0'}%
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Tỷ lệ tham gia lớp học</p>
              </div>

              {/* Completed Exercises */}
              <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform animate-slide-in">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Hoàn thành</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {progress.completed_exercises || 0}
                    </p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">Bài tập đã hoàn thành</p>
              </div>
            </div>

            {/* Classes Progress */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Chi tiết theo lớp học</h2>
              
              {progress.classes && progress.classes.length > 0 ? (
                <div className="space-y-4">
                  {progress.classes.map((classItem, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {classItem.class_name}
                          </h3>
                          <p className="text-gray-600 text-sm">{classItem.teacher_name}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full font-semibold ${getScoreColor(classItem.average_score)}`}>
                          {classItem.average_score?.toFixed(1) || '0.0'} điểm
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Completion Rate */}
                        <div>
                          <p className="text-gray-600 text-sm mb-2">Tỷ lệ hoàn thành</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${getProgressColor(classItem.completion_rate)}`}
                                style={{ width: `${classItem.completion_rate || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                              {classItem.completion_rate?.toFixed(0) || '0'}%
                            </span>
                          </div>
                        </div>

                        {/* Exercises */}
                        <div>
                          <p className="text-gray-600 text-sm mb-2">Bài tập</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {classItem.completed_exercises || 0} / {classItem.total_exercises || 0}
                          </p>
                        </div>

                        {/* Attendance */}
                        <div>
                          <p className="text-gray-600 text-sm mb-2">Điểm danh</p>
                          <p className="text-lg font-semibold text-gray-800">
                            {classItem.attendance_count || 0} buổi
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Chưa có dữ liệu lớp học</p>
                </div>
              )}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Hoạt động gần đây</h2>
              
              {progress.recent_activities && progress.recent_activities.length > 0 ? (
                <div className="space-y-4">
                  {progress.recent_activities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-3 bg-blue-100 rounded-lg">
                        {activity.type === 'exercise' && <BookOpen className="w-6 h-6 text-blue-600" />}
                        {activity.type === 'attendance' && <Calendar className="w-6 h-6 text-blue-600" />}
                        {activity.type === 'achievement' && <Award className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                        <p className="text-gray-600 text-sm">{activity.description}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(activity.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      {activity.score && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(activity.score)}`}>
                          {activity.score} điểm
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Chưa có hoạt động gần đây</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!progress && !loading && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Không có dữ liệu tiến độ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackProgressTailwind;
