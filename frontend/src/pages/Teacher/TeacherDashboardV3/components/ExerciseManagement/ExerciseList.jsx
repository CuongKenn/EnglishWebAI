import { EyeIcon, PencilIcon, TrashIcon, UserGroupIcon, CalendarIcon, TrophyIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { BookOpenIcon, SignalIcon, MicrophoneIcon, PencilSquareIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import './ExerciseManagement.css';

export default function ExerciseList({ exercises, onViewDetail, onDelete }) {
  const getSkillIcon = (skill) => {
    switch (skill) {
      case 'listening': return <SignalIcon className="w-3 h-3" />;
      case 'speaking': return <MicrophoneIcon className="w-3 h-3" />;
      case 'reading': return <BookOpenIcon className="w-3 h-3" />;
      case 'writing': return <PencilSquareIcon className="w-3 h-3" />;
      default: return <ClipboardDocumentListIcon className="w-3 h-3" />;
    }
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
                  {exercise.type === 'skill_exercise' && <DocumentTextIcon className="w-3.5 h-3.5" />}
                  {exercise.type === 'test_15min' && <ClockIcon className="w-3.5 h-3.5" />}
                  {(exercise.type === 'midterm' || exercise.type === 'final') && <TrophyIcon className="w-3.5 h-3.5" />}
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
                  <UserGroupIcon className="w-3.5 h-3.5" />
                  <span>{exercise.class}</span>
                </div>
                <div className="meta-item">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Hạn: {new Date(exercise.dueDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="meta-item">
                  <TrophyIcon className="w-3.5 h-3.5" />
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
                <EyeIcon className="w-4 h-4" />
                Xem chi tiết
              </button>
              <button 
                className="btn-action-ex delete"
                onClick={() => onDelete(exercise.id)}
                title="Xóa"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {exercises.length === 0 && (
        <div className="empty-state-ex">
          <DocumentTextIcon className="w-16 h-16 empty-icon" />
          <h3>Chưa có bài tập nào</h3>
          <p>Click "Tạo bài tập mới" để bắt đầu</p>
        </div>
      )}
    </div>
  );
}

