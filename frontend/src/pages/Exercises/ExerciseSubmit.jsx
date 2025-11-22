import React, { useState, useEffect } from 'react';
import { exercisesAPI } from '../../services/api';
import './ExerciseSubmit.css';
import Toast from '../../components/Toast/Toast';
import useToast from '../../hooks/useToast';

const ExerciseSubmit = ({ exercise, onClose, onSubmitted }) => {
  const { toast, showSuccess, hideToast } = useToast();
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    // Load questions if this is a quiz
    if (exercise.type === 'quiz') {
      loadQuestions();
    }
  }, [exercise]);

  useEffect(() => {
    // Timer for quiz
    if (quizStarted && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Auto submit when time's up
      handleSubmit(new Event('submit'));
    }
  }, [timeRemaining, quizStarted]);

  const loadQuestions = () => {
    // Mock questions based on exercise type
    // In real app, fetch from API
    const mockQuestions = [
      {
        id: 1,
        type: 'multiple_choice',
        question: 'What is the past tense of "go"?',
        options: ['goed', 'went', 'gone', 'goes'],
        points: 2
      },
      {
        id: 2,
        type: 'multiple_choice',
        question: 'Which word is a noun?',
        options: ['quickly', 'beautiful', 'happiness', 'run'],
        points: 2
      },
      {
        id: 3,
        type: 'short_answer',
        question: 'Translate "Xin chào" to English',
        points: 3
      },
      {
        id: 4,
        type: 'essay',
        question: 'Write a short paragraph (50-100 words) about your favorite hobby.',
        points: 5
      }
    ];
    setQuestions(mockQuestions);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    // Set timer if exercise has duration
    if (exercise.duration) {
      setTimeRemaining(exercise.duration * 60); // Convert minutes to seconds
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Preview file name
      setFileUrl(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For quiz: compile answers
    if (exercise.type === 'quiz') {
      const unanswered = questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0 && timeRemaining > 0) {
        if (!confirm(`Bạn chưa trả lời ${unanswered.length} câu hỏi. Bạn có chắc muốn nộp bài?`)) {
          return;
        }
      }
    } else {
      // For assignment: check content
      if (!content.trim() && !file && !fileUrl.trim()) {
        setError('Vui lòng nhập nội dung hoặc đính kèm file/link');
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      let submissionData;
      
      if (exercise.type === 'quiz') {
        // Submit quiz answers
        submissionData = {
          content_text: JSON.stringify(answers),
          content_url: null,
        };
      } else {
        // Submit assignment
        submissionData = {
          content_text: content.trim() || null,
          content_url: fileUrl.trim() || null,
        };

        if (file && !submissionData.content_url) {
          submissionData.content_url = file.name;
        }
      }

      await exercisesAPI.submitExercise(exercise.id, submissionData);
      
      // Success
      showSuccess(exercise.type === 'quiz' ? 'Đã nộp bài kiểm tra thành công!' : 'Đã nộp bài tập thành công!');
      if (onSubmitted) {
        onSubmitted();
      }
      onClose();
    } catch (err) {
      setError(err.detail || err.message || 'Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const isOverdue = () => {
    if (!exercise.due_at) return false;
    return new Date(exercise.due_at) < new Date();
  };

  return (
    <div className="exercise-submit-modal">
      <div className="submit-modal-overlay" onClick={onClose}></div>
      <div className="submit-modal-content">
        <div className="submit-modal-header">
          <h2 className="submit-modal-title">
            <i className={`fas ${exercise.type === 'quiz' ? 'fa-clipboard-list' : 'fa-edit'}`}></i>
            {exercise.type === 'quiz' ? 'Làm bài kiểm tra' : 'Nộp bài tập'}
          </h2>
          {quizStarted && timeRemaining !== null && (
            <div className={`timer ${timeRemaining < 300 ? 'warning' : ''}`}>
              <i className="fas fa-clock"></i>
              {formatTime(timeRemaining)}
            </div>
          )}
          <button className="submit-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="submit-modal-body">
          <div className="exercise-info-box">
            <h3 className="exercise-submit-title">{exercise.title}</h3>
            <div className="exercise-submit-meta">
              <span className="meta-item">
                <i className="fas fa-tag"></i>
                {exercise.type === 'quiz' ? 'Kiểm tra' : 'Bài tập'}
              </span>
              <span className="meta-item">
                <i className="fas fa-star"></i>
                Điểm tối đa: {exercise.max_score || 'N/A'}
              </span>
              <span className="meta-item">
                <i className="fas fa-calendar-alt"></i>
                Hạn nộp: {formatDate(exercise.due_at)}
              </span>
              {exercise.type === 'quiz' && exercise.duration && (
                <span className="meta-item">
                  <i className="fas fa-hourglass-half"></i>
                  Thời gian: {exercise.duration} phút
                </span>
              )}
            </div>
            {isOverdue() && (
              <div className="overdue-warning">
                <i className="fas fa-exclamation-triangle"></i>
                Bài tập đã quá hạn nộp. Nộp muộn có thể bị trừ điểm.
              </div>
            )}
            {exercise.description && (
              <div className="exercise-description-box">
                <strong>Yêu cầu:</strong>
                <p>{exercise.description}</p>
              </div>
            )}
          </div>

          {/* QUIZ MODE */}
          {exercise.type === 'quiz' && (
            <>
              {!quizStarted ? (
                <div className="quiz-start-screen">
                  <div className="quiz-info">
                    <h3>Thông tin bài kiểm tra</h3>
                    <ul>
                      <li><i className="fas fa-question-circle"></i> Số câu hỏi: {questions.length}</li>
                      {exercise.duration && (
                        <li><i className="fas fa-clock"></i> Thời gian: {exercise.duration} phút</li>
                      )}
                      <li><i className="fas fa-star"></i> Tổng điểm: {exercise.max_score}</li>
                    </ul>
                    <div className="quiz-instructions">
                      <h4>Lưu ý:</h4>
                      <ul>
                        <li>Đọc kỹ câu hỏi trước khi trả lời</li>
                        <li>Sau khi bắt đầu, đồng hồ sẽ bắt đầu đếm ngược</li>
                        <li>Bạn có thể điều hướng giữa các câu hỏi</li>
                        <li>Nhớ kiểm tra lại trước khi nộp bài</li>
                        {exercise.duration && (
                          <li className="warning-text">Bài sẽ tự động nộp khi hết thời gian</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <button className="btn-start-quiz" onClick={startQuiz}>
                    <i className="fas fa-play"></i>
                    Bắt đầu làm bài
                  </button>
                </div>
              ) : (
                <div className="quiz-questions">
                  {/* Question Navigation */}
                  <div className="question-nav">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        className={`question-nav-btn ${currentQuestionIndex === idx ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
                        onClick={() => setCurrentQuestionIndex(idx)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Current Question */}
                  {questions[currentQuestionIndex] && (
                    <div className="question-container">
                      <div className="question-header">
                        <span className="question-number">
                          Câu {currentQuestionIndex + 1}/{questions.length}
                        </span>
                        <span className="question-points">
                          <i className="fas fa-star"></i>
                          {questions[currentQuestionIndex].points} điểm
                        </span>
                      </div>

                      <div className="question-text">
                        {questions[currentQuestionIndex].question}
                      </div>

                      {/* Multiple Choice */}
                      {questions[currentQuestionIndex].type === 'multiple_choice' && (
                        <div className="options-list">
                          {questions[currentQuestionIndex].options.map((option, idx) => (
                            <label key={idx} className="option-item">
                              <input
                                type="radio"
                                name={`question-${questions[currentQuestionIndex].id}`}
                                value={option}
                                checked={answers[questions[currentQuestionIndex].id] === option}
                                onChange={() => handleAnswerChange(questions[currentQuestionIndex].id, option)}
                              />
                              <span className="option-label">{String.fromCharCode(65 + idx)}. {option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Short Answer */}
                      {questions[currentQuestionIndex].type === 'short_answer' && (
                        <div className="answer-input">
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Nhập câu trả lời..."
                            value={answers[questions[currentQuestionIndex].id] || ''}
                            onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                          />
                        </div>
                      )}

                      {/* Essay */}
                      {questions[currentQuestionIndex].type === 'essay' && (
                        <div className="answer-input">
                          <textarea
                            className="form-textarea"
                            rows="8"
                            placeholder="Viết câu trả lời chi tiết..."
                            value={answers[questions[currentQuestionIndex].id] || ''}
                            onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                          />
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="question-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                        >
                          <i className="fas fa-arrow-left"></i>
                          Câu trước
                        </button>
                        {currentQuestionIndex < questions.length - 1 ? (
                          <button
                            className="btn-secondary"
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                          >
                            Câu sau
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        ) : (
                          <button className="btn-submit-quiz" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Đang nộp...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-paper-plane"></i>
                                Nộp bài
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ASSIGNMENT MODE */}
          {exercise.type === 'assignment' && (
            <form onSubmit={handleSubmit} className="submit-form">
            <div className="form-group">
              <label htmlFor="content" className="form-label">
                <i className="fas fa-pencil-alt"></i>
                Nội dung bài làm
              </label>
              <textarea
                id="content"
                className="form-textarea"
                placeholder="Nhập nội dung bài làm của bạn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
              />
              <span className="form-hint">
                Nhập câu trả lời, giải thích, hoặc mô tả bài làm của bạn
              </span>
            </div>

            <div className="form-divider">
              <span>HOẶC</span>
            </div>

            <div className="form-group">
              <label htmlFor="file" className="form-label">
                <i className="fas fa-paperclip"></i>
                Đính kèm file
              </label>
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file"
                  className="file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label htmlFor="file" className="file-input-label">
                  <i className="fas fa-cloud-upload-alt"></i>
                  {file ? file.name : 'Chọn file để tải lên'}
                </label>
              </div>
              <span className="form-hint">
                Hỗ trợ: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
              </span>
            </div>

            <div className="form-divider">
              <span>HOẶC</span>
            </div>

            <div className="form-group">
              <label htmlFor="fileUrl" className="form-label">
                <i className="fas fa-link"></i>
                Link file (Google Drive, Dropbox,...)
              </label>
              <input
                type="url"
                id="fileUrl"
                className="form-input"
                placeholder="https://drive.google.com/..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
              <span className="form-hint">
                Dán link file từ Google Drive, Dropbox, hoặc dịch vụ lưu trữ khác
              </span>
            </div>

            {error && (
              <div className="error-box">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={submitting}
              >
                <i className="fas fa-times"></i>
                Hủy
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Nộp bài
                  </>
                )}
              </button>
            </div>
          </form>
          )}

          {error && exercise.type === 'quiz' && (
            <div className="error-box">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
        </div>
      </div>
      
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  );
};

export default ExerciseSubmit;
