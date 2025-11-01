/**
 * Application Constants and Configuration
 * Centralized configuration for magic numbers, timeouts, limits, etc.
 */

// API Configuration
export const API_CONFIG = {
  // Timeouts (in milliseconds)
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  AI_GENERATION_TIMEOUT: 180000, // 3 minutes for AI generation
  FILE_UPLOAD_TIMEOUT: 120000, // 2 minutes for file uploads
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Test/Exercise Configuration
export const EXERCISE_CONFIG = {
  // Question limits
  MAX_QUESTIONS_PER_TEST: 50,
  MIN_QUESTIONS_PER_TEST: 1,
  DEFAULT_QUESTIONS_PER_SKILL: 10,
  
  // Score configuration
  DEFAULT_MAX_SCORE: 10,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  
  // Time limits (in seconds)
  DEFAULT_PREP_TIME: 60, // 1 minute
  DEFAULT_SPEAK_TIME: 180, // 3 minutes
  MIN_PREP_TIME: 30,
  MAX_PREP_TIME: 300, // 5 minutes
  MIN_SPEAK_TIME: 60,
  MAX_SPEAK_TIME: 600, // 10 minutes
  
  // Word count limits
  DEFAULT_MIN_WORDS: 250,
  DEFAULT_MAX_WORDS: 400,
  MIN_WORDS_ESSAY: 100,
  MAX_WORDS_ESSAY: 1000,
};

// File Upload Configuration
export const FILE_CONFIG = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_AUDIO_SIZE: 20 * 1024 * 1024, // 20MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Accepted file types
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ACCEPTED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  ACCEPTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ACCEPTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

// Pagination Configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
};

// UI Configuration
export const UI_CONFIG = {
  // Debounce delays (in milliseconds)
  SEARCH_DEBOUNCE: 500,
  INPUT_DEBOUNCE: 300,
  SCROLL_DEBOUNCE: 150,
  
  // Animation durations (in milliseconds)
  TOAST_DURATION: 3000,
  MODAL_ANIMATION: 300,
  TRANSITION_DURATION: 200,
  
  // Loading states
  SKELETON_ITEMS: 6,
  INFINITE_SCROLL_THRESHOLD: 100, // pixels from bottom
};

// Grade Configuration
export const GRADE_CONFIG = {
  GRADES: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  GRADE_LABELS: {
    1: 'Lớp 1',
    2: 'Lớp 2',
    3: 'Lớp 3',
    4: 'Lớp 4',
    5: 'Lớp 5',
    6: 'Lớp 6',
    7: 'Lớp 7',
    8: 'Lớp 8',
    9: 'Lớp 9',
    10: 'Lớp 10',
    11: 'Lớp 11',
    12: 'Lớp 12',
  },
};

// Skill Types
export const SKILL_TYPES = {
  LISTENING: 'listening',
  READING: 'reading',
  WRITING: 'writing',
  SPEAKING: 'speaking',
};

export const SKILL_LABELS = {
  [SKILL_TYPES.LISTENING]: 'Nghe',
  [SKILL_TYPES.READING]: 'Đọc',
  [SKILL_TYPES.WRITING]: 'Viết',
  [SKILL_TYPES.SPEAKING]: 'Nói',
};

export const SKILL_ICONS = {
  [SKILL_TYPES.LISTENING]: '🎧',
  [SKILL_TYPES.READING]: '📖',
  [SKILL_TYPES.WRITING]: '✍️',
  [SKILL_TYPES.SPEAKING]: '🗣️',
};

// Test Types
export const TEST_TYPES = {
  SKILL_EXERCISE: 'skill_exercise',
  MIDTERM: 'midterm',
  FINAL: 'final',
  COMPREHENSIVE: 'comprehensive_test',
};

export const TEST_TYPE_LABELS = {
  [TEST_TYPES.SKILL_EXERCISE]: 'Bài tập kỹ năng',
  [TEST_TYPES.MIDTERM]: 'Kiểm tra giữa kỳ',
  [TEST_TYPES.FINAL]: 'Kiểm tra cuối kỳ',
  [TEST_TYPES.COMPREHENSIVE]: 'Kiểm tra tổng hợp',
};

