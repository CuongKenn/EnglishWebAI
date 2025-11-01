// Test types with metadata
export const TEST_TYPES = [
  {
    value: 'skill_exercise',
    label: 'Bài tập Kỹ năng',
    description: '1 kỹ năng cụ thể',
    icon: 'FileText',
  },
  {
    value: 'test_15min',
    label: 'Kiểm tra 15 phút',
    description: 'Test ngắn 1 kỹ năng',
    icon: 'Clock',
  },
  {
    value: 'midterm',
    label: 'Kiểm tra Giữa kì',
    description: 'Tổng hợp nhiều kỹ năng',
    icon: 'FileText',
  },
  {
    value: 'final',
    label: 'Kiểm tra Cuối kì',
    description: 'Tổng hợp toàn bộ',
    icon: 'Award',
  },
];

// Skills with metadata
export const SKILLS = [
  {
    value: 'listening',
    label: 'Nghe',
    emoji: '🎧',
    color: '#10b981',
  },
  {
    value: 'speaking',
    label: 'Nói',
    emoji: '🗣️',
    color: '#8b5cf6',
  },
  {
    value: 'reading',
    label: 'Đọc',
    emoji: '📖',
    color: '#3b82f6',
  },
  {
    value: 'writing',
    label: 'Viết',
    emoji: '✍️',
    color: '#f97316',
  },
];

// Input methods
export const INPUT_METHODS = [
  { value: 'manual', label: 'Tự nhập', icon: 'FileText' },
  { value: 'ai', label: 'Tạo bằng AI', icon: 'Sparkles' },
  { value: 'import', label: 'Import từ file', icon: 'Upload' },
];

// AI source options
export const AI_SOURCES = [
  { value: 'curriculum', label: 'Từ chương trình học', icon: 'FileText' },
  { value: 'files', label: 'Từ file tải lên', icon: 'Upload' },
  { value: 'question_bank', label: 'Từ ngân hàng câu hỏi', icon: 'Database' },
];

// Question bank difficulty levels
export const QB_DIFFICULTIES = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
  { value: 'mixed', label: 'Trộn lẫn' },
];

// Writing types
export const WRITING_TYPES = [
  { value: 'essay', label: 'Bài luận' },
  { value: 'letter', label: 'Thư' },
  { value: 'email', label: 'Email' },
  { value: 'report', label: 'Báo cáo' },
  { value: 'story', label: 'Câu chuyện' },
  { value: 'paragraph', label: 'Đoạn văn' },
];

// Default form values
export const DEFAULT_EXERCISE = {
  title: '',
  classId: '',
  dueDate: '',
  maxScore: 10,
};

export const DEFAULT_LISTENING = {
  transcript: '',
  showTranscript: false,
  audioUrl: '',
  audioFile: null,
};

export const DEFAULT_READING = {
  passageText: '',
  readingInputMethod: 'text',
  passageFile: null,
};

export const DEFAULT_WRITING = {
  writingPrompt: '',
  writingType: 'essay',
  writingInstructions: [''],
  minWords: 250,
  maxWords: 400,
};

export const DEFAULT_SPEAKING = {
  speakingPrompt: '',
  speakingInstructions: [''],
  prepTime: 60,
  speakTime: 180,
};

export const DEFAULT_AI_FORM = {
  semester: '1',
  grade: '',
  unit: '',
  skill: '',
  numQuestions: 10,
  difficulty: 'mixed',
};

// Validation messages
export const VALIDATION_MESSAGES = {
  TITLE_REQUIRED: 'Vui lòng nhập tiêu đề bài tập',
  CLASS_REQUIRED: 'Vui lòng chọn lớp học',
  QUESTIONS_REQUIRED: 'Vui lòng thêm ít nhất 1 câu hỏi',
  AUDIO_REQUIRED: 'Vui lòng tải lên file audio',
  TRANSCRIPT_REQUIRED: 'Vui lòng nhập bản ghi âm',
  PASSAGE_REQUIRED: 'Vui lòng nhập đoạn văn',
  WRITING_PROMPT_REQUIRED: 'Vui lòng nhập đề bài viết',
  SPEAKING_PROMPT_REQUIRED: 'Vui lòng nhập đề bài nói',
  AI_FIELDS_REQUIRED: 'Vui lòng điền đầy đủ thông tin để tạo bài tập bằng AI',
  IMPORT_FILE_REQUIRED: 'Vui lòng chọn file để import',
};

// Helper function to check if test type requires skill selection
export const requiresSkillSelection = (testType) => {
  return testType === 'skill_exercise' || testType === 'test_15min';
};

// Helper function to check if test type is midterm or final
export const isComprehensiveTest = (testType) => {
  return testType === 'midterm' || testType === 'final';
};
