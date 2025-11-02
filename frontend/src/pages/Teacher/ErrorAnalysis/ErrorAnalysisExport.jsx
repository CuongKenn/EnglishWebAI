import { useState, useEffect } from 'react';
import { FileBarChart, Download, Filter, AlertCircle, CheckCircle, TrendingDown, FileText, Users, Calendar, Award, Target, BookOpen, PenLine, Headphones, Mic } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { apiV1 } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import './ErrorAnalysisExport.css';

export default function ErrorAnalysisExport() {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [skillType, setSkillType] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await apiV1.get('/classes/teaching');
        setClasses(res.data || []);
        if (res.data.length > 0) {
          setSelectedClass(res.data[0].id);
        }
      } catch (err) {
        setError('Failed to load classes.');
        console.error('Failed to load classes:', err);
      }
    };
    loadClasses();
  }, []);

  const handleExport = async () => {
    if (!selectedClass) {
      toast.warning('Vui lòng chọn lớp học!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        class_id: selectedClass,
        format: exportFormat
      });
      
      if (weekNumber) {
        params.append('week_number', weekNumber);
      }
      
      if (skillType !== 'all') {
        params.append('skill_type', skillType);
      }

      const response = await apiV1.get(`/weekly-assessments/error-analysis/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const className = classes.find(c => c.id == selectedClass)?.name || 'class';
      const filename = `error_analysis_${className}_week${weekNumber || 'all'}_${new Date().getTime()}.${exportFormat}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Đã tải xuống báo cáo phân tích lỗi thành công!');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Lỗi khi xuất báo cáo');
      toast.error(err.response?.data?.detail || 'Lỗi khi xuất báo cáo');
      console.error('Failed to export error analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="error-analysis-export-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
            <FileBarChart className="w-7 h-7 text-white" />
          </div>
          Xuất Báo Cáo Phân Tích Lỗi
        </h1>
        <p className="text-gray-600">Xuất bảng phân tích lỗi chi tiết của học sinh với phản hồi AI và gợi ý cách sửa</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 stats-card-animate card-hover-effect">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Lớp học</p>
              <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Định dạng</p>
              <p className="text-xl font-bold text-gray-900">{exportFormat.toUpperCase()}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Bộ lọc</p>
              <p className="text-xl font-bold text-gray-900">{skillType === 'all' ? 'Tất cả' : skillType}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <Filter className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 stats-card-animate card-hover-effect" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Trạng thái</p>
              <p className="text-lg font-bold text-gray-900">Sẵn sàng</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Export Form */}
      <Card className="p-6 mb-8 border-2 border-blue-100 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
            <Download className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Bộ Lọc Dữ Liệu</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎓 Lớp học <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Chọn lớp học</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Tuần học (tùy chọn)
            </label>
            <input
              type="number"
              min="1"
              max="52"
              placeholder="Tất cả"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Target className="inline-block w-4 h-4 mr-1" /> Kỹ năng (tùy chọn)
            </label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
            >
              <option value="all">Tất cả kỹ năng</option>
              <option value="reading"><BookOpen className="inline-block w-4 h-4 mr-1" /> Reading (Đọc)</option>
              <option value="writing"><PenLine className="inline-block w-4 h-4 mr-1" /> Writing (Viết)</option>
              <option value="listening"><Headphones className="inline-block w-4 h-4 mr-1" /> Listening (Nghe)</option>
              <option value="speaking"><Mic className="inline-block w-4 h-4 mr-1" /> Speaking (Nói)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={loading || !selectedClass}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Tải xuống
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <span className="text-2xl">❌</span>
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Info Section */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 p-2 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📋 Nội dung báo cáo bao gồm:</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Danh sách lỗi phổ biến của từng học sinh theo kỹ năng</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Phản hồi và đánh giá chi tiết từ AI</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Gợi ý cụ thể về cách sửa lỗi và cải thiện</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Thống kê tỷ lệ lỗi theo từng loại kỹ năng</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Xu hướng tiến bộ qua các tuần học</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
