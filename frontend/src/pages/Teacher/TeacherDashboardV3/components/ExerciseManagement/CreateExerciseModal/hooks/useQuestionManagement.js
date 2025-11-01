import { useState, useCallback } from 'react';

/**
 * Custom hook for managing questions in exercises
 */
export const useQuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  
  const addQuestion = useCallback(() => {
    setQuestions(prev => [...prev, {
      id: Date.now(),
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 2
    }]);
  }, []);
  
  const removeQuestion = useCallback((index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const updateQuestion = useCallback((index, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);
  
  const updateQuestionOption = useCallback((qIndex, optIndex, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].options[optIndex] = value;
      return updated;
    });
  }, []);
  
  const handleQuestionsFromBank = useCallback((selectedQuestions) => {
    setQuestions(prev => [...prev, ...selectedQuestions]);
  }, []);
  
  return {
    questions,
    setQuestions,
    addQuestion,
    removeQuestion,
    updateQuestion,
    updateQuestionOption,
    handleQuestionsFromBank,
  };
};
