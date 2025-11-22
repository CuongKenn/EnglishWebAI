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
  enabled = true,
  exerciseId = null, // For saving alert images
  examId = null, // For exam assessments
  submissionId = null // For linking to submission
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const isCheckingRef = useRef(false);
  const isStartingRef = useRef(false);
  
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'checking', 'verified', 'warning', 'alert'
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Start camera
  const startCamera = useCallback(async () => {
    // Don't start if already active or starting
    if (isActive || isStartingRef.current || streamRef.current) {
      console.log('Camera already active or starting, skipping...');
      return;
    }

    try {
      isStartingRef.current = true;
      setError(null);
      console.log('Starting camera...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera');
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('Got media stream:', stream);
      
      if (!videoRef.current) {
        console.error('Video ref is null');
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element chưa sẵn sàng');
      }

      const video = videoRef.current;
      video.srcObject = stream;
      streamRef.current = stream;
      
      // Wait for video to be ready
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded, playing video...');
        video.play()
          .then(() => {
            console.log('Video playing successfully');
            setIsActive(true);
            isStartingRef.current = false;
            if (onStatusChange) {
              onStatusChange({ active: true, status: 'ready' });
            }
            // Remove event listener after success
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          })
          .catch((playErr) => {
            console.error('Error playing video:', playErr);
            setIsActive(false);
            isStartingRef.current = false;
            setError('Không thể phát video từ camera');
            if (onStatusChange) {
              onStatusChange({ active: false, status: 'error', error: 'Không thể phát video từ camera' });
            }
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          });
      };

      const handleError = (err) => {
        console.error('Video error:', err);
        setIsActive(false);
        isStartingRef.current = false;
        setError('Lỗi khi phát video từ camera');
        if (onStatusChange) {
          onStatusChange({ active: false, status: 'error', error: 'Lỗi khi phát video từ camera' });
        }
        video.removeEventListener('error', handleError);
      };
      
      // Add event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);

      // If metadata is already loaded, trigger manually
      if (video.readyState >= 1) {
        handleLoadedMetadata();
      }
    } catch (err) {
      isStartingRef.current = false;
      console.error('Camera access error:', err);
      let errorMsg = 'Không thể truy cập camera. Vui lòng kiểm tra thiết bị.';
      
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera bị từ chối. Vui lòng cho phép quyền truy cập camera.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'Không tìm thấy camera. Vui lòng kiểm tra thiết bị.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Camera không hỗ trợ cài đặt yêu cầu.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      setIsActive(false);
      if (onStatusChange) {
        onStatusChange({ active: false, status: 'error', error: errorMsg });
      }
    }
  }, [onStatusChange]);

  // Stop camera
  const stopCamera = useCallback(() => {
    isStartingRef.current = false;
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
        
        // Save alert image to backend for teacher review
        const saveAlertImage = async (alertType, alertMessage) => {
          try {
            await api.post('/api/v1/face/save-monitoring-alert', {
              image: base64Image,
              alert_type: alertType,
              exercise_id: exerciseId,
              exam_id: examId,
              submission_id: submissionId,
              message: alertMessage,
              face_count: result.face_count,
              verified: result.verified,
              similarity: result.similarity?.toString(),
              confidence: result.confidence,
              consecutive_failures: failures
            });
            console.log(`Monitoring ${alertType} image saved successfully`);
          } catch (err) {
            console.error(`Error saving ${alertType} image:`, err);
            // Don't block the flow if saving fails
          }
        };
        
        if (failures >= 3) {
          // 3 consecutive failures = alert
          setStatus('alert');
          setWarningCount(prev => prev + 1);
          
          const alertMessage = result.alert || result.warning || 'Phát hiện hành vi bất thường';
          
          // Save alert image
          saveAlertImage('alert', alertMessage);
          
          if (onAlert) {
            onAlert({
              message: alertMessage,
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
          
          const warningMessage = result.warning || 'Cảnh báo: Phát hiện vấn đề với khuôn mặt';
          
          // Save warning image
          saveAlertImage('warning', warningMessage);
          
          if (onWarning) {
            onWarning({
              message: warningMessage,
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
  }, [consecutiveFailures, onWarning, onAlert, onStatusChange, exerciseId, examId, submissionId]);

  // Start/stop camera when enabled changes
  useEffect(() => {
    if (!enabled) {
      stopCamera();
      return;
    }

    // Retry mechanism to ensure video element is mounted
    let retryCount = 0;
    const maxRetries = 10;
    
    const tryStartCamera = () => {
      if (!enabled) return;
      
      if (videoRef.current) {
        console.log('Video element found, starting camera...');
        startCamera();
      } else if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Video element not ready, retrying... (${retryCount}/${maxRetries})`);
        setTimeout(tryStartCamera, 200);
      } else {
        console.error('Video element not found after retries');
        setError('Không thể khởi động camera. Vui lòng tải lại trang.');
        setIsActive(false);
      }
    };

    // Start trying after a short delay
    const timer = setTimeout(tryStartCamera, 100);

    return () => {
      clearTimeout(timer);
      // Only stop camera if component is unmounting or disabled
      if (!enabled) {
        stopCamera();
      }
    };
  }, [enabled, startCamera, stopCamera]);

  // Start periodic checks when camera is active
  useEffect(() => {
    if (!enabled || !isActive) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Start periodic checks
    checkIntervalRef.current = setInterval(() => {
      if (isActive && !isCheckingRef.current) {
        captureAndCheck();
      }
    }, checkInterval);

    // Initial check after 2 seconds
    const initialCheck = setTimeout(() => {
      if (isActive && !isCheckingRef.current) {
        captureAndCheck();
      }
    }, 2000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      clearTimeout(initialCheck);
    };
  }, [enabled, isActive, captureAndCheck, checkInterval]);

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

        {/* Video preview - hiển thị camera */}
        <div className="mb-2 rounded-lg overflow-hidden bg-black relative" style={{ width: '200px', height: '150px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror effect để giống gương
              display: isActive ? 'block' : 'none'
            }}
          />
          {/* Loading/Placeholder khi camera chưa sẵn sàng */}
          {!isActive && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Camera className="w-8 h-8 mx-auto mb-1" />
                <p className="text-xs">Đang khởi động...</p>
              </div>
            </div>
          )}
          {/* Canvas for capture (hidden) */}
          <canvas 
            ref={canvasRef} 
            style={{ position: 'absolute', visibility: 'hidden', width: '1px', height: '1px' }}
          />
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

