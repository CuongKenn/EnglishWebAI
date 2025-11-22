import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Camera, XCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

/**
 * ContinuousFaceMonitor Component
 * Monitors student face continuously during exam to prevent cheating
 * Uses RetinaFace for accurate face detection
 */
const ContinuousFaceMonitor = ({ 
  onWarning, 
  onAlert, 
  onStatusChange,
  checkInterval = 5000, // Check every 5 seconds
  enabled = true 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const isCheckingRef = useRef(false);
  
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'checking', 'verified', 'warning', 'alert'
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsActive(true);
          if (onStatusChange) {
            onStatusChange({ active: true, status: 'ready' });
          }
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Camera bị từ chối. Vui lòng cho phép quyền truy cập camera.'
        : 'Không thể truy cập camera. Vui lòng kiểm tra thiết bị.';
      setError(errorMsg);
      setIsActive(false);
      if (onStatusChange) {
        onStatusChange({ active: false, status: 'error', error: errorMsg });
      }
    }
  }, [onStatusChange]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  // Capture frame and send to backend
  const captureAndCheck = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCheckingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    try {
      isCheckingRef.current = true;
      setStatus('checking');
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to backend for verification
      const response = await api.post('/api/v1/face/continuous-check', {
        image: base64Image
      });
      
      const result = response.data;
      setLastCheck(new Date());
      
      if (result.success && result.verified) {
        setStatus('verified');
        setConsecutiveFailures(0);
        if (onStatusChange) {
          onStatusChange({ 
            active: true, 
            status: 'verified', 
            similarity: result.similarity,
            confidence: result.confidence 
          });
        }
      } else {
        // Handle warnings and alerts
        const failures = consecutiveFailures + 1;
        setConsecutiveFailures(failures);
        
        if (failures >= 3) {
          // 3 consecutive failures = alert
          setStatus('alert');
          setWarningCount(prev => prev + 1);
          if (onAlert) {
            onAlert({
              message: result.alert || result.warning || 'Phát hiện hành vi bất thường',
              faceCount: result.face_count,
              verified: result.verified,
              consecutiveFailures: failures
            });
          }
          if (onStatusChange) {
            onStatusChange({ 
              active: true, 
              status: 'alert', 
              warning: result.warning,
              alert: result.alert 
            });
          }
        } else {
          // Warning
          setStatus('warning');
          setWarningCount(prev => prev + 1);
          if (onWarning) {
            onWarning({
              message: result.warning || 'Cảnh báo: Phát hiện vấn đề với khuôn mặt',
              faceCount: result.face_count,
              verified: result.verified,
              consecutiveFailures: failures
            });
          }
          if (onStatusChange) {
            onStatusChange({ 
              active: true, 
              status: 'warning', 
              warning: result.warning 
            });
          }
        }
      }
    } catch (err) {
      console.error('Face check error:', err);
      const errorMsg = err.response?.data?.detail || 'Lỗi khi kiểm tra khuôn mặt';
      setError(errorMsg);
      setStatus('error');
      if (onStatusChange) {
        onStatusChange({ active: true, status: 'error', error: errorMsg });
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, [consecutiveFailures, onWarning, onAlert, onStatusChange]);

  // Start monitoring
  useEffect(() => {
    if (!enabled) {
      stopCamera();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Start camera
    startCamera();

    // Start periodic checks
    checkIntervalRef.current = setInterval(() => {
      if (isActive && !isCheckingRef.current) {
        captureAndCheck();
      }
    }, checkInterval);

    // Initial check after 2 seconds
    const initialCheck = setTimeout(() => {
      if (isActive) {
        captureAndCheck();
      }
    }, 2000);

    return () => {
      stopCamera();
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      clearTimeout(initialCheck);
    };
  }, [enabled, isActive, startCamera, stopCamera, captureAndCheck, checkInterval]);

  // Status indicator component
  const StatusIndicator = () => {
    if (status === 'verified') {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs">Đã xác minh</span>
        </div>
      );
    } else if (status === 'checking') {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Camera className="w-4 h-4 animate-pulse" />
          <span className="text-xs">Đang kiểm tra...</span>
        </div>
      );
    } else if (status === 'warning') {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Cảnh báo</span>
        </div>
      );
    } else if (status === 'alert') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs">Báo động</span>
        </div>
      );
    } else if (status === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span className="text-xs">Lỗi</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Giám sát khuôn mặt</span>
          </div>
          <StatusIndicator />
        </div>

        {/* Video preview (hidden but needed for capture) */}
        <div className="hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full"
          />
          <canvas ref={canvasRef} />
        </div>

        {/* Status info */}
        <div className="text-xs text-gray-600 space-y-1">
          {isActive ? (
            <>
              <div>Camera: <span className="text-green-600 font-medium">Hoạt động</span></div>
              {lastCheck && (
                <div>Kiểm tra lần cuối: {new Date(lastCheck).toLocaleTimeString('vi-VN')}</div>
              )}
              {warningCount > 0 && (
                <div className="text-yellow-600">
                  Cảnh báo: {warningCount} lần
                </div>
              )}
            </>
          ) : (
            <div className="text-red-600">Camera chưa sẵn sàng</div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinuousFaceMonitor;

