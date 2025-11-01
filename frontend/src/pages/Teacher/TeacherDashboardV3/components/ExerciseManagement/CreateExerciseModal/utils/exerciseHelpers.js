import { VALIDATION_MESSAGES } from '../constants';

/**
 * Validate exercise form data
 * @param {Object} formData - Exercise form data
 * @param {string} testType - Test type
 * @param {string} selectedSkill - Selected skill
 * @param {Array} questions - Questions array
 * @returns {Object} { isValid, errors }
 */
export const validateExerciseForm = (formData, testType, selectedSkill, questions, skillData = {}) => {
  const errors = [];

  // Basic validation
  if (!formData.title?.trim()) {
    errors.push(VALIDATION_MESSAGES.TITLE_REQUIRED);
  }

  if (!formData.classId) {
    errors.push(VALIDATION_MESSAGES.CLASS_REQUIRED);
  }

  // Skill-specific validation
  const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';
  const isMidtermOrFinal = testType === 'midterm' || testType === 'final';

  if (requiresSkill) {
    // Single skill exercise
    if (selectedSkill === 'listening') {
      if (!skillData.audioUrl && !skillData.audioFile) {
        errors.push(VALIDATION_MESSAGES.AUDIO_REQUIRED);
      }
    } else if (selectedSkill === 'reading') {
      if (!skillData.passageText?.trim()) {
        errors.push(VALIDATION_MESSAGES.PASSAGE_REQUIRED);
      }
    } else if (selectedSkill === 'writing') {
      if (!skillData.writingPrompt?.trim()) {
        errors.push(VALIDATION_MESSAGES.WRITING_PROMPT_REQUIRED);
      }
    } else if (selectedSkill === 'speaking') {
      if (!skillData.speakingPrompt?.trim()) {
        errors.push(VALIDATION_MESSAGES.SPEAKING_PROMPT_REQUIRED);
      }
    }

    // Questions required for listening and reading
    if ((selectedSkill === 'listening' || selectedSkill === 'reading') && questions.length === 0) {
      errors.push(VALIDATION_MESSAGES.QUESTIONS_REQUIRED);
    }
  }

  if (isMidtermOrFinal) {
    // Midterm/Final requires at least one section with content
    const hasListening = (skillData.audioUrl || skillData.audioFile) && skillData.transcript;
    const hasReading = skillData.passageText?.trim();
    const hasWriting = skillData.writingPrompt?.trim();
    const hasSpeaking = skillData.speakingPrompt?.trim();

    if (!hasListening && !hasReading && !hasWriting && !hasSpeaking) {
      errors.push('Vui lòng thêm nội dung cho ít nhất một kỹ năng');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format exercise data for API submission
 * @param {Object} formData - Form data
 * @param {string} testType - Test type
 * @param {string} selectedSkill - Selected skill
 * @param {Array} questions - Questions
 * @param {Object} skillData - Skill-specific data
 * @returns {Object} Formatted exercise data
 */
export const formatExerciseData = (formData, testType, selectedSkill, questions, skillData) => {
  const baseData = {
    title: formData.title,
    class_id: formData.classId,
    due_date: formData.dueDate || null,
    max_score: formData.maxScore,
    test_type: testType,
  };

  const requiresSkill = testType === 'skill_exercise' || testType === 'test_15min';
  const isMidtermOrFinal = testType === 'midterm' || testType === 'final';

  if (requiresSkill) {
    // Single skill exercise
    baseData.skill = selectedSkill;

    if (selectedSkill === 'listening') {
      baseData.transcript = skillData.transcript;
      baseData.show_transcript = skillData.showTranscript;
      baseData.audio_url = skillData.audioUrl;
      baseData.questions = questions;
    } else if (selectedSkill === 'reading') {
      baseData.passage_text = skillData.passageText;
      baseData.questions = questions;
    } else if (selectedSkill === 'writing') {
      baseData.prompt = skillData.writingPrompt;
      baseData.writing_type = skillData.writingType;
      baseData.instructions = skillData.writingInstructions.filter(i => i.trim());
      baseData.min_words = skillData.minWords;
      baseData.max_words = skillData.maxWords;
    } else if (selectedSkill === 'speaking') {
      baseData.prompt = skillData.speakingPrompt;
      baseData.instructions = skillData.speakingInstructions.filter(i => i.trim());
      baseData.prep_time = skillData.prepTime;
      baseData.speak_time = skillData.speakTime;
    }
  }

  if (isMidtermOrFinal) {
    // Comprehensive test with sections
    baseData.sections = [];

    if ((skillData.audioUrl || skillData.audioFile) && skillData.transcript) {
      baseData.sections.push({
        skill: 'listening',
        transcript: skillData.transcript,
        show_transcript: skillData.showTranscript,
        audio_url: skillData.audioUrl,
        questions: questions.filter(q => q.skill === 'listening'),
      });
    }

    if (skillData.passageText?.trim()) {
      baseData.sections.push({
        skill: 'reading',
        passage_text: skillData.passageText,
        questions: questions.filter(q => q.skill === 'reading'),
      });
    }

    if (skillData.writingPrompt?.trim()) {
      baseData.sections.push({
        skill: 'writing',
        prompt: skillData.writingPrompt,
        writing_type: skillData.writingType,
        instructions: skillData.writingInstructions.filter(i => i.trim()),
        min_words: skillData.minWords,
        max_words: skillData.maxWords,
      });
    }

    if (skillData.speakingPrompt?.trim()) {
      baseData.sections.push({
        skill: 'speaking',
        prompt: skillData.speakingPrompt,
        instructions: skillData.speakingInstructions.filter(i => i.trim()),
        prep_time: skillData.prepTime,
        speak_time: skillData.speakTime,
      });
    }
  }

  return baseData;
};

/**
 * Format questions from question bank selection
 * @param {Array} selectedQuestions - Questions from question bank
 * @returns {Array} Formatted questions
 */
export const formatQuestionsFromBank = (selectedQuestions) => {
  return selectedQuestions.map((q, index) => ({
    id: `qb-${q.id}-${Date.now()}-${index}`,
    text: q.question_text,
    type: q.question_type,
    options: q.options || [],
    correct_answer: q.correct_answer,
    points: q.points || 1,
    fromQuestionBank: true,
    questionBankId: q.id,
  }));
};

/**
 * Parse imported Word file questions
 * @param {Object} response - API response from Word import
 * @returns {Array} Parsed questions
 */
export const parseWordImportQuestions = (response) => {
  // Assuming API returns questions in a specific format
  if (!response || !response.questions) {
    return [];
  }

  return response.questions.map((q, index) => ({
    id: `word-${Date.now()}-${index}`,
    text: q.text || q.question,
    type: q.type || 'multiple_choice',
    options: q.options || [],
    correct_answer: q.correct_answer || q.answer,
    points: q.points || 1,
    fromImport: true,
  }));
};

/**
 * Get skill label with emoji
 * @param {string} skillValue - Skill value
 * @param {Array} skillsArray - Skills array from constants
 * @returns {string} Label with emoji
 */
export const getSkillLabel = (skillValue, skillsArray) => {
  const skill = skillsArray.find(s => s.value === skillValue);
  return skill ? `${skill.emoji} ${skill.label}` : skillValue;
};

/**
 * Get skill color
 * @param {string} skillValue - Skill value
 * @param {Array} skillsArray - Skills array from constants
 * @returns {string} Color hex code
 */
export const getSkillColor = (skillValue, skillsArray) => {
  const skill = skillsArray.find(s => s.value === skillValue);
  return skill ? skill.color : '#64748b';
};

/**
 * Calculate total points from questions
 * @param {Array} questions - Questions array
 * @returns {number} Total points
 */
export const calculateTotalPoints = (questions) => {
  return questions.reduce((sum, q) => sum + (q.points || 1), 0);
};

/**
 * Validate file type
 * @param {File} file - File object
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} Is valid
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file) return false;
  return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 * @param {File} file - File object
 * @param {number} maxSizeMB - Max size in MB
 * @returns {boolean} Is valid
 */
export const validateFileSize = (file, maxSizeMB) => {
  if (!file) return false;
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};
