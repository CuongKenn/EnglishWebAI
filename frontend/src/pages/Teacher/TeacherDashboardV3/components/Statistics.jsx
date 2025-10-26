import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { TrendingUp, Users, FileCheck, Award, Download } from 'lucide-react';
import { Progress } from '../../../../components/ui/progress';

const Statistics = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const classPerformance = [
    { class: '10A1', avgScore: 7.8, completion: 85, students: 32 },
    { class: '10A2', avgScore: 8.2, completion: 92, students: 30 },
    { class: '11B1', avgScore: 7.5, completion: 78, students: 28 },
    { class: '11B2', avgScore: 8.0, completion: 88, students: 28 }
  ];

  const scoreDistribution = [
    { name: '0-4', value: 5, color: '#ef4444' },
    { name: '4-6', value: 25, color: '#f59e0b' },
    { name: '6-8', value: 45, color: '#10b981' },
    { name: '8-10', value: 43, color: '#3b82f6' }
  ];

  const skillsData = [
    { skill: 'Nghe', score: 7.5, color: '#8b5cf6' },
    { skill: 'Nói', score: 6.8, color: '#ec4899' },
    { skill: 'Đọc', score: 8.2, color: '#06b6d4' },
    { skill: 'Viết', score: 7.0, color: '#f59e0b' }
  ];

  const monthlyProgress = [
    { month: 'T7', score: 7.2 },
    { month: 'T8', score: 7.5 },
    { month: 'T9', score: 7.8 },
    { month: 'T10', score: 8.0 }
  ];

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
              <SelectItem value="10a1">10A1</SelectItem>
              <SelectItem value="10a2">10A2</SelectItem>
              <SelectItem value="11b1">11B1</SelectItem>
              <SelectItem value="11b2">11B2</SelectItem>
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
          <Button className="ml-auto gap-2">
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Tổng học sinh</p>
              <p className="text-2xl font-bold text-gray-900">118</p>
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
              <p className="text-2xl font-bold text-gray-900">7.9</p>
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
              <p className="text-2xl font-bold text-gray-900">86%</p>
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
              <p className="text-2xl font-bold text-gray-900">43 HS</p>
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
            {classPerformance.map((cls) => (
              <div key={cls.class}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">Lớp {cls.class}</span>
                  <span className="text-sm text-gray-600">{cls.avgScore}</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(cls.avgScore / 10) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{cls.avgScore}</span>
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
            {scoreDistribution.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">Điểm {item.name}</span>
                  <span className="text-sm text-gray-600">{item.value} học sinh</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${(item.value / 118) * 100}%`,
                      backgroundColor: item.color
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.value}</span>
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
            {skillsData.map((skill) => (
              <div key={skill.skill}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">{skill.skill}</span>
                  <span className="text-sm text-gray-600">{skill.score}</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${(skill.score / 10) * 100}%`,
                      backgroundColor: skill.color
                    }}
                  >
                    <span className="text-xs text-white font-medium">{skill.score}</span>
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
            {monthlyProgress.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 font-medium">Tháng {month.month}</span>
                  <span className="text-sm text-gray-600">{month.score}</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(month.score / 10) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{month.score}</span>
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
          {classPerformance.map((cls) => (
            <div key={cls.class} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">Lớp {cls.class}</h4>
                  <p className="text-sm text-gray-600">{cls.students} học sinh</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Điểm TB</p>
                  <p className="text-xl font-bold text-gray-900">{cls.avgScore}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-gray-600">Tỉ lệ hoàn thành</span>
                  <span className="text-gray-900 font-medium">{cls.completion}%</span>
                </div>
                <Progress value={cls.completion} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Statistics;
