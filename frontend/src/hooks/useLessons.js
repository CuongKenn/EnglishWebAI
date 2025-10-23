// hooks/useLessons.js
import { useState, useEffect } from 'react';
import { lessonsAPI } from '../services/api';

/**
 * Custom hook để quản lý lessons
 */
export const useLessons = (params = {}) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await lessonsAPI.getLessons(params);
      setLessons(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách bài học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [JSON.stringify(params)]);

  return {
    lessons,
    loading,
    error,
    refetch: fetchLessons,
  };
};

/**
 * Custom hook để lấy chi tiết bài học
 */
export const useLessonDetail = (lessonId) => {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLessonDetail = async () => {
    if (!lessonId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await lessonsAPI.getLessonDetail(lessonId);
      setLesson(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin bài học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonDetail();
  }, [lessonId]);

  const updateProgress = async (progress) => {
    setLoading(true);
    setError(null);
    try {
      await lessonsAPI.updateProgress(lessonId, progress);
      await fetchLessonDetail(); // Refresh
      return true;
    } catch (err) {
      setError(err.message || 'Không thể cập nhật tiến độ');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    lesson,
    loading,
    error,
    refetch: fetchLessonDetail,
    updateProgress,
  };
};
