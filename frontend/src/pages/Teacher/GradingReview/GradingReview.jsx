import React, { useState, useEffect } from 'react';
import { apiV1 } from '../../../services/api';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Edit2 } from 'lucide-react';
import useToast from '../../../hooks/useToast';
import './GradingReview.css';

const GradingReview = () => {
  const toast = useToast();
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  // reviewMode not currently used
  const [reviewData, setReviewData] = useState({
    approved: true,
    final_score: null,
    teacher_notes: '',
    feedback: ''
  });
  const [stats, setStats] = useState({
    pending_review: 0,
    reviewed_today: 0,
    total_reviewed: 0
  });

  useEffect(() => {
    fetchPendingSubmissions();
    fetchStats();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const response = await apiV1.get('/teacher/pending-review');
      setPendingSubmissions(response.data);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiV1.get('/teacher/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSubmissionDetails = async (submissionId) => {
    try {
      const response = await apiV1.get(`/teacher/${submissionId}/details`);
      setSelectedSubmission(response.data);
      setReviewData({
        approved: true,
        final_score: response.data.ai_score || response.data.score,
        teacher_notes: '',
        feedback: response.data.ai_feedback || ''
      });
    } catch (error) {
      console.error('Error fetching submission details:', error);
      toast.error('Không thể tải chi tiết bài nộp');
    }
  };

  const handleReview = async () => {
    if (!selectedSubmission) return;

    if (!reviewData.approved && !reviewData.final_score) {
      toast.warning('Vui lòng nhập điểm mới nếu không đồng ý với điểm AI');
      return;
    }

    try {
      await apiV1.post(`/teacher/${selectedSubmission.id}/review`, reviewData);
      toast.success('Đã duyệt bài thành công!');
      setSelectedSubmission(null);
      fetchPendingSubmissions();
      fetchStats();
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Lỗi khi duyệt bài: ' + (error.response?.data?.detail || error.message));
    }
  };

  const renderStats = () => (
    <div className="grading-stats">
      <div className="stat-card pending">
        <div className="stat-icon">
          <Clock size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.pending_review}</div>
          <div className="stat-label">Đang chờ duyệt</div>
        </div>
      </div>

      <div className="stat-card today">
        <div className="stat-icon">
          <CheckCircle size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.reviewed_today}</div>
          <div className="stat-label">Đã duyệt hôm nay</div>
        </div>
      </div>

      <div className="stat-card total">
        <div className="stat-icon">
          <AlertCircle size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats.total_reviewed}</div>
          <div className="stat-label">Tổng đã duyệt</div>
        </div>
      </div>
    </div>
  );

  const renderSubmissionList = () => (
    <div className="submissions-list">
      <h2>Danh sách bài chờ duyệt</h2>
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : pendingSubmissions.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} />
          <p>Không có bài nào cần duyệt</p>
        </div>
      ) : (
        <div className="submissions-table">
          <table>
            <thead>
              <tr>
                <th>Học sinh</th>
                <th>Bài tập</th>
                <th>Lớp</th>
                <th>Điểm AI</th>
                <th>Ngày nộp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pendingSubmissions.map(sub => (
                <tr key={sub.id}>
                  <td>
                    <div className="student-info">
                      <strong>{sub.student_name}</strong>
                      <small>{sub.student_email}</small>
                    </div>
                  </td>
                  <td>{sub.exercise_title}</td>
                  <td>{sub.class_name}</td>
                  <td>
                    <span className="score-badge">{sub.ai_score || '-'}/10</span>
                  </td>
                  <td>{new Date(sub.submitted_at).toLocaleString('vi-VN')}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => fetchSubmissionDetails(sub.id)}
                    >
                      <Eye size={16} /> Xem & Duyệt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderReviewModal = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
        <div className="review-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Duyệt bài nộp</h2>
            <button className="btn-close" onClick={() => setSelectedSubmission(null)}>×</button>
          </div>

          <div className="modal-body">
            {/* Student & Exercise Info */}
            <div className="info-section">
              <div className="info-item">
                <strong>Học sinh:</strong> {selectedSubmission.student_name}
              </div>
              <div className="info-item">
                <strong>Bài tập:</strong> {selectedSubmission.exercise_title}
              </div>
              <div className="info-item">
                <strong>Lớp:</strong> {selectedSubmission.class_name}
              </div>
              <div className="info-item">
                <strong>Ngày nộp:</strong> {new Date(selectedSubmission.submitted_at).toLocaleString('vi-VN')}
              </div>
            </div>

            {/* AI Score */}
            <div className="ai-score-section">
              <h3>Điểm AI tự động chấm</h3>
              <div className="score-display">
                <span className="score">{selectedSubmission.ai_score || selectedSubmission.score || 0}</span>
                <span className="max-score">/10</span>
              </div>
            </div>

            {/* AI Feedback */}
            {selectedSubmission.ai_feedback && (
              <div className="feedback-section">
                <h3>Nhận xét AI</h3>
                <div className="feedback-content">
                  {selectedSubmission.ai_feedback}
                </div>
              </div>
            )}

            {/* Rubrics Scores */}
            {selectedSubmission.rubrics_scores && (
              <div className="rubrics-section">
                <h3>Chi tiết điểm</h3>
                <pre>{JSON.stringify(selectedSubmission.rubrics_scores, null, 2)}</pre>
              </div>
            )}

            {/* Student Answers */}
            {selectedSubmission.answers && (
              <div className="answers-section">
                <h3>Câu trả lời của học sinh</h3>
                <pre>{JSON.stringify(selectedSubmission.answers, null, 2)}</pre>
              </div>
            )}

            {/* Review Form */}
            <div className="review-form">
              <h3>Duyệt bài</h3>
              
              <div className="form-group">
                <label>
                  <input
                    type="radio"
                    checked={reviewData.approved}
                    onChange={() => setReviewData({ ...reviewData, approved: true })}
                  />
                  Đồng ý với điểm AI
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="radio"
                    checked={!reviewData.approved}
                    onChange={() => setReviewData({ ...reviewData, approved: false })}
                  />
                  Chấm lại điểm
                </label>
              </div>

              {!reviewData.approved && (
                <div className="form-group">
                  <label>Điểm mới:</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={reviewData.final_score || ''}
                    onChange={e => setReviewData({ ...reviewData, final_score: parseFloat(e.target.value) })}
                    placeholder="Nhập điểm mới"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Ghi chú cho học sinh (tùy chọn):</label>
                <textarea
                  value={reviewData.teacher_notes}
                  onChange={e => setReviewData({ ...reviewData, teacher_notes: e.target.value })}
                  placeholder="Thêm ghi chú nếu cần..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Nhận xét tùy chỉnh (tùy chọn):</label>
                <textarea
                  value={reviewData.feedback}
                  onChange={e => setReviewData({ ...reviewData, feedback: e.target.value })}
                  placeholder="Sửa hoặc bổ sung nhận xét..."
                  rows="4"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-cancel" onClick={() => setSelectedSubmission(null)}>
              Hủy
            </button>
            <button className="btn-approve" onClick={handleReview}>
              <CheckCircle size={16} /> Duyệt bài
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grading-review-page">
      <div className="page-header">
        <h1>Duyệt bài chấm tự động</h1>
        <p>Xem xét và phê duyệt kết quả chấm điểm tự động của AI</p>
      </div>

      {renderStats()}
      {renderSubmissionList()}
      {renderReviewModal()}
    </div>
  );
};

export default GradingReview;
