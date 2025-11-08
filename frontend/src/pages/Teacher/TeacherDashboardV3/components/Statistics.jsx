import { useState, useEffect } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { TrendingUp, Users, FileCheck, Award, Download, Loader2 } from 'lucide-react';
import { Progress } from '../../../../components/ui/progress';
import { apiV1 } from '../../../../services/api';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';

const Statistics = () => {
  const { toast, showError, hideToast } = useToast();
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedClass, selectedPeriod]);

  const fetchClasses = async () => {
    try {
      const res = await apiV1.get('/classes/teaching');
      setClasses(res.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        period: selectedPeriod
      };
      if (selectedClass !== 'all') {
        params.class_id = parseInt(selectedClass);
      }

      const response = await apiV1.get('/teacher/statistics', { params });
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Không thể tải thống kê. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const params = {
        period: selectedPeriod
      };
      if (selectedClass !== 'all') {
        params.class_id = parseInt(selectedClass);
      }

      // Call export endpoint
      const response = await apiV1.get('/teacher/statistics/export', {
        params,
        responseType: 'blob' // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'BaoCaoThongKe.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      showError('Không thể xuất báo cáo. Vui lòng thử lại sau.');
    }
  };

  const getSkillColor = (skill) => {
    const colors = {
      'Reading': '#06b6d4',
      'Writing': '#f59e0b',
      'Listening': '#8b5cf6',
      'Speaking': '#ec4899'
    };
    return colors[skill] || '#6b7280';
  };

  const getScoreRangeColor = (range) => {
    const colors = {
      '0-4': '#ef4444',
      '4-6': '#f59e0b',
      '6-8': '#10b981',
      '8-10': '#3b82f6'
    };
    return colors[range] || '#6b7280';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê & Báo cáo</h1>
        <p className="text-gray-600">Phân tích kết quả học tập và tiến độ của học sinh</p>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="semester">Học kỳ</SelectItem>
              <SelectItem value="year">Năm học</SelectItem>
            </SelectContent>
          </Select>
          <Button className="ml-auto gap-2" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </Button>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
          <span className="text-gray-600">Đang tải thống kê...</span>
        </div>
      )}

      {error && (
        <Card className="p-6 mb-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && statistics && (
        <>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_students}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Điểm TB chung</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.avg_score.toFixed(1)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.completion_rate.toFixed(0)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Xuất sắc</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.excellent_count} HS</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Class Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kết quả theo lớp</h3>
          <div className="space-y-4">
            {statistics.class_performance.map((cls) => (
              <div key={cls.class_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">Lớp {cls.class_name}</span>
                  <span className="text-sm text-gray-600">{cls.avg_score.toFixed(1)}</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(100, cls.avg_score)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{cls.avg_score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Score Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố điểm</h3>
          <div className="space-y-4">
            {statistics.score_distribution.map((item) => (
              <div key={item.range}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">Điểm {item.range}</span>
                  <span className="text-sm text-gray-600">{item.count} học sinh ({item.percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: getScoreRangeColor(item.range)
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Skills Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích theo kỹ năng</h3>
          <div className="space-y-4">
            {statistics.skills_data.map((skill) => (
              <div key={skill.skill}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">{skill.skill}</span>
                  <span className="text-sm text-gray-600">{skill.score.toFixed(1)} ({skill.count} bài)</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${skill.score}%`,
                      backgroundColor: getSkillColor(skill.skill)
                    }}
                  >
                    <span className="text-xs text-white font-medium">{skill.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Progress */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiến độ theo tháng</h3>
          <div className="space-y-4">
            {statistics.monthly_progress.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">Tháng {month.month}</span>
                  <span className="text-sm text-gray-600">{month.avg_score.toFixed(1)} ({month.submissions} bài)</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${month.avg_score}%` }}
                  >
                    <span className="text-xs text-white font-medium">{month.avg_score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Class Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết theo lớp</h3>
        <div className="space-y-4">
          {statistics.class_performance.map((cls) => (
            <div key={cls.class_id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Lớp {cls.class_name}</h4>
                  <p className="text-sm text-gray-600">{cls.students} học sinh</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Điểm TB</p>
                  <p className="text-xl font-bold text-gray-900">{cls.avg_score.toFixed(1)}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-gray-600">Tỉ lệ hoàn thành</span>
                  <span className="text-gray-900 font-medium">{cls.completion.toFixed(0)}%</span>
                </div>
                <Progress value={cls.completion} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      {toast.show && toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
      </>
      )}
    </div>
  );
};

export default Statistics;
