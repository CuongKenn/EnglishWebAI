import React, { useState, useEffect } from 'react';
import { Shield, Camera, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import FaceCapture from './FaceCapture';
import api from '../../services/api';

/**
 * FaceEnrollment Component
 * Allows students to enroll their face for exam verification
 */
const FaceEnrollment = ({ onEnrollmentComplete }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [error, setError] = useState(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentDate, setEnrollmentDate] = useState(null);

  useEffect(() => {
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await api.get('/api/v1/face/enrollment-status');
      setModelsReady(response.data.models_ready || false);
      setIsEnrolled(response.data.enrolled || false);
      setEnrollmentDate(response.data.enrollment_date || null);
      
      if (response.data.enrolled) {
        setEnrollmentStatus({
          success: true,
          message: response.data.message || 'Bạn đã đăng ký khuôn mặt'
        });
      }
    } catch (err) {
      console.error('Failed to check enrollment status:', err);
      setModelsReady(false);
      setIsEnrolled(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleStartEnrollment = () => {
    setShowCamera(true);
    setError(null);
    setEnrollmentStatus(null);
  };

  const handleCapture = async (base64Image) => {
    setShowCamera(false);
    setIsEnrolling(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/face/enroll-face', {
        image: base64Image
      });

      if (response.data.success) {
        setEnrollmentStatus({
          success: true,
          message: response.data.message,
          enrollmentId: response.data.enrollment_id
        });
        
        // Reload enrollment status to update UI
        await checkEnrollmentStatus();
        
        if (onEnrollmentComplete) {
          onEnrollmentComplete(response.data);
        }
      } else {
        setError(response.data.message || 'Đăng ký khuôn mặt thất bại');
      }
    } catch (err) {
      console.error('Face enrollment error:', err);
      let errorMessage = err.response?.data?.detail || 'Có lỗi xảy ra khi đăng ký khuôn mặt';
      
      // Friendly error message if models not ready
      if (errorMessage.includes('No face detected') || errorMessage.includes('Failed to extract')) {
        errorMessage = '⚠️ Hệ thống nhận diện khuôn mặt đang được cấu hình. Tính năng này sẽ sớm khả dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.';
      }
      
      setError(errorMessage);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleClose = () => {
    setShowCamera(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Đăng ký khuôn mặt</h2>
            <p className="text-sm text-gray-600">Để xác minh danh tính khi làm bài thi</p>
          </div>
        </div>

        {/* Status Messages */}
        {isEnrolled && enrollmentDate && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Đã đăng ký khuôn mặt</p>
              <p className="text-sm text-green-700 mt-1">
                Ngày đăng ký: {new Date(enrollmentDate).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        )}

        {enrollmentStatus?.success && !isEnrolled && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Đăng ký thành công!</p>
              <p className="text-sm text-green-700 mt-1">{enrollmentStatus.message}</p>
            </div>
          </div>
        )}

        {!modelsReady && !checkingStatus && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Hệ thống đang được cấu hình</p>
              <p className="text-sm text-yellow-700 mt-1">
                Tính năng nhận diện khuôn mặt đang trong quá trình triển khai. Vui lòng quay lại sau hoặc liên hệ quản trị viên.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Lỗi</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Hướng dẫn:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>Đảm bảo khuôn mặt của bạn nằm trong khung hình</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>Ngồi ở nơi có đủ ánh sáng, tránh ngược sáng</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>Nhìn thẳng vào camera và giữ khuôn mặt bình thường</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>Hệ thống sẽ tự động chụp sau vài giây</span>
            </li>
          </ul>
        </div>

        {/* Privacy Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            🔒 <strong>Bảo mật:</strong> Dữ liệu khuôn mặt của bạn được mã hóa và chỉ được sử dụng 
            để xác minh danh tính khi làm bài thi. Chúng tôi không chia sẻ dữ liệu này với bên thứ ba.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          {checkingStatus ? (
            <button
              disabled
              className="px-8 py-3 bg-gray-300 text-gray-600 rounded-lg flex items-center gap-2 cursor-not-allowed"
            >
              <Loader className="w-5 h-5 animate-spin" />
              Đang kiểm tra...
            </button>
          ) : isEnrolling ? (
            <button
              disabled
              className="px-8 py-3 bg-gray-300 text-gray-600 rounded-lg flex items-center gap-2 cursor-not-allowed"
            >
              <Loader className="w-5 h-5 animate-spin" />
              Đang xử lý...
            </button>
          ) : (
            <button
              onClick={handleStartEnrollment}
              disabled={!modelsReady}
              className={`px-8 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                modelsReady 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Camera className="w-5 h-5" />
              {enrollmentStatus?.success ? 'Đăng ký lại' : 'Bắt đầu đăng ký'}
            </button>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <FaceCapture
          mode="enroll"
          autoCapture={true}
          captureDelay={3000}
          onCapture={handleCapture}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default FaceEnrollment;
