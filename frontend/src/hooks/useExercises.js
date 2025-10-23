// hooks/useExercises.js
import { useState, useEffect } from 'react';
import { exercisesAPI } from '../services/api';

/**
 * Custom hook để quản lý exercises
 */
export const useExercises = (params = {}) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exercisesAPI.getExercises(params);
      setExercises(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [JSON.stringify(params)]);

  return {
    exercises,
    loading,
    error,
    refetch: fetchExercises,
  };
};

/**
 * Custom hook để lấy chi tiết bài tập
 */
export const useExerciseDetail = (exerciseId) => {
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExerciseDetail = async () => {
    if (!exerciseId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await exercisesAPI.getExerciseDetail(exerciseId);
      setExercise(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExerciseDetail();
  }, [exerciseId]);

  const submitExercise = async (answer) => {
    setLoading(true);
    setError(null);
    try {
      const result = await exercisesAPI.submitExercise(exerciseId, answer);
      return result;
    } catch (err) {
      setError(err.message || 'Không thể nộp bài tập');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await exercisesAPI.getExerciseResult(exerciseId);
      return result;
    } catch (err) {
      setError(err.message || 'Không thể lấy kết quả');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    exercise,
    loading,
    error,
    refetch: fetchExerciseDetail,
    submitExercise,
    getResult,
  };
};
