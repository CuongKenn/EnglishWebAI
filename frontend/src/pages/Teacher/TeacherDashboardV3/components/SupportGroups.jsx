import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { UserGroupIcon, ExclamationCircleIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { apiV1 } from '../../../../services/api';

const SupportGroups = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [supportData, setSupportData] = useState(null);
  // Threshold in 0..10 scale for UI
  const [threshold, setThreshold] = useState(5);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchSupportData(selectedClass.id);
    }
  }, [selectedClass, threshold]);

  const fetchTeacherClasses = async () => {
    try {
      const response = await apiV1.get('/classes/teaching');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchSupportData = async (classId) => {
    try {
      // Backend expects percentage (0..100). Convert from 0..10 UI scale.
      const response = await apiV1.get(`/teacher/classes/${classId}/analytics/students-need-support`, {
        params: { threshold: threshold * 10 }
      });
      setSupportData(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserGroupIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Nhóm học sinh cần hỗ trợ</h1>
        </div>
        <p className="text-gray-600">Xác định và hỗ trợ các học sinh cần quan tâm đặc biệt</p>
      </div>

      {/* Class Selection & Threshold */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lớp</label>
          <div className="flex gap-2 overflow-x-auto">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedClass?.id === cls.id
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngưỡng điểm (học sinh dưới {threshold} điểm)
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{threshold}</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {supportData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng học sinh</p>
                <p className="text-2xl font-bold text-gray-900">{supportData.total_students}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cần hỗ trợ</p>
                <p className="text-2xl font-bold text-orange-500">{supportData.students_need_support}</p>
              </div>
              <ExclamationCircleIcon className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ</p>
                <p className="text-2xl font-bold text-purple-600">
                  {((supportData.students_need_support / supportData.total_students) * 100).toFixed(1)}%
                </p>
              </div>
              <ArrowTrendingDownIcon className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Students List */}
      <div className="space-y-4">
        {!supportData || supportData.students.length === 0 ? (
          <Card className="p-12 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có học sinh nào cần hỗ trợ đặc biệt</p>
            <p className="text-sm text-gray-500 mt-2">Tất cả học sinh đang học tập tốt!</p>
          </Card>
        ) : (
          supportData.students.map((student) => (
            <Card
              key={student.student_id}
              className={`p-6 border-2 ${
                student.support_priority === 'high'
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-orange-200 bg-orange-50/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    student.support_priority === 'high' ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    <span className={`text-lg font-bold ${
                      student.support_priority === 'high' ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {student.student_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.student_name}</h3>
                    <Badge className={
                      student.support_priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }>
                      Ưu tiên {student.support_priority === 'high' ? 'cao' : 'trung bình'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Điểm TB</p>
                  <p className={`text-3xl font-bold ${
                    student.average_score < 40 ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {student.average_score.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Điểm theo kỹ năng:</p>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(student.skill_scores).map(([skill, score]) => (
                    <div
                      key={skill}
                      className={`p-2 rounded text-center ${
                        score > 0 && score < (threshold * 10)
                          ? 'bg-red-100 border border-red-200'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p className="text-xs text-gray-600 capitalize">{skill}</p>
                      <p className={`text-sm font-semibold ${
                        score > 0 && score < (threshold * 10) ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {score.toFixed(1)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Kỹ năng cần hỗ trợ:</p>
                <div className="flex flex-wrap gap-2">
                  {student.weak_skills && student.weak_skills.length > 0 ? (
                    student.weak_skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="border-red-300 text-red-700">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Không có kỹ năng yếu cụ thể</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">Xem chi tiết</Button>
                <Button size="sm" variant="outline">Lên kế hoạch hỗ trợ</Button>
                <Button size="sm" variant="outline">Liên hệ phụ huynh</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SupportGroups;

