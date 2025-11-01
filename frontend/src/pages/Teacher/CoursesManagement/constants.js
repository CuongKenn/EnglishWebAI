/**
 * Constants for CoursesManagement
 */

export const SKILLS = [
  { value: 'listening', label: 'Listening', emoji: '🎧', color: '#10b981' },
  { value: 'speaking', label: 'Speaking', emoji: '🗣️', color: '#8b5cf6' },
  { value: 'reading', label: 'Reading', emoji: '📖', color: '#3b82f6' },
  { value: 'writing', label: 'Writing', emoji: '✍️', color: '#f97316' },
];

export const LEVELS = [
  { value: 'Beginner', label: 'BEGINNER' },
  { value: 'Elementary', label: 'ELEMENTARY' },
  { value: 'Intermediate', label: 'INTERMEDIATE' },
  { value: 'Upper-Intermediate', label: 'UPPER-INTERMEDIATE' },
  { value: 'Advanced', label: 'ADVANCED' },
];

export const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export const INITIAL_FORM_DATA = {
  title: '',
  skill: 'listening',
  level: 'Intermediate',
  grade: 10,
  description: '',
  lessonsCount: 20,
  durationHours: 40,
  thumbnailFile: null,
  thumbnailPreview: null,
};
