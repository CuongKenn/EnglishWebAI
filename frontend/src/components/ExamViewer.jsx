/**
 * Exam Viewer Component
 * Display exam for students to take
 */
import React, { useState, useEffect } from 'react';
import examService from '../services/examService';
import './ExamViewer.css';

const ExamViewer = ({ examId, onSubmitSuccess }) => {
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (exam && exam.duration && submission && submission.status === 'in_progress') {
      const startTime = new Date(submission.started_at);
      const endTime = new Date(startTime.getTime() + exam.duration * 60000);
      
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = Math.floor((endTime - now) / 1000);
        
        if (remaining <= 0) {
          handleAutoSubmit();
          clearInterval(timer);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [exam, submission]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examData = await examService.getExamDetail(examId);
      setExam(examData);

      // Try to get existing submission
      try {
        const submissionData = await examService.getMySubmission(examId);
        setSubmission(submissionData);
        setAnswers(submissionData.answers || {});
      } catch (err) {
        // No submission yet
        console.log('No existing submission');
      }
    } catch (err) {
      console.error('Load exam error:', err);
      setError('Không thể tải đề thi');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      const submissionData = await examService.startExam(examId);
      setSubmission(submissionData);
      setAnswers({});
    } catch (err) {
      console.error('Start exam error:', err);
      alert('Lỗi khi bắt đầu làm bài');
    }
  };

  const handleAnswerChange = (questionKey, value) => {
    const newAnswers = { ...answers, [questionKey]: value };
    setAnswers(newAnswers);

    // Auto-save
    if (submission && submission.status === 'in_progress') {
      saveAnswers(newAnswers);
    }
  };

  const saveAnswers = async (answersToSave) => {
    try {
      await examService.updateSubmission(submission.id, answersToSave, 'in_progress');
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài? Sau khi nộp bài sẽ không thể chỉnh sửa.')) {
      return;
    }

    try {
      setSubmitting(true);
      await examService.submitExam(submission.id, answers);
      alert('✅ Đã nộp bài thành công!');
      if (onSubmitSuccess) onSubmitSuccess();
      loadExam(); // Reload to see submitted status
    } catch (err) {
      console.error('Submit error:', err);
      alert('Lỗi khi nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await examService.submitExam(submission.id, answers);
      alert('⏰ Hết thời gian! Bài thi đã được tự động nộp.');
      loadExam();
    } catch (err) {
      console.error('Auto-submit error:', err);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question, sectionIdx, taskIdx, questionIdx) => {
    const questionKey = `s${sectionIdx}_t${taskIdx}_q${questionIdx}`;
    const isDisabled = !submission || submission.status !== 'in_progress';

    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="question-item" key={questionKey}>
            <div className="question-text">
              {question.question_id}. {question.question_text}
              {question.points > 0 && <span className="question-points">({question.points} điểm)</span>}
            </div>
            <div className="question-options">
              {question.options?.map((option, idx) => (
                <label key={idx} className="option-label">
                  <input
                    type="radio"
                    name={questionKey}
                    value={option}
                    checked={answers[questionKey] === option}
                    onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                    disabled={isDisabled}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="question-item" key={questionKey}>
            <div className="question-text">
              {question.question_id}. {question.question_text}
              {question.points > 0 && <span className="question-points">({question.points} điểm)</span>}
            </div>
            <div className="question-options">
              {question.options?.map((option, idx) => {
                const currentAnswers = answers[questionKey] || [];
                return (
                  <label key={idx} className="option-label">
                    <input
                      type="checkbox"
                      value={option}
                      checked={currentAnswers.includes(option)}
                      onChange={(e) => {
                        let newValue;
                        if (e.target.checked) {
                          newValue = [...currentAnswers, option];
                        } else {
                          newValue = currentAnswers.filter(v => v !== option);
                        }
                        handleAnswerChange(questionKey, newValue);
                      }}
                      disabled={isDisabled}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 'fill_blank':
        return (
          <div className="question-item" key={questionKey}>
            <div className="question-text">
              {question.question_id}. {question.question_text}
              {question.points > 0 && <span className="question-points">({question.points} điểm)</span>}
            </div>
            <input
              type="text"
              className="fill-blank-input"
              value={answers[questionKey] || ''}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
              disabled={isDisabled}
              placeholder="Nhập câu trả lời..."
            />
          </div>
        );

      case 'short_answer':
        return (
          <div className="question-item" key={questionKey}>
            <div className="question-text">
              {question.question_id}. {question.question_text}
              {question.points > 0 && <span className="question-points">({question.points} điểm)</span>}
            </div>
            <textarea
              className="short-answer-input"
              value={answers[questionKey] || ''}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
              disabled={isDisabled}
              placeholder="Nhập câu trả lời..."
              rows={3}
            />
          </div>
        );

      case 'essay':
        return (
          <div className="question-item" key={questionKey}>
            <div className="question-text">
              {question.question_id}. {question.question_text}
              {question.points > 0 && <span className="question-points">({question.points} điểm)</span>}
            </div>
            <textarea
              className="essay-input"
              value={answers[questionKey] || ''}
              onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
              disabled={isDisabled}
              placeholder="Viết câu trả lời của bạn..."
              rows={8}
            />
          </div>
        );

      case 'matching':
        return (
          <div className="question-item matching-item" key={questionKey}>
            <div className="matching-row">
              <div className="matching-word">
                {question.question_text}
              </div>
              <span className="matching-arrow">→</span>
              <select
                className="matching-select"
                value={answers[questionKey] || ''}
                onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                disabled={isDisabled}
              >
                <option value="">-- Chọn --</option>
                {question.options?.map((option, idx) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="question-item" key={questionKey}>
            <div className="question-text">
              {question.question_id}. {question.question_text}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="exam-viewer-loading">⏳ Đang tải đề thi...</div>;
  }

  if (error) {
    return <div className="exam-viewer-error">⚠️ {error}</div>;
  }

  if (!exam) {
    return <div className="exam-viewer-error">Không tìm thấy đề thi</div>;
  }

  // Not started yet
  if (!submission) {
    return (
      <div className="exam-viewer-start">
        <h1>{exam.title}</h1>
        <div className="exam-info">
          <p><strong>Loại:</strong> {exam.exam_type === 'midterm' ? 'Giữa kỳ' : exam.exam_type === 'final' ? 'Cuối kỳ' : 'Kiểm tra'}</p>
          <p><strong>Tổng điểm:</strong> {exam.total_points}</p>
          {exam.duration && <p><strong>Thời gian:</strong> {exam.duration} phút</p>}
          {exam.description && <p><strong>Mô tả:</strong> {exam.description}</p>}
        </div>
        <button className="btn-start-exam" onClick={handleStartExam}>
          🚀 Bắt đầu làm bài
        </button>
      </div>
    );
  }

  // Already submitted
  if (submission.status === 'submitted' || submission.status === 'graded') {
    return (
      <div className="exam-viewer-submitted">
        <h1>{exam.title}</h1>
        <div className="submitted-info">
          <p>✅ Bạn đã nộp bài lúc: {new Date(submission.submitted_at).toLocaleString('vi-VN')}</p>
          {submission.status === 'graded' && (
            <>
              <p className="score-display">
                <strong>Điểm:</strong> {submission.score}/{exam.total_points}
              </p>
              {submission.feedback && (
                <div className="teacher-feedback">
                  <h3>Nhận xét của giáo viên:</h3>
                  <p>{submission.feedback}</p>
                </div>
              )}
            </>
          )}
          {submission.status === 'submitted' && (
            <p>⏳ Đang chờ giáo viên chấm bài...</p>
          )}
        </div>
      </div>
    );
  }

  // In progress - show exam
  return (
    <div className="exam-viewer-container">
      {/* Header */}
      <div className="exam-header">
        <h1>{exam.title}</h1>
        <div className="exam-meta">
          <span className="exam-type">
            {exam.exam_type === 'midterm' ? '📘 Giữa kỳ' : exam.exam_type === 'final' ? '📗 Cuối kỳ' : '📝 Kiểm tra'}
          </span>
          <span className="exam-points">💯 {exam.total_points} điểm</span>
          {timeLeft !== null && (
            <span className={`exam-timer ${timeLeft < 300 ? 'timer-warning' : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Exam Content */}
      <div className="exam-content">
        {exam.content?.sections?.map((section, sectionIdx) => (
          <div key={sectionIdx} className="exam-section">
            <h2 className="section-title">{section.section_name}</h2>
            <p className="section-points">({section.section_points} điểm)</p>

            {section.tasks?.map((task, taskIdx) => (
              <div key={taskIdx} className="exam-task">
                <h3 className="task-title">{task.task_title}</h3>
                {task.instructions && (
                  <p className="task-instructions">{task.instructions}</p>
                )}

                {/* Display images if any */}
                {task.image_urls && task.image_urls.length > 0 && (
                  <div className="task-images">
                    {task.image_urls.map((imgUrl, imgIdx) => (
                      <img
                        key={imgIdx}
                        src={imgUrl}
                        alt={`Task ${taskIdx + 1} - Image ${imgIdx + 1}`}
                        className="task-image"
                      />
                    ))}
                  </div>
                )}

                {/* Questions */}
                <div className="task-questions">
                  {task.questions?.map((question, questionIdx) => 
                    renderQuestion(question, sectionIdx, taskIdx, questionIdx)
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="exam-footer">
        <button
          className="btn-submit-exam"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '⏳ Đang nộp bài...' : '📤 Nộp bài'}
        </button>
      </div>
    </div>
  );
};

export default ExamViewer;

