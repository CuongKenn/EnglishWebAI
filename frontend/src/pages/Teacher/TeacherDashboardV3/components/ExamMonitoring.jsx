import { useState, useEffect, useMemo } from 'react';
import {
  Camera, AlertTriangle, AlertCircle, CheckCircle, Eye,
  Filter, Search, X, Clock, User, FileText, Shield,
  MessageSquare, Save, ChevronRight, ChevronDown
} from 'lucide-react';
import { apiV1 } from '../../../../services/api';
import Toast from '../../../../components/Toast/Toast';
import useToast from '../../../../hooks/useToast';
import './ExamMonitoring.css';

export default function ExamMonitoring() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filters, setFilters] = useState({
    exerciseId: '',
    examId: '',
    studentId: '',
    reviewed: null,
    search: ''
  });
  const { toast, showSuccess, showError, hideToast } = useToast();

  useEffect(() => {
    fetchAlerts();
  }, [filters.exerciseId, filters.examId, filters.studentId, filters.reviewed]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.exerciseId) params.exercise_id = filters.exerciseId;
      if (filters.examId) params.exam_id = filters.examId;
      if (filters.studentId) params.student_id = filters.studentId;
      if (filters.reviewed !== null) params.reviewed = filters.reviewed;

      const response = await apiV1.get('/face/monitoring-alerts', { params });

      if (response.data.success) {
        let filteredAlerts = response.data.alerts;

        // Filter by search term
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredAlerts = filteredAlerts.filter(alert =>
            alert.student_name?.toLowerCase().includes(searchLower) ||
            alert.message?.toLowerCase().includes(searchLower)
          );
        }

        setAlerts(filteredAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      showError('Không thể tải danh sách cảnh báo');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedAlert) return;

    try {
      await apiV1.patch(`/face/monitoring-alerts/${selectedAlert.id}/review`, {
        review_notes: reviewNotes
      });

      showSuccess('Đã đánh dấu cảnh báo đã xem');
      setShowReviewModal(false);
      setReviewNotes('');
      setSelectedAlert(null);
      fetchAlerts();
    } catch (error) {
      console.error('Error reviewing alert:', error);
      showError('Không thể đánh dấu đã xem');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAlertTypeIcon = (type) => {
    return type === 'alert' ? AlertCircle : AlertTriangle;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    // Otherwise, construct full URL
    const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    // Remove /api/v1 if present in baseUrl
    const cleanBaseUrl = baseUrl.replace(/\/api\/v1$/, '');
    return `${cleanBaseUrl}${imageUrl}`;
  };

  // Group alerts by student
  const studentsWithAlerts = useMemo(() => {
    const grouped = {};
    alerts.forEach(alert => {
      const studentId = alert.student_id;
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student_id: studentId,
          student_name: alert.student_name || 'N/A',
          alerts: [],
          unreviewedCount: 0,
          totalCount: 0
        };
      }
      grouped[studentId].alerts.push(alert);
      grouped[studentId].totalCount++;
      if (!alert.reviewed) {
        grouped[studentId].unreviewedCount++;
      }
    });
    return Object.values(grouped).sort((a, b) => {
      // Sort by unreviewed count first, then by total count
      if (b.unreviewedCount !== a.unreviewedCount) {
        return b.unreviewedCount - a.unreviewedCount;
      }
      return b.totalCount - a.totalCount;
    });
  }, [alerts]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!filters.search) return studentsWithAlerts;
    const searchLower = filters.search.toLowerCase();
    return studentsWithAlerts.filter(student =>
      student.student_name.toLowerCase().includes(searchLower)
    );
  }, [studentsWithAlerts, filters.search]);

  // Get alerts for selected student
  const selectedStudentAlerts = useMemo(() => {
    if (!selectedStudentId) return [];
    const student = studentsWithAlerts.find(s => s.student_id === selectedStudentId);
    return student ? student.alerts : [];
  }, [selectedStudentId, studentsWithAlerts]);

  const totalUnreviewed = alerts.filter(a => !a.reviewed).length;
  const totalAlerts = alerts.length;

  return (
    <div className="exam-monitoring-page">
      <Toast toast={toast} hideToast={hideToast} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ margin: 0, padding: 0 }}>Giám sát thi cử</h1>
          <p className="page-subtitle">Xem xét cảnh báo và báo động từ hệ thống giám sát</p>
        </div>
        <div className="flex items-center gap-3">
          {totalUnreviewed > 0 && (
            <div className="badge bg-red-500 text-white">
              {totalUnreviewed} chưa xem
            </div>
          )}
          <div className="badge bg-gray-100 text-gray-700">
            Tổng: {totalAlerts} cảnh báo
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="monitoring-layout">
        {/* Left Sidebar - Student List */}
        <div className="students-sidebar">
          <div className="sidebar-header">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#000000', margin: '0 0 1rem 0' }}>Danh sách học sinh</h3>
            <div className="search-box">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm học sinh..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="search-input"
              />
            </div>
          </div>

          <div className="students-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state-small">
                <User className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-500">Không tìm thấy học sinh</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.student_id}
                  className={`student-item ${selectedStudentId === student.student_id ? 'active' : ''}`}
                  onClick={() => setSelectedStudentId(student.student_id)}
                >
                  <div className="student-info">
                    <div className="student-avatar">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="student-details">
                      <div className="student-name">{student.student_name}</div>
                      <div className="student-stats">
                        <span className="stat-item">
                          {student.totalCount} cảnh báo
                        </span>
                        {student.unreviewedCount > 0 && (
                          <span className="stat-badge bg-red-500">
                            {student.unreviewedCount} mới
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedStudentId === student.student_id ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content - Alerts for Selected Student */}
        <div className="alerts-content">
          {!selectedStudentId ? (
            <div className="empty-state-center">
              <Shield className="w-20 h-20 text-gray-300" />
              <h3 className="empty-title">Chọn học sinh để xem cảnh báo</h3>
              <p className="empty-text">Click vào tên học sinh ở bên trái để xem các ảnh cảnh báo</p>
            </div>
          ) : (
            <>
              <div className="content-header">
                <div>
                  <h2 className="content-title">
                    {studentsWithAlerts.find(s => s.student_id === selectedStudentId)?.student_name}
                  </h2>
                  <p className="content-subtitle">
                    {selectedStudentAlerts.length} cảnh báo
                    {selectedStudentAlerts.filter(a => !a.reviewed).length > 0 && (
                      <span className="text-red-600 ml-2">
                        ({selectedStudentAlerts.filter(a => !a.reviewed).length} chưa xem)
                      </span>
                    )}
                  </p>
                </div>
                <div className="filter-controls">
                  <select
                    value={filters.reviewed === null ? '' : filters.reviewed.toString()}
                    onChange={(e) => setFilters({
                      ...filters,
                      reviewed: e.target.value === '' ? null : e.target.value === 'true'
                    })}
                    className="filter-select-small"
                  >
                    <option value="">Tất cả</option>
                    <option value="false">Chưa xem</option>
                    <option value="true">Đã xem</option>
                  </select>
                  <button onClick={fetchAlerts} className="btn-refresh-small">
                    Làm mới
                  </button>
                </div>
              </div>

              <div className="alerts-grid">
                {selectedStudentAlerts
                  .filter(alert => {
                    if (filters.reviewed === null) return true;
                    return alert.reviewed === filters.reviewed;
                  })
                  .map((alert) => {
                    const AlertIcon = getAlertTypeIcon(alert.alert_type);
                    const severityColor = getSeverityColor(alert.severity);

                    return (
                      <div
                        key={alert.id}
                        className={`alert-card ${!alert.reviewed ? 'unreviewed' : ''}`}
                      >
                        <div className="alert-header">
                          <div className="flex items-center gap-2">
                            <AlertIcon className={`w-5 h-5 ${alert.alert_type === 'alert' ? 'text-red-600' : 'text-yellow-600'
                              }`} />
                            <span className={`badge ${severityColor}`}>
                              {alert.severity === 'critical' ? 'Nghiêm trọng' :
                                alert.severity === 'high' ? 'Cao' :
                                  alert.severity === 'medium' ? 'Trung bình' : 'Thấp'}
                            </span>
                            {!alert.reviewed && (
                              <span className="badge bg-blue-500 text-white">Mới</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(alert.created_at)}
                          </span>
                        </div>

                        <div className="alert-image-main">
                          <img
                            src={getImageUrl(alert.image_url)}
                            alt="Alert"
                            className="alert-image"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowImageModal(true);
                            }}
                          />
                        </div>

                        <div className="alert-details">
                          {alert.message && (
                            <div className="detail-item">
                              <MessageSquare className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{alert.message}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <Camera className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {alert.face_count || 0} khuôn mặt |
                              {alert.verified ? ' Đã xác minh' : ' Chưa xác minh'}
                            </span>
                          </div>
                          {alert.confidence && (
                            <div className="detail-item">
                              <span className="text-xs text-gray-500">
                                Độ tương đồng: {alert.confidence || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="alert-actions">
                          <button
                            onClick={() => {
                              setSelectedAlert(alert);
                              setShowImageModal(true);
                            }}
                            className="btn-action"
                          >
                            <Eye className="w-4 h-4" />
                            Xem ảnh
                          </button>
                          {!alert.reviewed && (
                            <button
                              onClick={() => {
                                setSelectedAlert(alert);
                                setReviewNotes(alert.review_notes || '');
                                setShowReviewModal(true);
                              }}
                              className="btn-action btn-primary"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Đánh dấu đã xem
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {selectedStudentAlerts.filter(alert => {
                if (filters.reviewed === null) return true;
                return alert.reviewed === filters.reviewed;
              }).length === 0 && (
                  <div className="empty-state-center">
                    <AlertCircle className="w-16 h-16 text-gray-300" />
                    <p className="empty-text">Không có cảnh báo nào</p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="modal-content image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ảnh cảnh báo</h3>
              <button onClick={() => setShowImageModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <img
                src={getImageUrl(selectedAlert.image_url)}
                alt="Alert"
                className="full-image"
              />
              <div className="image-info">
                <p><strong>Học sinh:</strong> {selectedAlert.student_name}</p>
                <p><strong>Thời gian:</strong> {formatDate(selectedAlert.created_at)}</p>
                <p><strong>Loại:</strong> {selectedAlert.alert_type === 'alert' ? 'Báo động' : 'Cảnh báo'}</p>
                <p><strong>Mức độ:</strong> {selectedAlert.severity}</p>
                {selectedAlert.message && (
                  <p><strong>Nội dung:</strong> {selectedAlert.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đánh dấu đã xem</h3>
              <button onClick={() => setShowReviewModal(false)} className="modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ghi chú (tùy chọn)</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Thêm ghi chú về cảnh báo này..."
                  rows={4}
                  className="form-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary">
                Hủy
              </button>
              <button onClick={handleReview} className="btn-primary">
                <Save className="w-4 h-4" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

