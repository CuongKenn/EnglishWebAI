import { useState, useEffect } from 'react';
import { ClipboardList, Sparkles, Calendar, BookOpen, Headphones, PenTool, MessageSquare, Plus, Trash2, Eye, Download } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { apiV1 } from '../../../services/api';
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
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await apiV1.get('/classes/teaching');
        setClasses(res.data || []);
        if (res.data.length > 0) {
          setSelectedClass(res.data[0].id);
          // Extract grade from class name (e.g., "Lớp 10A1" -> 10)
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
      const res = await apiV1.get(`/weekly-assessments?class_id=${selectedClass}`);
      setAssessments(res.data || []);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    }
  };

  const handleGenerateAssessment = async () => {
    if (!selectedClass) {
      alert('Vui lòng chọn lớp học!');
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
        grade_level: gradeLevel,
        title: `Phiếu đánh giá ${skillType} - Tuần ${weekNumber}`,
        description: `Đánh giá kỹ năng ${skillType} cho lớp ${classes.find(c => c.id == selectedClass)?.name || ''}`
      });

      setGeneratedAssessment(response.data);
      await loadAssessments(); // Reload list
      alert('✅ Tạo phiếu đánh giá thành công!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Lỗi khi tạo phiếu đánh giá');
      console.error('Failed to generate assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa phiếu đánh giá này?')) return;
    try {
      await apiV1.delete(`/weekly-assessments/${id}`);
      alert('✅ Đã xóa phiếu đánh giá');
      await loadAssessments();
    } catch (err) {
      alert('❌ Lỗi khi xóa phiếu đánh giá');
      console.error(err);
    }
  };

  const getSkillIcon = (skill) => {
    const icons = {
      reading: BookOpen,
      writing: PenTool,
      listening: Headphones,
      speaking: MessageSquare
    };
    return icons[skill] || ClipboardList;
  };

  const getSkillColor = (skill) => {
    const colors = {
      reading: 'bg-blue-100 text-blue-800',
      writing: 'bg-purple-100 text-purple-800',
      listening: 'bg-green-100 text-green-800',
      speaking: 'bg-orange-100 text-orange-800'
    };
    return colors[skill] || 'bg-gray-100 text-gray-800';
  };

  // Calculate stats
  const totalAssessments = assessments.length;
  const assessmentsBySkill = {
    reading: assessments.filter(a => a.skill_type === 'reading').length,
    writing: assessments.filter(a => a.skill_type === 'writing').length,
    listening: assessments.filter(a => a.skill_type === 'listening').length,
    speaking: assessments.filter(a => a.skill_type === 'speaking').length,
  };

  return (
    <div className="weekly-assessments-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <ClipboardList className="w-7 h-7 text-white" />
          </div>
          Phiếu Đánh Giá Kỹ Năng Hàng Tuần
        </h1>
        <p className="text-gray-600">Tạo và quản lý các phiếu đánh giá kỹ năng tự động bằng AI cho từng lớp và tuần học</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 stats-card-animate card-hover-effect">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Tổng phiếu</p>
              <p className="text-3xl font-bold text-gray-900">{totalAssessments}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Đọc (Reading)</p>
              <p className="text-3xl font-bold text-gray-900">{assessmentsBySkill.reading}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Viết (Writing)</p>
              <p className="text-3xl font-bold text-gray-900">{assessmentsBySkill.writing}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <PenTool className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Nghe & Nói</p>
              <p className="text-3xl font-bold text-gray-900">{assessmentsBySkill.listening + assessmentsBySkill.speaking}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Headphones className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Generation Form */}
      <Card className="p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">Tạo Phiếu Đánh Giá Mới bằng AI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lớp học <span className="text-purple-600 text-xs">(Tự động lấy grade từ tên lớp)</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const cls = classes.find(c => c.id == e.target.value);
                if (cls) {
                  // Auto extract grade from class name (e.g., "Lớp 10A1" → 10)
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Tuần học</label>
            <input
              type="number"
              min="1"
              max="52"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={weekNumber}
              onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kỹ năng</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
            >
              <option value="reading">📖 Reading (Đọc)</option>
              <option value="writing">✍️ Writing (Viết)</option>
              <option value="listening">🎧 Listening (Nghe)</option>
              <option value="speaking">🗣️ Speaking (Nói)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateAssessment}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Tạo Phiếu
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg mb-4">
            ❌ {error}
          </div>
        )}

        {generatedAssessment && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">✅ Phiếu đánh giá đã được tạo thành công!</h3>
            </div>
            <p className="text-sm text-green-800">{generatedAssessment.title}</p>
          </div>
        )}
      </Card>

      {/* Assessments List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Danh sách phiếu đánh giá đã tạo ({assessments.length})
        </h2>

        {assessments.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">Chưa có phiếu đánh giá nào</p>
              <p className="text-sm text-gray-400">Chọn lớp học và tạo phiếu đánh giá đầu tiên bằng AI</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, index) => {
              const SkillIcon = getSkillIcon(assessment.skill_type);
              return (
                <Card 
                  key={assessment.id} 
                  className="p-6 question-grid-item card-hover-effect"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2 items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSkillColor(assessment.skill_type)}`}>
                        {assessment.skill_type.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Tuần {assessment.week_number}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Xóa phiếu đánh giá"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <SkillIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600">Lớp {assessment.grade_level}</span>
                    </div>
                    <p className="text-gray-900 text-sm font-medium leading-relaxed mb-2">
                      {assessment.title}
                    </p>
                    {assessment.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{assessment.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{assessment.ai_generated ? '🤖 AI Generated' : '✍️ Manual'}</span>
                    <span>{new Date(assessment.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {assessment.content && (
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(assessment.content, null, 2)}</pre>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
