import Toast from '../Toast/Toast';

/**
 * ToastContainer - Component wrapper để hiển thị Toast
 * Sử dụng với useToast hook
 */
const ToastContainer = ({ toast, onClose }) => {
  // Không hiển thị nếu không có toast hoặc không có message
  if (!toast || !toast.show || !toast.message || toast.message.trim() === '') {
    return null;
  }

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onClose={onClose || (() => {})}
    />
  );
};

export default ToastContainer;
