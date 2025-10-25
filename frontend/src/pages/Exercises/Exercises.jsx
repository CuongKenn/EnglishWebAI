import React, { useState, useEffect } from 'react';
import { useExercises } from '../../hooks';
import ExerciseSubmit from './ExerciseSubmit';
import './Exercises.css';

const Exercises = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [exerciseToSubmit, setExerciseToSubmit] = useState(null);
  const { exercises, loading, error, refetch } = useExercises();

  const filteredExercises = exercises.filter(exercise => {
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'pending' && !exercise.submission) ||
      (selectedStatus === 'submitted' && exercise.submission && !exercise.submission.grade) ||
      (selectedStatus === 'graded' && exercise.submission && exercise.submission.grade !== null);
    const matchesType = selectedType === 'all' || exercise.type === selectedType;
    
    return matchesStatus && matchesType;
  });

  const handleStartExercise = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    setSelectedExercise(exercise);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
  };

  const handleStartQuiz = () => {
    // Open submit modal
    setExerciseToSubmit(selectedExercise);
    setShowSubmitModal(true);
    setSelectedExercise(null);
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
    setExerciseToSubmit(null);
  };

  const handleSubmitted = () => {
    // Refresh exercises list after submission
    refetch();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không có hạn';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="exercises-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">✏️</span>
            Làm bài tập
          </h1>
          <p className="page-subtitle">
            Luyện tập và kiểm tra kiến thức với các bài tập đa dạng
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-container">
            <div className="filter-group">
              <label className="filter-label">Trạng thái:</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chưa làm</option>
                <option value="submitted">Đã nộp - Chờ chấm</option>
                <option value="graded">Đã chấm điểm</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Loại bài tập:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="assignment">Bài tập</option>
                <option value="quiz">Kiểm tra</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="exercises-section">
          <div className="section-header">
            <h2 className="section-title">Bài tập có sẵn</h2>
            <div className="results-count">
              {filteredExercises.length} bài tập
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải bài tập...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="exercises-grid">
              {filteredExercises.map((exercise) => {
                const hasSubmission = exercise.submission;
                const isGraded = hasSubmission && exercise.submission.grade !== null;
                const overdue = isOverdue(exercise.due_at);
                
                return (
                  <div key={exercise.id} className={`exercise-card exercise-card-${exercise.type === 'quiz' ? 'orange' : 'blue'}`}>
                    <div className="exercise-header">
                      <div className="exercise-image">
                        <span className="exercise-emoji">
                          {exercise.type === 'quiz' ? '�' : '�📝'}
                        </span>
                      </div>
                      <div className="exercise-info">
                        <h3 className="exercise-title">{exercise.title}</h3>
                        <div className="exercise-meta">
                          <span className={`type-badge type-${exercise.type}`}>
                            {exercise.type === 'quiz' ? 'Kiểm tra' : 'Bài tập'}
                          </span>
                          {exercise.max_score && (
                            <span className="score-badge">
                              <i className="fas fa-star"></i> {exercise.max_score} điểm
                            </span>
                          )}
                          {hasSubmission && (
                            <span className={`status-badge ${isGraded ? 'status-graded' : 'status-submitted'}`}>
                              {isGraded ? 'Đã chấm' : 'Đã nộp'}
                            </span>
                          )}
                          {!hasSubmission && overdue && (
                            <span className="status-badge status-overdue">
                              Quá hạn
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="exercise-description">{exercise.description || 'Không có mô tả'}</p>

                    <div className="exercise-stats">
                      <div className="stat-item">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Hạn nộp: {formatDate(exercise.due_at)}</span>
                      </div>
                      {hasSubmission && (
                        <div className="stat-item">
                          <i className="fas fa-check-circle"></i>
                          <span>Đã nộp: {formatDate(exercise.submission.submitted_at)}</span>
                        </div>
                      )}
                      {isGraded && (
                        <div className="stat-item">
                          <i className="fas fa-trophy"></i>
                          <span className="score-highlight">
                            Điểm: {exercise.submission.grade}/{exercise.max_score}
                          </span>
                        </div>
                      )}
                    </div>

                    {isGraded && exercise.submission.grade && exercise.max_score && (
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(exercise.submission.grade / exercise.max_score) * 100}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          Kết quả: {Math.round((exercise.submission.grade / exercise.max_score) * 100)}%
                        </span>
                      </div>
                    )}

                    <div className="exercise-actions">
                      <button 
                        className="start-btn"
                        onClick={() => handleStartExercise(exercise.id)}
                      >
                        <i className="fas fa-play"></i>
                        {hasSubmission ? (isGraded ? 'Xem kết quả' : 'Xem bài nộp') : 'Bắt đầu làm'}
                      </button>
                      {!hasSubmission && (
                        <button className="preview-btn">
                          <i className="fas fa-info-circle"></i>
                          Chi tiết
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && filteredExercises.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">✏️</div>
              <h3>Không có bài tập nào</h3>
              <p>Hãy thử thay đổi bộ lọc để tìm bài tập phù hợp</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedExercise.title}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="exercise-overview">
                <div className="overview-item">
                  <i className="fas fa-tag"></i>
                  <span>{selectedExercise.type === 'quiz' ? 'Kiểm tra' : 'Bài tập'}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-star"></i>
                  <span>Điểm tối đa: {selectedExercise.max_score || 'N/A'}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Hạn nộp: {formatDate(selectedExercise.due_at)}</span>
                </div>
                {selectedExercise.submission && (
                  <>
                    <div className="overview-item">
                      <i className="fas fa-check-circle"></i>
                      <span>Đã nộp: {formatDate(selectedExercise.submission.submitted_at)}</span>
                    </div>
                    {selectedExercise.submission.grade !== null && (
                      <div className="overview-item">
                        <i className="fas fa-trophy"></i>
                        <span className="score-highlight">
                          Điểm: {selectedExercise.submission.grade}/{selectedExercise.max_score}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <p className="modal-description">{selectedExercise.description || 'Không có mô tả'}</p>

              {selectedExercise.submission ? (
                <div className="submission-section">
                  <h4 className="submission-title">Thông tin bài nộp:</h4>
                  <div className="submission-details">
                    <p><strong>Nội dung:</strong></p>
                    <div className="submission-content">
                      {selectedExercise.submission.content || 'Không có nội dung'}
                    </div>
                    {selectedExercise.submission.file_path && (
                      <p className="file-info">
                        <i className="fas fa-file"></i> File đính kèm: {selectedExercise.submission.file_path}
                      </p>
                    )}
                    {selectedExercise.submission.feedback && (
                      <div className="feedback-section">
                        <p><strong>Nhận xét của giáo viên:</strong></p>
                        <div className="feedback-content">
                          {selectedExercise.submission.feedback}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="instructions-section">
                  <h4 className="instructions-title">Hướng dẫn làm bài:</h4>
                  <ul className="instructions-list">
                    <li>Đọc kỹ yêu cầu của bài tập</li>
                    <li>Soạn bài và upload file hoặc nhập nội dung trực tiếp</li>
                    <li>Kiểm tra lại trước khi nộp bài</li>
                    <li>Hạn nộp: {formatDate(selectedExercise.due_at)}</li>
                    {isOverdue(selectedExercise.due_at) && (
                      <li className="warning-text">⚠️ Bài tập đã quá hạn nộp</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!selectedExercise.submission ? (
                <button className="start-exercise-btn" onClick={handleStartQuiz}>
                  <i className="fas fa-play"></i>
                  Bắt đầu làm bài
                </button>
              ) : (
                <button className="close-modal-btn" onClick={handleCloseModal}>
                  <i className="fas fa-times"></i>
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Submit Modal */}
      {showSubmitModal && exerciseToSubmit && (
        <ExerciseSubmit
          exercise={exerciseToSubmit}
          onClose={handleCloseSubmitModal}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  );
};

export default Exercises;


