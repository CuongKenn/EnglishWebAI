import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import FaceCapture from './FaceCapture';
import api from '../../services/api';

/**
 * FaceVerificationGate Component
 * Verifies student identity before allowing access to exam
 */
const FaceVerificationGate = ({ onVerificationSuccess, onVerificationFailed, exerciseId }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    try {
      const response = await api.get('/api/v1/face/enrollment-status');
      setEnrollmentStatus(response.data);
      
      if (!response.data.enrolled) {
        setError('Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trong mục Hồ sơ trước khi làm bài thi.');
      }
    } catch (err) {
      console.error('Check enrollment error:', err);
      setError('Không thể kiểm tra trạng thái đăng ký khuôn mặt');
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleStartVerification = () => {
    if (!enrollmentStatus?.enrolled) {
      setError('Bạn cần đăng ký khuôn mặt trước khi làm bài thi');
      return;
    }
    
    setShowCamera(true);
    setError(null);
    setVerificationResult(null);
  };

  const handleCapture = async (base64Image) => {
    setShowCamera(false);
    setIsVerifying(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/face/verify-face', {
        image: base64Image,
        exercise_id: exerciseId
      });

      const result = {
        verified: response.data.verified,
        similarity: response.data.similarity,
        confidence: response.data.confidence,
        message: response.data.message
      };

      setVerificationResult(result);
      setAttempts(prev => prev + 1);

      if (result.verified) {
        // Success - call parent callback after short delay to show success message
        setTimeout(() => {
          if (onVerificationSuccess) {
            onVerificationSuccess(result);
          }
        }, 2000);
      } else {
        // Failed - check if max attempts reached
        if (attempts + 1 >= MAX_ATTEMPTS) {
          setError(`Đã vượt quá số lần xác minh (${MAX_ATTEMPTS} lần). Vui lòng liên hệ giáo viên.`);
          if (onVerificationFailed) {
            onVerificationFailed({
              reason: 'max_attempts_exceeded',
              attempts: attempts + 1
            });
          }
        } else {
          setError(`Xác minh thất bại. Còn ${MAX_ATTEMPTS - attempts - 1} lần thử.`);
        }
      }
    } catch (err) {
      console.error('Face verification error:', err);
      const errorMessage = err.response?.data?.detail || 'Có lỗi xảy ra khi xác minh khuôn mặt';
      setError(errorMessage);
      setAttempts(prev => prev + 1);

      if (attempts + 1 >= MAX_ATTEMPTS && onVerificationFailed) {
        onVerificationFailed({
          reason: 'verification_error',
          error: errorMessage,
          attempts: attempts + 1
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setShowCamera(false);
  };

  if (checkingEnrollment) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        <div className="text-center bg-white p-8 rounded-lg shadow-xl">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra trạng thái đăng ký...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Xác minh danh tính</h2>
          <p className="text-gray-600">
            Vui lòng xác minh khuôn mặt của bạn để bắt đầu làm bài thi
          </p>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            verificationResult.verified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {verificationResult.verified ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  verificationResult.verified ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.verified ? 'Xác minh thành công!' : 'Xác minh thất bại'}
                </p>
                <p className={`text-sm mt-1 ${
                  verificationResult.verified ? 'text-green-700' : 'text-red-700'
                }`}>
                  {verificationResult.message}
                </p>
                {verificationResult.confidence && (
                  <p className="text-sm mt-1 text-gray-600">
                    Độ tương đồng: {verificationResult.confidence}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Lỗi</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Enrollment Status */}
        {enrollmentStatus && !enrollmentStatus.enrolled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Bạn cần đăng ký khuôn mặt trong mục <strong>Hồ sơ</strong> trước khi có thể làm bài thi.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Lưu ý:</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Đảm bảo khuôn mặt của bạn được chiếu sáng tốt</li>
            <li>• Nhìn thẳng vào camera</li>
            <li>• Không đeo khẩu trang hoặc kính râm</li>
            <li>• Bạn có tối đa {MAX_ATTEMPTS} lần thử</li>
          </ul>
        </div>

        {/* Attempts Counter */}
        {attempts > 0 && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600">
              Số lần đã thử: <span className="font-semibold">{attempts}/{MAX_ATTEMPTS}</span>
            </p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          {isVerifying ? (
            <button
              disabled
              className="px-8 py-3 bg-gray-300 text-gray-600 rounded-lg flex items-center gap-2 cursor-not-allowed"
            >
              <Loader className="w-5 h-5 animate-spin" />
              Đang xác minh...
            </button>
          ) : verificationResult?.verified ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2 animate-bounce" />
              <p className="text-green-700 font-medium">Đang chuyển đến bài thi...</p>
            </div>
          ) : (
            <button
              onClick={handleStartVerification}
              disabled={!enrollmentStatus?.enrolled || attempts >= MAX_ATTEMPTS}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {attempts > 0 ? 'Thử lại' : 'Bắt đầu xác minh'}
            </button>
          )}
        </div>

        {/* Privacy Notice */}
        <p className="mt-6 text-xs text-center text-gray-500">
          🔒 Dữ liệu xác minh được mã hóa và chỉ dùng cho mục đích xác thực danh tính
        </p>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <FaceCapture
          mode="verify"
          autoCapture={true}
          captureDelay={3000}
          onCapture={handleCapture}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default FaceVerificationGate;
