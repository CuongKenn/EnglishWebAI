import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileBarChart, BarChart3 } from 'lucide-react';
import { StudentProgressDashboard } from '../../../../components/StudentProgress';
import studentProgressService from '../../../../services/studentProgressService';
import { apiV1 } from '../../../../services/api';
import './StudentProgressView.css';

/**
 * Student Progress View for Teachers
 * Allows teachers to view detailed progress of their students
 */
const StudentProgressView = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents(selectedClass.id);
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
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      const response = await apiV1.get(`/classes/${classId}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!selectedStudent || !selectedClass) return;

    try {
      setCreatingSnapshot(true);
      await studentProgressService.createSnapshot(
        selectedStudent.id,
        selectedClass.id,
        'week',
        `Tuần ${new Date().getWeek()}`
      );
      alert('Đã tạo snapshot thành công!');
      // Reload the dashboard
      window.location.reload();
    } catch (error) {
      console.error('Error creating snapshot:', error);
      alert('Không thể tạo snapshot. Vui lòng thử lại.');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const handleBack = () => {
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <div className="student-progress-view loading">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="student-progress-view">
      {!selectedStudent ? (
        <div className="selection-view">
          {/* Modern Header */}
          <div className="modern-header">
            <div className="flex items-center gap-3 mb-2">
              <FileBarChart className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900">Báo cáo tiến bộ học sinh</h1>
            </div>
            <p className="text-gray-600">Xem báo cáo chi tiết về tiến bộ của từng học sinh</p>
          </div>

          {/* Modern Class Selection */}
          <div className="modern-class-selection">
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
                  {selectedClass?.id === cls.id && students.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      {students.length} học sinh
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Modern Student Grid */}
          {selectedClass && (
            <div className="modern-students-section">
              {students.length === 0 ? (
                <div className="modern-empty-state">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có học sinh</h3>
                  <p className="text-gray-600">Lớp này chưa có học sinh nào</p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Chọn học sinh để xem báo cáo
                  </h2>
                  <div className="modern-students-grid">
                    {students.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className="modern-student-card"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="modern-student-avatar">
                            {student.avatar_url ? (
                              <img src={student.avatar_url} alt={student.full_name} />
                            ) : (
                              <span className="text-xl font-bold text-purple-600">
                                {student.full_name?.charAt(0) || 'S'}
                              </span>
                            )}
                          </div>
                          <div className="modern-student-info">
                            <h3 className="font-semibold text-gray-900">
                              {student.full_name || student.username}
                            </h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                          </div>
                        </div>
                        <Download className="w-5 h-5 text-purple-600" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="progress-view">
          <div className="progress-header">
            <button onClick={handleBack} className="back-btn">
              <ArrowLeft />
              Quay lại
            </button>
            
            <div className="student-info-header">
              <h2>{selectedStudent.full_name || selectedStudent.username}</h2>
              <p>{selectedStudent.email}</p>
            </div>

            <button
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot}
              className="create-snapshot-btn"
            >
              {creatingSnapshot ? 'Đang tạo...' : 'Tạo snapshot mới'}
            </button>
          </div>

          <StudentProgressDashboard
            studentId={selectedStudent.id}
            classId={selectedClass?.id}
            showExport={true}
          />
        </div>
      )}
    </div>
  );
};

// Helper to get week number
Date.prototype.getWeek = function() {
  const onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

export default StudentProgressView;

