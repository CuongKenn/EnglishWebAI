import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Download, TrendingUp, TrendingDown, Minus, FileText, Loader } from 'lucide-react';
import SkillProgressChart from './SkillProgressChart';
import ProgressTimelineChart from './ProgressTimelineChart';
import studentProgressService from '../../services/studentProgressService';
import './StudentProgressDashboard.css';

/**
 * Student Progress Dashboard
 * Comprehensive view of student progress with charts and PDF export
 */
const StudentProgressDashboard = ({ studentId, classId = null, showExport = true }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [periodType, setPeriodType] = useState('week');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProgressData();
  }, [studentId, classId, periodType]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load summary
      const summaryData = await studentProgressService.getStudentSummary(studentId, classId);
      setSummary(summaryData);

      // Load snapshots
      const snapshotsData = await studentProgressService.getSnapshots(studentId, {
        class_id: classId,
        period_type: periodType,
        limit: 12
      });
      setSnapshots(snapshotsData);

    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Không thể tải dữ liệu tiến bộ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      await studentProgressService.downloadPDF(
        studentId,
        summary?.student_id || 'student',
        classId
      );
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Không thể xuất báo cáo PDF. Vui lòng thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="trend-icon improving" />;
      case 'declining':
        return <TrendingDown className="trend-icon declining" />;
      default:
        return <Minus className="trend-icon stable" />;
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'improving':
        return 'Đang tiến bộ';
      case 'declining':
        return 'Cần cải thiện';
      default:
        return 'Ổn định';
    }
  };

  if (loading) {
    return (
      <div className="student-progress-dashboard loading">
        <Loader className="spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-progress-dashboard error">
        <p>{error}</p>
        <button onClick={loadProgressData} className="retry-btn">
          Thử lại
        </button>
      </div>
    );
  }

  const latestSnapshot = summary?.latest_snapshot;

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await studentProgressService.downloadExcel(
        studentId,
        summary?.student_id || 'student',
        classId
      );
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Không thể xuất báo cáo Excel. Vui lòng thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="student-progress-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2 className="dashboard-title">Báo cáo tiến bộ học tập</h2>
          <p className="dashboard-subtitle">
            Tổng hợp kết quả và tiến bộ theo từng kỹ năng
          </p>
        </div>

        {showExport && (
          <div className="export-buttons">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="export-btn export-pdf"
            >
              {exporting ? (
                <>
                  <Loader className="btn-icon spinning" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="btn-icon" />
                  Xuất PDF
                </>
              )}
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="export-btn export-excel"
            >
              {exporting ? (
                <>
                  <Loader className="btn-icon spinning" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <FileText className="btn-icon" />
                  Xuất Excel
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Period selector */}
      <div className="period-selector">
        <label>Chu kỳ:</label>
        <select value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
          <option value="week">Theo tuần</option>
          <option value="month">Theo tháng</option>
          <option value="semester">Theo học kỳ</option>
        </select>
      </div>

      {/* Summary Cards - Horizontal Grid Layout */}
      <div className="summary-cards-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-card-header">
            <div className="stat-icon primary">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Điểm trung bình</p>
              <h3 className="stat-value">
                {latestSnapshot?.average_score?.toFixed(1) || '0.0'}
                <span className="stat-unit">%</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon trend">
              {getTrendIcon(latestSnapshot?.trend)}
            </div>
            <div className="stat-info">
              <p className="stat-label">Xu hướng</p>
              <h3 className="stat-value-text">
                {getTrendText(latestSnapshot?.trend)}
              </h3>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon submissions">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Bài tập đã nộp</p>
              <h3 className="stat-value">
                {latestSnapshot?.graded_submissions || 0}
                <span className="stat-secondary">/{latestSnapshot?.total_submissions || 0}</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon completion">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Tỷ lệ hoàn thành</p>
              <h3 className="stat-value">
                {latestSnapshot?.completion_rate?.toFixed(0) || '0'}
                <span className="stat-unit">%</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Progress Chart */}
      {latestSnapshot?.skills && (
        <div className="chart-section">
          <h3 className="section-title">Kết quả theo kỹ năng</h3>
          <SkillProgressChart skillScores={latestSnapshot.skills} />
        </div>
      )}

      {/* Timeline Chart */}
      {snapshots.length > 0 && (
        <div className="chart-section">
          <ProgressTimelineChart timelineData={snapshots} />
        </div>
      )}

      {/* Skill Details Table */}
      {latestSnapshot?.skills && (
        <div className="details-section">
          <h3 className="section-title">Chi tiết từng kỹ năng</h3>
          <div className="skills-table">
            <table>
              <thead>
                <tr>
                  <th>Kỹ năng</th>
                  <th>Điểm</th>
                  <th>Đánh giá</th>
                  <th>Khuyến nghị</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(latestSnapshot.skills).map(([skill, score]) => {
                  const skillNames = {
                    reading: 'Đọc (Reading)',
                    writing: 'Viết (Writing)',
                    listening: 'Nghe (Listening)',
                    speaking: 'Nói (Speaking)'
                  };

                  let evaluation, recommendation, evaluationClass;
                  if (score >= 90) {
                    evaluation = 'Xuất sắc';
                    evaluationClass = 'excellent';
                    recommendation = 'Tiếp tục duy trì';
                  } else if (score >= 80) {
                    evaluation = 'Giỏi';
                    evaluationClass = 'very-good';
                    recommendation = 'Phát huy thêm';
                  } else if (score >= 70) {
                    evaluation = 'Khá';
                    evaluationClass = 'good';
                    recommendation = 'Cố gắng hơn nữa';
                  } else if (score >= 60) {
                    evaluation = 'Trung bình';
                    evaluationClass = 'average';
                    recommendation = 'Cần luyện tập thêm';
                  } else {
                    evaluation = 'Cần cải thiện';
                    evaluationClass = 'need-improvement';
                    recommendation = 'Tăng cường luyện tập';
                  }

                  return (
                    <tr key={skill}>
                      <td className="skill-name">{skillNames[skill]}</td>
                      <td className="skill-score-cell">{score.toFixed(1)}%</td>
                      <td>
                        <span className={`evaluation-badge ${evaluationClass}`}>
                          {evaluation}
                        </span>
                      </td>
                      <td className="recommendation">{recommendation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!latestSnapshot && (
        <div className="empty-state">
          <FileText className="empty-icon" />
          <h3>Chưa có dữ liệu</h3>
          <p>Chưa có đủ dữ liệu để hiển thị báo cáo tiến bộ.</p>
          <p>Hãy hoàn thành thêm các bài tập để xem tiến bộ của bạn.</p>
        </div>
      )}
    </div>
  );
};

StudentProgressDashboard.propTypes = {
  studentId: PropTypes.number.isRequired,
  classId: PropTypes.number,
  showExport: PropTypes.bool
};

export default StudentProgressDashboard;

