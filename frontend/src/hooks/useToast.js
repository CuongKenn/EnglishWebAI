import { useState } from 'react';

/**
 * Custom hook để quản lý toast notifications
 * @returns {Object} - { toast, showToast, hideToast, showSuccess, showError, showWarning, showInfo }
 */
const useToast = () => {
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'info',
    duration: 5000
  });

  const showToast = (message, type = 'info', duration = 5000) => {
    setToast({ 
      show: true, 
      message, 
      type, 
      duration 
    });
  };

  const hideToast = () => {
    setToast(prev => ({ 
      ...prev, 
      show: false 
    }));
  };

  const showSuccess = (message, duration = 5000) => showToast(message, 'success', duration);
  const showError = (message, duration = 5000) => showToast(message, 'error', duration);
  const showWarning = (message, duration = 5000) => showToast(message, 'warning', duration);
  const showInfo = (message, duration = 5000) => showToast(message, 'info', duration);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default useToast;
