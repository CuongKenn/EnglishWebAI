import { useState } from 'react';
import { apiV1 } from '../../../../services/api';

/**
 * Custom hook for managing grading operations
 */
export const useGrading = (submission, isExam, navigate) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [detailedFeedbackInput, setDetailedFeedbackInput] = useState('');

  const runAutoGrade = async (setSubmission) => {
    if (!submission) return;
    setAiLoading(true);
    try {
      const endpoint = isExam 
        ? `/exam-assessments/submissions/${submission.id}/auto-grade`
        : `/exercises/teacher-grading/submissions/${submission.id}/auto-grade`;
      
      const res = await apiV1.post(endpoint);
      const updated = isExam ? res.data.submission : res.data;
      setSubmission((prev) => ({ ...prev, ...updated }));
      setScoreInput(String(updated.ai_score ?? updated.score ?? ''));
      setFeedbackInput(updated.ai_feedback ?? updated.feedback ?? '');
      setDetailedFeedbackInput(updated.rubrics_scores?.detailed_feedback || '');
    } catch (e) {
      console.error('Auto-grade failed', e);
      alert('Lỗi khi chấm tự động!');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIResultToForm = () => {
    if (!submission) return;
    if (typeof submission.ai_score === 'number') setScoreInput(String(submission.ai_score));
    if (submission.ai_feedback) setFeedbackInput(submission.ai_feedback);
    if (submission.rubrics_scores?.detailed_feedback) setDetailedFeedbackInput(submission.rubrics_scores.detailed_feedback);
  };

  const saveGrade = async (editableSpeaking, editableWriting) => {
    if (!submission) return;
    try {
      const updatedRubrics = {
        ...(submission.rubrics_scores || {}),
        detailed_feedback: detailedFeedbackInput
      };
      
      // Update speaking feedback
      if (updatedRubrics.speaking?.content) {
        updatedRubrics.speaking.content = {
          ...updatedRubrics.speaking.content,
          ...editableSpeaking
        };
      }
      
      // Update writing feedback
      if (updatedRubrics.writing?.feedback) {
        updatedRubrics.writing.feedback = {
          ...updatedRubrics.writing.feedback,
          ...editableWriting
        };
      }
      
      if (isExam) {
        await apiV1.post(`/exam-assessments/submissions/${submission.id}/grade`, {
          score: parseFloat(scoreInput),
          feedback: feedbackInput,
          rubrics_scores: updatedRubrics
        });
      } else {
        await apiV1.post(`/exercises/${submission.exercise_id}/submissions/${submission.id}/grade`, {
          score: parseFloat(scoreInput),
          feedback: feedbackInput,
          rubrics_scores: updatedRubrics,
        });
      }
      alert('Đã lưu điểm');
      navigate(-1);
    } catch (e) {
      console.error('Save grade failed', e);
      alert('Lỗi khi lưu điểm!');
    }
  };

  return {
    aiLoading,
    scoreInput,
    setScoreInput,
    feedbackInput,
    setFeedbackInput,
    detailedFeedbackInput,
    setDetailedFeedbackInput,
    runAutoGrade,
    applyAIResultToForm,
    saveGrade,
  };
};
