import { useState, useEffect } from 'react';
import { apiV1 } from '../../../../services/api';

/**
 * Custom hook for fetching and managing submission data
 */
export const useSubmissionData = (submissionId, classId, exerciseId, examId) => {
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [isExam, setIsExam] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let found = null;
        
        // Try fetching from exam submissions first
        if (examId || classId) {
          try {
            if (examId) {
              const res = await apiV1.get(`/exam-assessments/submissions/exam/${examId}`);
              found = (res.data || []).find((s) => String(s.id) === String(submissionId));
              if (found) setIsExam(true);
            } else if (classId) {
              const res = await apiV1.get(`/exam-assessments/submissions/class/${classId}`);
              found = (res.data || []).find((s) => String(s.id) === String(submissionId));
              if (found) setIsExam(true);
            }
          } catch (examError) {
            console.log('Not an exam submission, trying exercise...', examError);
          }
        }
        
        // Fallback to exercise submissions
        if (!found && classId) {
          const res = await apiV1.get(`/exercises/teacher-grading/classes/${classId}/submissions`);
          found = (res.data || []).find((s) => String(s.id) === String(submissionId));
        }
        if (!found && exerciseId) {
          const res2 = await apiV1.get(`/exercises/${exerciseId}/submissions`);
          const list = Array.isArray(res2.data) ? res2.data : (res2.data?.submissions || []);
          found = list.find((s) => String(s.id) === String(submissionId));
        }
        
        if (found) {
          setSubmission(found);
        }
      } catch (e) {
        console.error('Failed to fetch submission', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [submissionId, classId, exerciseId, examId]);

  return { loading, submission, setSubmission, isExam };
};
