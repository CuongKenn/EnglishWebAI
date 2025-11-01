/**
 * Utility functions for CoursesManagement
 */

/**
 * Get color for skill type
 */
export const getSkillColor = (skill) => {
  const colors = {
    listening: '#10b981',
    speaking: '#8b5cf6',
    reading: '#3b82f6',
    writing: '#f97316',
  };
  return colors[skill] || '#6b7280';
};

/**
 * Get emoji for skill type
 */
export const getSkillEmoji = (skill) => {
  const emojis = {
    listening: '🎧',
    speaking: '🗣️',
    reading: '📖',
    writing: '✍️',
  };
  return emojis[skill] || '📚';
};

/**
 * Calculate course statistics
 */
export const calculateCourseStats = (courses) => {
  return {
    total: courses.length,
    active: courses.filter(c => c.status !== 'locked').length,
    completed: courses.filter(c => c.status === 'completed').length,
    totalStudents: courses.reduce((sum, c) => sum + (c.totalUnits || 0), 0),
  };
};

/**
 * Filter courses by search query
 */
export const filterCoursesBySearch = (courses, searchQuery) => {
  if (!searchQuery.trim()) return courses;
  const query = searchQuery.toLowerCase();
  return courses.filter(c => c.name?.toLowerCase().includes(query));
};

/**
 * Validate course form data
 */
export const validateCourseForm = (formData) => {
  const errors = [];

  if (!formData.title?.trim()) {
    errors.push('Tên khóa học không được để trống');
  }

  if (formData.title?.length > 200) {
    errors.push('Tên khóa học không được quá 200 ký tự');
  }

  if (formData.lessonsCount < 1 || formData.lessonsCount > 100) {
    errors.push('Số bài học phải từ 1 đến 100');
  }

  if (formData.durationHours < 1 || formData.durationHours > 1000) {
    errors.push('Thời lượng phải từ 1 đến 1000 giờ');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
