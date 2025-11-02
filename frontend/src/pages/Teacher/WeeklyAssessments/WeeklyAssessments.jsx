import { useState, useEffect } from 'react';
import { 
  ClipboardDocumentListIcon, SparklesIcon, CalendarIcon, BookOpenIcon, SpeakerWaveIcon, PencilSquareIcon, ChatBubbleLeftRightIcon, 
  PlusIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon, DocumentChartBarIcon, UserGroupIcon, ArrowTrendingUpIcon, TrophyIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/card';
import { apiV1 } from '../../../services/api';
import Toast from '../../../components/Toast/Toast';
import useToast from '../../../hooks/useToast';
import './WeeklyAssessments.css';

export default function WeeklyAssessments() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [skillType, setSkillType] = useState('reading');
  const [gradeLevel, setGradeLevel] = useState(10);
  const [generatedAssessment, setGeneratedAssessment] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterWeek, setFilterWeek] = useState('all');
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await apiV1.get('/classes/teaching');
        setClasses(res.data || []);
        if (res.data.length > 0) {
          setSelectedClass(res.data[0].id);
          const gradMatch = res.data[0].name.match(/\d+/);
          if (gradMatch) {
            setGradeLevel(parseInt(gradMatch[0]));
          }
        }
      } catch (err) {
        setError('Failed to load classes.');
        console.error('Failed to load classes:', err);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadAssessments();
    }
  }, [selectedClass]);

  const loadAssessments = async () => {
    if (!selectedClass) return;
    try {
      const res = await apiV1.get(`/weekly-assessments/classes/${selectedClass}`);
      setAssessments(res.data || []);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }
  };

  const handleGenerateAssessment = async () => {
    if (!selectedClass) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedAssessment(null);

    try {
      const response = await apiV1.post('/weekly-assessments/generate', {
        class_id: parseInt(selectedClass),
        week_number: weekNumber,
        skill_type: skillType,
        grade_level: gradeLevel
      });

      setGeneratedAssessment(response.data);
      await loadAssessments();
      showSuccess('✅ Tạo phiếu đánh giá thành công!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Lỗi khi tạo phiếu đánh giá');
      showError(err.response?.data?.detail || 'Lỗi khi tạo phiếu đánh giá');
      console.error('Failed to generate assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu đánh giá này?')) return;
    try {
      await apiV1.delete(`/weekly-assessments/${id}`);
      showSuccess('✅ Đã xóa phiếu đánh giá');
      await loadAssessments();
    } catch (err) {
      showError('❌ Lỗi khi xóa phiếu đánh giá');
      console.error(err);
    }
  };

  const handleExportErrorAnalysis = async () => {
    if (!selectedClass) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }

    setExportLoading(true);
    try {
      const params = {
        class_id: parseInt(selectedClass),
        assessment_type: 'weekly',
        format: 'excel',
        include_feedback: true,
        include_suggestions: true
      };

      // Add filters if selected
      if (filterSkill !== 'all') {
        params.skill_type = filterSkill;
      }
      if (filterWeek !== 'all') {
        params.week_number = parseInt(filterWeek);
      }

      const response = await apiV1.post('/error-analysis/export', params, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const className = classes.find(c => c.id == selectedClass)?.name || 'Class';
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `Phan_Tich_Loi_Weekly_${className}_${timestamp}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('📊 Xuất báo cáo thành công!');
    } catch (err) {
      console.error('Export error:', err);
      showError(err.response?.data?.detail || '❌ Lỗi khi xuất báo cáo');
    } finally {
      setExportLoading(false);
    }
  };

  const getSkillIcon = (skill) => {
    const icons = {
      reading: BookOpenIcon,
      writing: PencilSquareIcon,
      listening: SpeakerWaveIcon,
      speaking: ChatBubbleLeftRightIcon
    };
    return icons[skill] || ClipboardDocumentListIcon;
  };

  const getSkillColor = (skill) => {
    const colors = {
      reading: 'bg-blue-100 text-blue-800 border-blue-200',
      writing: 'bg-purple-100 text-purple-800 border-purple-200',
      listening: 'bg-green-100 text-green-800 border-green-200',
      speaking: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSkillName = (skill) => {
    const names = {
      reading: 'Đọc',
      writing: 'Viết',
      listening: 'Nghe',
      speaking: 'Nói'
    };
    return names[skill] || skill;
  };

  // Calculate stats
  const totalAssessments = assessments.length;
  const assessmentsBySkill = {
    reading: assessments.filter(a => a.skill_type === 'reading').length,
    writing: assessments.filter(a => a.skill_type === 'writing').length,
    listening: assessments.filter(a => a.skill_type === 'listening').length,
    speaking: assessments.filter(a => a.skill_type === 'speaking').length,
  };

  // Filter assessments
  const filteredAssessments = assessments.filter(a => {
    const skillMatch = filterSkill === 'all' || a.skill_type === filterSkill;
    const weekMatch = filterWeek === 'all' || a.week_number === parseInt(filterWeek);
    return skillMatch && weekMatch;
  });

  // Get unique weeks
  const uniqueWeeks = [...new Set(assessments.map(a => a.week_number))].sort((a, b) => b - a);

  return (
    <div className="weekly-assessments-page">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
              </div>
              Phiếu Đánh Giá Kỹ Năng Hàng Tuần
            </h1>
            <p className="text-gray-600">Tạo và quản lý các phiếu đánh giá kỹ năng tự động bằng AI cho từng lớp và tuần học</p>
          </div>
          
          {/* Export Button */}
          <button
            onClick={handleExportErrorAnalysis}
            disabled={exportLoading || !selectedClass || assessments.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            {exportLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Đang xuất...
              </>
            ) : (
              <>
                <DocumentChartBarIcon className="w-5 h-5" />
                Xuất Phân Tích Lỗi Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 stats-card-animate card-hover-effect bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1 font-medium">Tổng phiếu</p>
              <p className="text-4xl font-bold text-purple-600">{totalAssessments}</p>
              <p className="text-xs text-gray-500 mt-1">Tất cả kỹ năng</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl shadow-md">
              <ClipboardDocumentListIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1 font-medium">Đọc (Reading)</p>
              <p className="text-4xl font-bold text-blue-600">{assessmentsBySkill.reading}</p>
              <p className="text-xs text-gray-500 mt-1">Phiếu đánh giá</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl shadow-md">
              <BookOpenIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1 font-medium">Viết (Writing)</p>
              <p className="text-4xl font-bold text-purple-600">{assessmentsBySkill.writing}</p>
              <p className="text-xs text-gray-500 mt-1">Phiếu đánh giá</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl shadow-md">
              <PencilSquareIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1 font-medium">Nghe & Nói</p>
              <p className="text-4xl font-bold text-green-600">{assessmentsBySkill.listening + assessmentsBySkill.speaking}</p>
              <p className="text-xs text-gray-500 mt-1">Phiếu đánh giá</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl shadow-md">
              <SpeakerWaveIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Generation Form */}
      <Card className="p-6 mb-8 border-2 border-purple-100 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Tạo Phiếu Đánh Giá Mới bằng AI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <UserGroupIcon className="w-4 h-4 inline mr-1" />
              Lớp học
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const cls = classes.find(c => c.id == e.target.value);
                if (cls) {
                  const gradMatch = cls.name.match(/\d+/);
                  if (gradMatch) {
                    setGradeLevel(parseInt(gradMatch[0]));
                  }
                }
              }}
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Tuần học
            </label>
            <input
              type="number"
              min="1"
              max="52"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              value={weekNumber}
              onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <TrophyIcon className="w-4 h-4 inline mr-1" />
              Kỹ năng
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
            >
              <option value="reading">Reading (Đọc)</option>
              <option value="writing">Writing (Viết)</option>
              <option value="listening">Listening (Nghe)</option>
              <option value="speaking">Speaking (Nói)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateAssessment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Tạo Phiếu AI
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {generatedAssessment && (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <SparklesIcon className="w-5 h-5 text-green-600 animate-pulse" />
              <h3 className="font-bold text-green-900">Phiếu đánh giá đã được tạo thành công!</h3>
            </div>
            <p className="text-sm text-green-800 font-medium">{generatedAssessment.title}</p>
          </div>
        )}
      </Card>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-700">Lọc:</span>
        </div>
        
        <select
          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
        >
          <option value="all">Tất cả kỹ năng</option>
          <option value="reading">Reading</option>
          <option value="writing">Writing</option>
          <option value="listening">Listening</option>
          <option value="speaking">Speaking</option>
        </select>

        <select
          className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          value={filterWeek}
          onChange={(e) => setFilterWeek(e.target.value)}
        >
          <option value="all">Tất cả tuần</option>
          {uniqueWeeks.map(week => (
            <option key={week} value={week}>Tuần {week}</option>
          ))}
        </select>

        <span className="text-sm text-gray-600 ml-auto">
          Hiển thị <span className="font-bold text-purple-600">{filteredAssessments.length}</span> / {totalAssessments} phiếu
        </span>
      </div>

      {/* Assessments List */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-purple-600" />
          Danh sách phiếu đánh giá ({filteredAssessments.length})
        </h2>

        {filteredAssessments.length === 0 ? (
          <Card className="p-12 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 font-semibold text-lg">Chưa có phiếu đánh giá nào</p>
              <p className="text-sm text-gray-400">Chọn lớp học và tạo phiếu đánh giá đầu tiên bằng AI</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment, index) => {
              const SkillIcon = getSkillIcon(assessment.skill_type);
              return (
                <Card 
                  key={assessment.id} 
                  className={`p-6 question-grid-item card-hover-effect border-2 hover:shadow-2xl transition-all duration-300 ${getSkillColor(assessment.skill_type).split(' ')[0]}`}
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getSkillColor(assessment.skill_type)}`}>
                        <SkillIcon className="w-3 h-3 inline mr-1" />
                        {getSkillName(assessment.skill_type).toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white border-2 border-blue-600">
                        📅 Tuần {assessment.week_number}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa phiếu đánh giá"
                    >
                      <TrashIcon className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SkillIcon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-600">
                        {assessment.ai_generated ? 'AI Generated' : 'Manual'}
                      </span>
                    </div>
                    <h3 className="text-gray-900 text-base font-bold leading-relaxed mb-2">
                      {assessment.title}
                    </h3>
                    {assessment.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{assessment.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-t pt-3">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(assessment.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    {assessment.max_score && (
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                        ⭐ {assessment.max_score} điểm
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-3 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center gap-1 text-sm font-semibold">
                      <EyeIcon className="w-4 h-4" />
                      Xem
                    </button>
                    <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-3 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center gap-1 text-sm font-semibold">
                      <UserGroupIcon className="w-4 h-4" />
                      Bài nộp
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
