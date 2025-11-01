import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { apiV1 } from '../../../../services/api';

const StudentAnalytics = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchAnalytics(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchTeacherClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (classId) => {
    try {
      const response = await apiV1.get(`/teacher/classes/${classId}/analytics/students`);
      console.log('[StudentAnalytics] API Response:', response.data);
      // API returns paginated response with 'students' field
      const studentsData = response.data.students || response.data;
      setAnalytics(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="text-green-500" size={20} />;
    if (trend === 'declining') return <TrendingDown className="text-red-500" size={20} />;
    return <Minus className="text-gray-400" size={20} />;
  };

  const getTrendBadge = (trend) => {
    if (trend === 'improving') return <Badge className="bg-green-100 text-green-700">Tiến bộ</Badge>;
    if (trend === 'declining') return <Badge className="bg-red-100 text-red-700">Cần cải thiện</Badge>;
    return <Badge variant="outline">Ổn định</Badge>;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Phân tích tiến độ học sinh</h1>
        </div>
        <p className="text-gray-600">Theo dõi tiến độ và phân tích kết quả học tập của từng học sinh</p>
      </div>

      {/* Class Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lớp</label>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedClass?.id === cls.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="space-y-4">
        {analytics.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có dữ liệu phân tích</p>
          </Card>
        ) : (
          analytics.map((student) => (
            <Card key={student.student_id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-600">
                      {student.student_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.student_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getTrendBadge(student.recent_trend)}
                      {getTrendIcon(student.recent_trend)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm text-gray-600">Điểm trung bình</p>
                  {/* Donut chart via conic-gradient */}
                  <div className="relative w-16 h-16">
                    <div
                      className="w-16 h-16 rounded-full"
                      style={{
                        background: `conic-gradient(#7c3aed ${Math.min(100, student.average_score)}%, #e5e7eb 0)`
                      }}
                    />
                    <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">{student.average_score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Tổng bài nộp</p>
                  <p className="text-xl font-semibold text-gray-900">{student.total_submissions}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Đã được chấm</p>
                  <p className="text-xl font-semibold text-gray-900">{student.graded_submissions}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Điểm theo kỹ năng</p>
                {(() => {
                  console.log('[StudentAnalytics] Student skill_scores:', student.student_name, student.skill_scores);
                  return Object.keys(student.skill_scores || {}).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(student.skill_scores).map(([skill, score]) => (
                        <div key={skill} className="flex items-center gap-3">
                          <div className="w-20 text-xs text-gray-600 capitalize">{skill}</div>
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div className="h-2 rounded bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${Math.min(100, score)}%` }} />
                          </div>
                          <div className="w-10 text-right text-xs font-semibold text-purple-600">{score.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Chưa có dữ liệu kỹ năng</p>
                  );
                })()}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;

