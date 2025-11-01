import React from 'react';

/**
 * Basic exercise form fields component
 * Handles title, class, due date, and max score
 */
const ExerciseFormFields = React.memo(({ 
  title,
  onTitleChange,
  classId,
  onClassChange,
  dueDate,
  onDueDateChange,
  maxScore,
  onMaxScoreChange,
  classes = [],
  loadingClasses = false,
}) => {
  return (
    <>
      {/* Title */}
      <div className="form-section-ex">
        <label className="form-label-ex">Tiêu đề *</label>
        <input 
          type="text" 
          className="form-input-ex" 
          placeholder="Ví dụ: Bài tập Nghe - Unit 5"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      
      {/* Row with Class, Due Date, Max Score */}
      <div className="form-row-ex">
        <div className="form-section-ex">
          <label className="form-label-ex">Lớp học</label>
          <select 
            className="form-select-ex" 
            value={classId} 
            onChange={(e) => onClassChange(e.target.value)}
            disabled={loadingClasses}
          >
            <option value="">Chọn lớp</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        
        <div className="form-section-ex">
          <label className="form-label-ex">Hạn nộp</label>
          <input 
            type="datetime-local" 
            className="form-input-ex"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>
        
        <div className="form-section-ex">
          <label className="form-label-ex">Điểm tối đa</label>
          <input 
            type="number" 
            className="form-input-ex" 
            value={maxScore}
            onChange={(e) => onMaxScoreChange(Number(e.target.value))}
            min="1"
            max="100"
          />
        </div>
      </div>
    </>
  );
});

ExerciseFormFields.displayName = 'ExerciseFormFields';

export default ExerciseFormFields;
