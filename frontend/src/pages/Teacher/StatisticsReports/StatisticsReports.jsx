import React, { useEffect, useState } from 'react';
import './StatisticsReports.css';
import { apiV1 as apiClient } from '../../../services/api';
import {
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const SCORE_RANGE_COLORS = {
  '0-4': '#ef4444',
  '4-6': '#f59e0b',
  '6-8': '#10b981',
  '8-10': '#3b82f6',
};

const getScoreRangeColor = (range) => SCORE_RANGE_COLORS[range] || '#6366f1';

const DEFAULT_STATS = {
  total_students: 0,
  avg_score: 0,
  completion_rate: 0,
  excellent_count: 0,
  class_performance: [],
  score_distribution: [],
  skills_data: [],
  monthly_progress: [],
};

const StatisticsReports = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [classes, setClasses] = useState([]);
  const [statistics, setStatistics] = useState({
    total_students: 0,
    avg_score: 0,
    completion_rate: 0,
    excellent_count: 0,
    class_performance: [],
    score_distribution: [],
    skills_data: [],
    monthly_progress: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [selectedClass, selectedPeriod]);

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get('/classes/teaching');
      setClasses(res.data || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { period: selectedPeriod };
      if (selectedClass !== 'all') {
        params.class_id = parseInt(selectedClass, 10);
      }

      const res = await apiClient.get('/teacher/statistics', { params });
      setStatistics(res.data || {
        total_students: 0,
        avg_score: 0,
        completion_rate: 0,
        excellent_count: 0,
        class_performance: [],
        score_distribution: [],
        skills_data: [],
        monthly_progress: [],
      });
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
      setStatistics({
        total_students: 0,
        avg_score: 0,
        completion_rate: 0,
        excellent_count: 0,
        class_performance: [],
        score_distribution: [],
        skills_data: [],
        monthly_progress: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const params = { period: selectedPeriod };
      if (selectedClass !== 'all') {
        params.class_id = parseInt(selectedClass, 10);
      }

      const res = await apiClient.get('/teacher/statistics/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;

      const disposition = res.headers?.['content-disposition'];
      let filename = 'BaoCaoThongKe.xlsx';
      if (disposition) {
        const matches = disposition.match(/filename="?([^";]+)"?/);
        if (matches?.[1]) {
          filename = matches[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
      setError('Không thể xuất báo cáo. Vui lòng thử lại sau.');
    }
  };

  const averageScoreOnTen = statistics.avg_score / 10;

  const totalSubmissions = statistics.monthly_progress.reduce((acc, month) => acc + (month.submissions || 0), 0);

  const topClasses = [...statistics.class_performance]
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 3);

  const classesNeedingSupport = [...statistics.class_performance]
    .sort((a, b) => a.avg_score - b.avg_score)
    .slice(0, 3);

  return (
    <div className="statistics-reports">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Thống kê & Báo cáo <ArrowTrendingUpIcon className="w-8 h-8 inline" />
          </h1>
          <p className="page-subtitle">Theo dõi hiệu suất học tập và tiến độ của học sinh</p>
        </div>
        <button className="btn-primary" onClick={handleExportReport} disabled={loading}>
          <DocumentArrowDownIcon className="w-5 h-5 inline" /> Xuất báo cáo
        </button>
      </div>

      <div className="filters-section">
        <select 
          className="filter-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">Tất cả lớp học</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
        >
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="semester">Học kỳ này</option>
          <option value="year">Năm học này</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Đang tải dữ liệu thống kê...</div>
      ) : (
        <>

          <div className="metrics-grid">
            <div className="metric-card blue">
              <div className="metric-icon">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Tổng học sinh</div>
                <div className="metric-value">{statistics.total_students}</div>
                <div className="metric-trend">Tổng số học sinh trong các lớp</div>
              </div>
            </div>

            <div className="metric-card green">
              <div className="metric-icon">
                <StarIcon className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Điểm trung bình</div>
                <div className="metric-value">{averageScoreOnTen.toFixed(1)}/10</div>
                <div className="metric-trend">Tính trên các bài đã chấm</div>
              </div>
            </div>

            <div className="metric-card orange">
              <div className="metric-icon">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Tỷ lệ hoàn thành</div>
                <div className="metric-value">{statistics.completion_rate.toFixed(1)}%</div>
                <div className="metric-trend">Số bài nộp / số bài giao</div>
              </div>
            </div>

            <div className="metric-card purple">
              <div className="metric-icon">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <div className="metric-content">
                <div className="metric-label">Bài nộp</div>
                <div className="metric-value">{totalSubmissions}</div>
                <div className="metric-trend">Tổng số bài được chấm trong kỳ</div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <ChartBarIcon className="w-5 h-5 inline" /> Kết quả theo lớp
                </h3>
              </div>
              <div className="chart-placeholder">
                {statistics.class_performance.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu lớp học</div>
                ) : (
                  <div className="attendance-bars">
                    {statistics.class_performance.map((cls) => (
                      <div key={cls.class_id} className="attendance-bar">
                        <div className="bar-label">{cls.class_name}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill purple"
                            style={{ width: `${Math.min(cls.avg_score, 100)}%` }}
                          >
                            {cls.avg_score.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <ChartBarIcon className="w-5 h-5 inline" /> Phân bố điểm số
                </h3>
              </div>
              <div className="chart-placeholder">
                {statistics.score_distribution.length === 0 ? (
                  <div className="empty-state">Chưa có điểm để thống kê</div>
                ) : (
                  <div className="column-chart">
                    {statistics.score_distribution.map((item) => (
                      <div key={item.range} className="column">
                        <div className="column-bar-wrapper">
                          <div
                            className="column-bar score"
                            style={{
                              height: `${Math.max(item.percentage, 8)}%`,
                              background: `linear-gradient(180deg, ${getScoreRangeColor(item.range)}CC 0%, ${getScoreRangeColor(item.range)} 100%)`
                            }}
                          >
                            <span>{item.count}</span>
                          </div>
                        </div>
                        <div className="column-label">Điểm {item.range}</div>
                        <div className="column-sub">{item.percentage.toFixed(0)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <DocumentTextIcon className="w-5 h-5 inline" /> Phân tích theo kỹ năng
                </h3>
              </div>
              <div className="chart-placeholder">
                {statistics.skills_data.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu kỹ năng</div>
                ) : (
                  <div className="attendance-bars">
                    {statistics.skills_data.map((skill) => (
                      <div key={skill.skill} className="attendance-bar">
                        <div className="bar-label">{skill.skill}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill teal"
                            style={{ width: `${Math.min(skill.score, 100)}%` }}
                          >
                            {skill.score.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bar-meta">{skill.count} bài</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>
                  <CheckCircleIcon className="w-5 h-5 inline" /> Tiến độ theo tháng
                </h3>
              </div>
              <div className="chart-placeholder">
                {statistics.monthly_progress.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu theo tháng</div>
                ) : (
                  <div className="column-chart">
                    {statistics.monthly_progress.map((month) => (
                      <div key={month.month} className="column">
                        <div className="column-bar-wrapper">
                          <div
                            className="column-bar progress"
                            style={{ height: `${Math.max(month.avg_score, 8)}%` }}
                          >
                            <span>{month.avg_score.toFixed(1)}</span>
                            <small>{month.submissions} bài</small>
                          </div>
                        </div>
                        <div className="column-label">Tháng {month.month.replace('T', '')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="students-grid">
            <div className="students-card">
              <div className="card-header">
                <h3>
                  <StarIcon className="w-5 h-5 inline" /> Lớp có kết quả nổi bật
                </h3>
              </div>
              <div className="students-list">
                {topClasses.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu</div>
                ) : (
                  topClasses.map((cls, index) => (
                    <div key={cls.class_id} className="student-item top">
                      <div className="student-rank">{index + 1}</div>
                      <div className="student-info">
                        <div className="student-name">{cls.class_name}</div>
                        <div className="student-class">{cls.students} học sinh</div>
                      </div>
                      <div className="student-stats">
                        <span className="stat-badge green">
                          <StarIcon className="w-3 h-3 inline" /> {cls.avg_score.toFixed(1)}%
                        </span>
                        <span className="stat-badge blue">
                          <CheckCircleIcon className="w-3 h-3 inline" /> {cls.completion.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="students-card">
              <div className="card-header">
                <h3>
                  <ExclamationTriangleIcon className="w-5 h-5 inline" /> Lớp cần quan tâm thêm
                </h3>
              </div>
              <div className="students-list">
                {classesNeedingSupport.length === 0 ? (
                  <div className="empty-state">Chưa có dữ liệu</div>
                ) : (
                  classesNeedingSupport.map((cls) => (
                    <div key={cls.class_id} className="student-item warning">
                      <div className="student-icon">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                      </div>
                      <div className="student-info">
                        <div className="student-name">{cls.class_name}</div>
                        <div className="student-class">{cls.students} học sinh</div>
                      </div>
                      <div className="student-stats">
                        <span className="stat-badge orange">
                          <StarIcon className="w-3 h-3 inline" /> {cls.avg_score.toFixed(1)}%
                        </span>
                        <span className="stat-badge red">
                          <CheckCircleIcon className="w-3 h-3 inline" /> {cls.completion.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="activity-timeline-card">
            <div className="card-header">
              <h3>
                <CalendarIcon className="w-5 h-5 inline" /> Thống kê nhanh
              </h3>
            </div>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot blue"></div>
                <div className="timeline-content">
                  <div className="timeline-title">Học sinh xuất sắc</div>
                  <div className="timeline-desc">{statistics.excellent_count} học sinh đạt {'≥ 80%'}</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot purple"></div>
                <div className="timeline-content">
                  <div className="timeline-title">Số lớp theo dõi</div>
                  <div className="timeline-desc">{statistics.class_performance.length} lớp đã giao bài</div>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot green"></div>
                <div className="timeline-content">
                  <div className="timeline-title">Bài nộp kỳ này</div>
                  <div className="timeline-desc">{totalSubmissions} bài đã được chấm điểm</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatisticsReports;
