import React from 'react';
import { Eye, Edit, Trash2, Users, Calendar, Award, FileText, Clock } from 'lucide-react';
import './ExerciseManagement.css';

const ExerciseList = React.memo(function ExerciseList({ exercises, onViewDetail, onDelete }) {
  const getSkillIcon = (skill) => {
    const icons = {
      listening: '🎧',
      speaking: '🗣️',
      reading: '📖',
      writing: '✍️'
    };
    return icons[skill] || '📝';
  };
  
  const getTypeLabel = (type) => {
    const labels = {
      skill_exercise: 'Bài tập Kỹ năng',
      test_15min: 'Kiểm tra 15 phút',
      midterm: 'Kiểm tra Giữa kì',
      final: 'Kiểm tra Cuối kì'
    };
    return labels[type] || type;
  };
  
  const getSubmissionProgress = (submissions, total) => {
    if (total === 0) return 0;
    return Math.round((submissions / total) * 100);
  };

  return (
    <div className="exercise-list-section">
      <h3 className="section-title-ex">Danh sách Bài tập & Kiểm tra</h3>
      
      <div className="exercise-grid">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="exercise-card-item">
            <div className="exercise-card-header">
              <div className="exercise-type-badges">
                <span className={`type-badge-ex ${exercise.type}`}>
                  {exercise.type === 'skill_exercise' && <FileText size={14} />}
                  {exercise.type === 'test_15min' && <Clock size={14} />}
                  {(exercise.type === 'midterm' || exercise.type === 'final') && <Award size={14} />}
                  {getTypeLabel(exercise.type)}
                </span>
                {exercise.skill && (
                  <span className={`skill-badge-ex ${exercise.skill}`}>
                    {getSkillIcon(exercise.skill)} {exercise.skill}
                  </span>
                )}
              </div>
              <span className={`status-badge-ex ${exercise.status}`}>
                {exercise.status === 'active' ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>
            
            <div className="exercise-card-body">
              <h4 className="exercise-title">{exercise.title}</h4>
              
              <div className="exercise-meta-info">
                <div className="meta-item">
                  <Users size={14} />
                  <span>{exercise.class}</span>
                </div>
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>Hạn: {new Date(exercise.dueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="meta-item">
                  <Award size={14} />
                  <span>{exercise.maxScore} điểm</span>
                </div>
              </div>
              
              <div className="submission-progress">
                <div className="progress-label">
                  <span>Đã nộp: {exercise.submissions}/{exercise.totalStudents}</span>
                  <span>{getSubmissionProgress(exercise.submissions, exercise.totalStudents)}%</span>
                </div>
                <div className="progress-bar-ex">
                  <div 
                    className="progress-fill-ex"
                    style={{ width: `${getSubmissionProgress(exercise.submissions, exercise.totalStudents)}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="exercise-card-footer">
              <button 
                className="btn-action-ex view"
                onClick={() => onViewDetail(exercise)}
                title="Xem chi tiết"
              >
                <Eye size={16} />
                Xem chi tiết
              </button>
              <button 
                className="btn-action-ex delete"
                onClick={() => onDelete(exercise.id)}
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {exercises.length === 0 && (
        <div className="empty-state-ex">
          <FileText size={64} className="empty-icon" />
          <h3>Chưa có bài tập nào</h3>
          <p>Click "Tạo bài tập mới" để bắt đầu</p>
        </div>
      )}
    </div>
  );
});

export default ExerciseList;