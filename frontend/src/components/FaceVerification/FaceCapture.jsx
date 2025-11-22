import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * FaceCapture Component
 * Captures face images using WebRTC for enrollment and verification
 */
const FaceCapture = ({ 
  onCapture, 
  onClose, 
  mode = 'verify', // 'verify' or 'enroll'
  autoCapture = false,
  captureDelay = 2000 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (autoCapture && isReady && !captured) {
      const timer = setTimeout(() => {
        handleCapture();
      }, captureDelay);
      
      // Countdown for auto-capture
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) return Math.ceil(captureDelay / 1000);
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [autoCapture, isReady, captured, captureDelay]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);

    setCaptured(true);
    
    // Stop camera after capture
    stopCamera();

    // Call parent callback
    if (onCapture) {
      onCapture(base64Image);
    }
  };

  const handleRetry = () => {
    setCaptured(false);
    setCountdown(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">
              {mode === 'enroll' ? 'Đăng ký khuôn mặt' : 'Xác minh khuôn mặt'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {mode === 'enroll' 
                    ? '📸 Hãy đảm bảo khuôn mặt của bạn nằm trong khung và có đủ ánh sáng'
                    : '🔍 Hệ thống sẽ xác minh danh tính của bạn trước khi bắt đầu bài thi'
                  }
                </p>
              </div>

              {/* Video/Canvas Container */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${captured ? 'hidden' : ''}`}
                />
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-cover ${!captured ? 'hidden' : ''}`}
                />

                {/* Countdown Overlay */}
                {countdown !== null && !captured && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="text-white text-6xl font-bold animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}

                {/* Face Guide Overlay */}
                {!captured && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-4 border-blue-500 rounded-full opacity-50" 
                         style={{ width: '60%', height: '80%' }}>
                    </div>
                  </div>
                )}

                {/* Status Indicator */}
                {isReady && !captured && !countdown && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Camera sẵn sàng</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-center gap-3">
                {captured ? (
                  <>
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Chụp lại
                    </button>
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Xác nhận
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCapture}
                    disabled={!isReady || countdown !== null}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    {countdown !== null ? `Đang chụp (${countdown}s)` : 'Chụp ảnh'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Tips */}
        <div className="px-6 pb-6">
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 Mẹo: Ngồi thẳng, nhìn vào camera và đảm bảo ánh sáng đủ</p>
            <p>🔒 Dữ liệu khuôn mặt được mã hóa và chỉ dùng để xác minh danh tính</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceCapture;
