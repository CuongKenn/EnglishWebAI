import React from 'react';
import { Eye, Edit, Trash2, Clock, BookOpen } from 'lucide-react';

/**
 * CourseCard Component
 * Display individual course card with actions
 */
const CourseCard = ({ course, onView, onEdit, onDelete }) => {
  const getSkillColor = (skill) => {
    const colors = {
      listening: '#10b981',
      speaking: '#8b5cf6',
      reading: '#3b82f6',
      writing: '#f97316',
    };
    return colors[skill] || '#6b7280';
  };

  const getSkillEmoji = (skill) => {
    const emojis = {
      listening: '🎧',
      speaking: '🗣️',
      reading: '📖',
      writing: '✍️',
    };
    return emojis[skill] || '📚';
  };

  return (
    <div className="course-card">
      {/* Thumbnail */}
      <div className="course-thumbnail">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.name} />
        ) : (
          <div
            className="course-thumbnail-placeholder"
            style={{ backgroundColor: `${getSkillColor(course.skill)}20` }}
          >
            <span style={{ fontSize: '48px' }}>
              {getSkillEmoji(course.skill)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="course-content">
        <div className="course-header">
          <h3>{course.name}</h3>
          <span
            className="skill-badge"
            style={{ backgroundColor: getSkillColor(course.skill) }}
          >
            {getSkillEmoji(course.skill)} {course.skill}
          </span>
        </div>

        <p className="course-description">{course.description}</p>

        <div className="course-meta">
          <div className="meta-item">
            <BookOpen size={16} />
            <span>{course.totalUnits || 0} bài học</span>
          </div>
          <div className="meta-item">
            <Clock size={16} />
            <span>Lớp {course.grade || 10}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="course-actions">
          <button
            onClick={() => onView(course)}
            className="btn-icon btn-view"
            title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onEdit(course)}
            className="btn-icon btn-edit"
            title="Chỉnh sửa"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(course)}
            className="btn-icon btn-delete"
            title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CourseCard);