// Question Types
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  MATCHING: 'matching',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
};

export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Trắc nghiệm',
  [QUESTION_TYPES.TRUE_FALSE]: 'Đúng/Sai',
  [QUESTION_TYPES.FILL_BLANK]: 'Điền vào chỗ trống',
  [QUESTION_TYPES.MATCHING]: 'Nối câu',
  [QUESTION_TYPES.SHORT_ANSWER]: 'Câu hỏi ngắn',
  [QUESTION_TYPES.ESSAY]: 'Tự luận',
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  MIXED: 'mixed',
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTY_LEVELS.EASY]: 'Dễ',
  [DIFFICULTY_LEVELS.MEDIUM]: 'Trung bình',
  [DIFFICULTY_LEVELS.HARD]: 'Khó',
  [DIFFICULTY_LEVELS.MIXED]: 'Hỗn hợp',
};

// Submission Status
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  PENDING_REVIEW: 'pending_review',
  LATE: 'late',
};

export const SUBMISSION_STATUS_LABELS = {
  [SUBMISSION_STATUS.PENDING]: 'Chưa nộp',
  [SUBMISSION_STATUS.SUBMITTED]: 'Đã nộp',
  [SUBMISSION_STATUS.GRADED]: 'Đã chấm',
  [SUBMISSION_STATUS.PENDING_REVIEW]: 'Chờ xem xét',
  [SUBMISSION_STATUS.LATE]: 'Nộp muộn',
};

export const SUBMISSION_STATUS_COLORS = {
  [SUBMISSION_STATUS.PENDING]: '#f59e0b', // amber
  [SUBMISSION_STATUS.SUBMITTED]: '#3b82f6', // blue
  [SUBMISSION_STATUS.GRADED]: '#10b981', // green
  [SUBMISSION_STATUS.PENDING_REVIEW]: '#8b5cf6', // purple
  [SUBMISSION_STATUS.LATE]: '#ef4444', // red
};

// User Roles
export const USER_ROLES = {
  STUDENT: 'user',
  TEACHER: 'teacher',
  ADMIN: 'admin',
  PARENT: 'parent',
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.STUDENT]: 'Học sinh',
  [USER_ROLES.TEACHER]: 'Giáo viên',
  [USER_ROLES.ADMIN]: 'Quản trị viên',
  [USER_ROLES.PARENT]: 'Phụ huynh',
};

// Date/Time Formats
export const DATE_FORMATS = {
  FULL: 'DD/MM/YYYY HH:mm:ss',
  DATE_ONLY: 'DD/MM/YYYY',
  TIME_ONLY: 'HH:mm',
  DATE_TIME: 'DD/MM/YYYY HH:mm',
  ISO: 'YYYY-MM-DDTHH:mm:ss',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
  RECENT_SEARCHES: 'recentSearches',
  DRAFT_EXERCISE: 'draftExercise',
};

// API Endpoints (relative paths)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  
  // Exercises
  EXERCISES: '/exercises',
  SUBMISSIONS: '/exercises/submissions',
  
  // Classes
  CLASSES: '/classes',
  ENROLLMENTS: '/enrollments',
  
  // Question Bank
  QUESTION_BANK: '/question-bank',
  
  // AI
  AI_GENERATE: '/ai/generate',
  AI_GRADE: '/ai/grade',
};

export default {
  API_CONFIG,
  EXERCISE_CONFIG,
  FILE_CONFIG,
  PAGINATION_CONFIG,
  UI_CONFIG,
  GRADE_CONFIG,
  SKILL_TYPES,
  SKILL_LABELS,
  SKILL_ICONS,
  TEST_TYPES,
  TEST_TYPE_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  SUBMISSION_STATUS,
  SUBMISSION_STATUS_LABELS,
  SUBMISSION_STATUS_COLORS,
  USER_ROLES,
  USER_ROLE_LABELS,
  DATE_FORMATS,
  STORAGE_KEYS,
  API_ENDPOINTS,
};
