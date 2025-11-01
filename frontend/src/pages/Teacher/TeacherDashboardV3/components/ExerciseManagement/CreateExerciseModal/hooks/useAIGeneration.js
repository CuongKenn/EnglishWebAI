import { useState, useCallback } from 'react';
import examService from '../../../../../../services/examService';
import logger from '../../../../../../utils/logger';

/**
 * Custom hook for AI-powered exercise generation
 * Handles generating exercises from curriculum, files, or question bank
 */
export const useAIGeneration = (classes, classId, testType, aiFormData, showWarning, showSuccess) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  const generateExerciseWithAI = useCallback(async ({
    setTranscript,
    setAudioUrl,
    setShowTranscript,
    setPassageText,
    setWritingPrompt,
    setWritingInstructions,
    setMinWords,
    setMaxWords,
    setSpeakingPrompt,
    setSpeakingInstructions,
    setPrepTime,
    setSpeakTime,
    setQuestions,
    setInputMethod,
  }) => {
    if (!classId) {
      showWarning('Vui lòng chọn lớp học!');
      return;
    }
    
    setIsGeneratingAI(true);
    
    try {
      const classInfo = classes.find(c => c.id === parseInt(classId));
      const grade = classInfo?.grade || classInfo?.name?.match(/\d+/)?.[0] || '10';
      const semester = aiFormData.semester || '1';
      const questionsCount = aiFormData.questionsPerSkill ? parseInt(aiFormData.questionsPerSkill) : 10;
      
      const payload = {
        exam_type: testType === 'midterm' ? 'midterm' : 'final',
        grade,
        semester,
        difficulty: aiFormData.difficulty || 'mixed',
        questions_per_skill: isNaN(questionsCount) ? 10 : questionsCount,
        additional_notes: aiFormData.additionalNotes || ''
      };
      
      const response = await examService.generateFullExam(payload);
      
      // Populate listening
      if (response?.listening) {
        const ld = response.listening;
        setTranscript(ld.script || ld.transcript || '');
        if (ld.audio_url) setAudioUrl(ld.audio_url);
        setShowTranscript(true);
      }
      
      // Populate reading
      if (response?.reading) {
        setPassageText(response.reading.passage || '');
      }
      
      // Populate writing
      if (response?.writing) {
        setWritingPrompt(response.writing.prompt || '');
        if (response.writing.instructions) setWritingInstructions(response.writing.instructions);
        if (response.writing.min_words) setMinWords(response.writing.min_words);
        if (response.writing.max_words) setMaxWords(response.writing.max_words);
      }
      
      // Populate speaking
      if (response?.speaking) {
        const sp = response.speaking.prompt || response.speaking.topic || '';
        setSpeakingPrompt(sp);
        if (response.speaking.instructions) {
          setSpeakingInstructions(response.speaking.instructions);
        } else if (response.speaking.questions?.length > 0) {
          const speakingQ = response.speaking.questions.map(q => q.question || q.text || '').filter(Boolean);
          if (speakingQ.length > 0) setSpeakingInstructions(speakingQ);
        }
        if (response.speaking.prep_time) setPrepTime(response.speaking.prep_time);
        if (response.speaking.speak_time) setSpeakTime(response.speaking.speak_time);
      }
      
      // Collect questions
      const allQuestions = [];
      if (response.listening?.questions) {
        allQuestions.push(...response.listening.questions.map(q => ({ ...q, section: 'listening', skill: 'listening' })));
      }
      if (response.reading?.questions) {
        allQuestions.push(...response.reading.questions.map(q => ({ ...q, section: 'reading', skill: 'reading' })));
      }
      setQuestions(allQuestions);
      
      setInputMethod('manual');
      showSuccess('✨ AI đã sinh đề thành công! Vui lòng kiểm tra và chỉnh sửa nếu cần.');
      
    } catch (error) {
      logger.error('[AI Generate] Error:', error);
      showWarning('Lỗi khi sinh đề với AI: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsGeneratingAI(false);
    }
  }, [classes, classId, testType, aiFormData, showWarning, showSuccess]);
  
  return { isGeneratingAI, generateExerciseWithAI };
};
