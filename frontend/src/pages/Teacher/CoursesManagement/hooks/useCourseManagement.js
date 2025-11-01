import { useState, useEffect, useMemo, useCallback } from 'react';
import { coursesAPI } from '../../../../services/api';
import { INITIAL_FORM_DATA } from '../constants';

/**
 * Custom hook for course management logic
 */
export const useCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Load courses from API
  const loadCourses = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = {};
      if (filters.skill && filters.skill !== 'all') params.skill = filters.skill;
      if (filters.grade && filters.grade !== 'all') params.grade = Number(filters.grade);
      
      const data = await coursesAPI.getCourses(params);
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading courses:', error);
      setMessage({ type: 'error', text: 'Không thể tải danh sách khóa học' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset form data
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setMessage(null);
  }, []);

  // Handle thumbnail upload
  const handleThumbnailChange = useCallback((file) => {
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ảnh không được vượt quá 2MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Create course
  const createCourse = useCallback(async (data) => {
    setFormLoading(true);
    setMessage(null);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', data.title);
      formDataToSend.append('skill', data.skill);
      formDataToSend.append('level', data.level);
      formDataToSend.append('grade', data.grade);
      formDataToSend.append('description', data.description || '');
      formDataToSend.append('lessonsCount', data.lessonsCount);
      formDataToSend.append('durationHours', data.durationHours);
      
      if (data.thumbnailFile) {
        formDataToSend.append('thumbnail', data.thumbnailFile);
      }

      await coursesAPI.createCourse(formDataToSend);
      setMessage({ type: 'success', text: 'Tạo khóa học thành công!' });
      return true;
    } catch (error) {
      console.error('Error creating course:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Không thể tạo khóa học' 
      });
      return false;
    } finally {
      setFormLoading(false);
    }
  }, []);

  // Update course
  const updateCourse = useCallback(async (courseId, data) => {
    setFormLoading(true);
    setMessage(null);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', data.title);
      formDataToSend.append('skill', data.skill);
      formDataToSend.append('level', data.level);
      formDataToSend.append('grade', data.grade);
      formDataToSend.append('description', data.description || '');
      formDataToSend.append('lessonsCount', data.lessonsCount);
      formDataToSend.append('durationHours', data.durationHours);
      
      if (data.thumbnailFile) {
        formDataToSend.append('thumbnail', data.thumbnailFile);
      }

      await coursesAPI.updateCourse(courseId, formDataToSend);
      setMessage({ type: 'success', text: 'Cập nhật khóa học thành công!' });
      return true;
    } catch (error) {
      console.error('Error updating course:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Không thể cập nhật khóa học' 
      });
      return false;
    } finally {
      setFormLoading(false);
    }
  }, []);

  // Delete course
  const deleteCourse = useCallback(async (courseId) => {
    try {
      await coursesAPI.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      setMessage({ 
        type: 'error', 
        text: 'Không thể xóa khóa học' 
      });
      return false;
    }
  }, []);

  return {
    // State
    courses,
    loading,
    formData,
    formLoading,
    message,
    
    // Actions
    loadCourses,
    resetForm,
    handleThumbnailChange,
    createCourse,
    updateCourse,
    deleteCourse,
    setFormData,
    setMessage,
    setCourses,
  };
};
