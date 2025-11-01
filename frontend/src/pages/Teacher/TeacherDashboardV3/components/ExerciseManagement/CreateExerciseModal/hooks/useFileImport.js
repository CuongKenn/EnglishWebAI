import { useState, useCallback } from 'react';
import examService from '../../../../../../services/examService';
import logger from '../../../../../../utils/logger';

/**
 * Custom hook for importing exercises from Word documents
 */
export const useFileImport = (showWarning, showSuccess, onClose, onCreate) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [importError, setImportError] = useState(null);
  
  const importFromWord = useCallback(async (wordFile, title, classId, testType, dueDate) => {
    if (!wordFile || !classId || !title) {
      showWarning('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    setIsProcessing(true);
    setImportError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', wordFile);
      formData.append('exam_title', title);
      formData.append('class_id', classId);
      formData.append('exam_type', testType);
      formData.append('is_published', 'false');
      if (dueDate) formData.append('end_time', dueDate);
      
      const response = await examService.uploadExamFromWord(formData);
      
      logger.debug('Word Import', 'Success:', response);
      showSuccess('✅ Import thành công! Đề thi đã được tạo.');
      
      setTimeout(() => {
        onClose();
        if (onCreate) onCreate();
      }, 1500);
      
    } catch (error) {
      logger.error('[Word Import] Error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Lỗi khi upload file Word!';
      setImportError(errorMessage);
      showWarning(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [showWarning, showSuccess, onClose, onCreate]);
  
  return { isProcessing, importError, importFromWord };
};
