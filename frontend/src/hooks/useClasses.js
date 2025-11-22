// hooks/useClasses.js
import { useState, useEffect } from 'react';
import { classesAPI } from '../services/api';

/**
 * Custom hook để quản lý classes
 */
export const useClasses = (params = {}) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classesAPI.getClasses(params);
      setClasses(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [JSON.stringify(params)]);

  const joinClass = async (classId) => {
    setLoading(true);
    setError(null);
    try {
      await classesAPI.joinClass(classId);
      await fetchClasses(); // Refresh list
      return true;
    } catch (err) {
      setError(err.message || 'Không thể tham gia lớp học');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveClass = async (classId) => {
    setLoading(true);
    setError(null);
    try {
      await classesAPI.leaveClass(classId);
      await fetchClasses(); // Refresh list
      return true;
    } catch (err) {
      setError(err.message || 'Không thể rời lớp học');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses,
    joinClass,
    leaveClass,
  };
};

/**
 * Custom hook để lấy danh sách lớp học của tôi
 */
export const useMyClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMyClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classesAPI.getMyClasses();
      setClasses(data);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lớp học của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []);

  return {
    classes,
    loading,
    error,
    refetch: fetchMyClasses,
  };
};

/**
 * Custom hook để lấy chi tiết lớp học
 */
export const useClassDetail = (classId) => {
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClassDetail = async () => {
    if (!classId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await classesAPI.getClassDetail(classId);
      setClassData(data);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin lớp học');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassDetail();
  }, [classId]);

  return {
    classData,
    loading,
    error,
    refetch: fetchClassDetail,
  };
};
