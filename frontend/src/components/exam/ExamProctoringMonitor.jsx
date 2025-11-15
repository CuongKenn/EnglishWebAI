import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Camera, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import './ExamProctoringMonitor.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ExamProctoringMonitor = ({
  submissionId,
  examId,
  onAutoSubmit,
  onWarning,
  isActive = true
}) => {
  const [sessionToken, setSessionToken] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Initializing...');
  const [warningCount, setWarningCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [lastViolation, setLastViolation] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const monitoringIntervalRef = useRef(null);
  const identityCheckIntervalRef = useRef(null);
  const lastIdentityCheckRef = useRef(null);

  // Intervals
  const BEHAVIOR_CHECK_INTERVAL = 3000; // 3 seconds
  const IDENTITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Initialize webcam
  const initializeWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraStream(stream);
      setCurrentStatus('Camera ready');
      return true;
    } catch (error) {
      console.error('Failed to access webcam:', error);
      setCurrentStatus('Camera access denied');
      if (onWarning) {
        onWarning('camera_error', 'Failed to access webcam. Please allow camera permissions.');
      }
      return false;
    }
  }, [onWarning]);

  // Capture frame from webcam
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  // Start monitoring session
  const startMonitoringSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/proctoring/start-monitoring`,
        {
          submission_id: submissionId,
          exam_id: examId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        setSessionToken(response.data.session_token);
        setCurrentStatus('Monitoring active');
        return response.data.session_token;
      }
    } catch (error) {
      console.error('Failed to start monitoring session:', error);
      setCurrentStatus('Failed to start monitoring');
      return null;
    }
  }, [submissionId, examId]);

  // Verify identity
  const verifyIdentity = useCallback(async (token) => {
    try {
      const base64Image = captureFrame();
      if (!base64Image) return;
      
      const authToken = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/proctoring/verify-identity`,
        {
          session_token: token,
          base64_image: base64Image
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      if (response.data.verified) {
        setCurrentStatus(`Identity verified (${response.data.confidence})`);
      } else {
        setCurrentStatus('Identity verification failed');
        setCriticalCount(prev => prev + 1);
        
        if (onWarning) {
          onWarning('identity_failed', response.data.error || 'Identity verification failed');
        }
        
        // Check for auto-submit
        if (response.data.auto_submit) {
          handleAutoSubmit(response.data.reason);
        }
      }
      
      lastIdentityCheckRef.current = Date.now();
    } catch (error) {
      console.error('Identity verification error:', error);
    }
  }, [captureFrame, onWarning]);

  // Monitor behavior
  const monitorBehavior = useCallback(async (token) => {
    try {
      const base64Image = captureFrame();
      if (!base64Image) return;
      
      const authToken = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/proctoring/monitor-behavior`,
        {
          session_token: token,
          base64_image: base64Image
        },
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      const data = response.data;
      
      if (!data.face_detected) {
        setCurrentStatus('⚠️ No face detected');
        setLastViolation('No face detected');
        setCriticalCount(prev => prev + 1);
        
        if (onWarning) {
          onWarning('no_face', 'No face detected in frame');
        }
      } else if (data.num_faces > 1) {
        setCurrentStatus('⚠️ Multiple faces detected');
        setLastViolation('Multiple people detected');
        setCriticalCount(prev => prev + 1);
        
        if (onWarning) {
          onWarning('multiple_faces', `Multiple faces detected (${data.num_faces})`);
        }
      } else if (data.violations && data.violations.length > 0) {
        const violationText = data.violations.join(', ');
        setCurrentStatus(`⚠️ ${violationText}`);
        setLastViolation(violationText);
        setWarningCount(prev => prev + 1);
        
        if (onWarning) {
          onWarning('behavior_violation', violationText);
        }
      } else {
        setCurrentStatus('✓ Looking at screen');
        setLastViolation(null);
      }
      
      // Check for auto-submit
      if (data.auto_submit) {
        handleAutoSubmit(data.reason);
      }
    } catch (error) {
      console.error('Behavior monitoring error:', error);
    }
  }, [captureFrame, onWarning]);

  // Handle auto-submit
  const handleAutoSubmit = useCallback((reason) => {
    setIsMonitoring(false);
    setCurrentStatus(`❌ Exam auto-submitted: ${reason}`);
    
    // Stop all monitoring
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
    }
    if (identityCheckIntervalRef.current) {
      clearInterval(identityCheckIntervalRef.current);
    }
    
    // Stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    // Notify parent component
    if (onAutoSubmit) {
      onAutoSubmit(reason);
    }
  }, [cameraStream, onAutoSubmit]);

  // Initialize monitoring
  useEffect(() => {
    if (!isActive || !submissionId || !examId) return;

    const initialize = async () => {
      // Initialize webcam
      const cameraReady = await initializeWebcam();
      if (!cameraReady) return;
      
      // Start monitoring session
      const token = await startMonitoringSession();
      if (!token) return;
      
      setIsMonitoring(true);
      
      // Initial identity verification
      await verifyIdentity(token);
      
      // Start continuous behavior monitoring
      monitoringIntervalRef.current = setInterval(() => {
        monitorBehavior(token);
      }, BEHAVIOR_CHECK_INTERVAL);
      
      // Start periodic identity checks
      identityCheckIntervalRef.current = setInterval(() => {
        verifyIdentity(token);
      }, IDENTITY_CHECK_INTERVAL);
    };
    
    initialize();
    
    // Cleanup
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
      if (identityCheckIntervalRef.current) {
        clearInterval(identityCheckIntervalRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, submissionId, examId]);

  // End monitoring when component unmounts
  useEffect(() => {
    return () => {
      if (sessionToken) {
        const endMonitoring = async () => {
          try {
            const token = localStorage.getItem('access_token');
            await axios.post(
              `${API_BASE_URL}/api/v1/proctoring/end-monitoring`,
              { session_token: sessionToken },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Failed to end monitoring:', error);
          }
        };
        endMonitoring();
      }
    };
  }, [sessionToken]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="exam-proctoring-monitor">
      <div className="proctoring-header">
        <Camera size={20} />
        <h3>Exam Monitoring</h3>
        {isMonitoring && (
          <span className="status-indicator active">
            <Loader size={16} className="spinning" />
            Active
          </span>
        )}
      </div>
      
      <div className="proctoring-content">
        {/* Camera preview */}
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {/* Status display */}
        <div className="status-display">
          <div className="status-text">{currentStatus}</div>
          
          {lastViolation && (
            <div className="violation-alert">
              <AlertTriangle size={16} />
              <span>{lastViolation}</span>
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div className="monitoring-stats">
          <div className="stat-item warning">
            <AlertTriangle size={16} />
            <span>Warnings: {warningCount}</span>
          </div>
          <div className="stat-item critical">
            <XCircle size={16} />
            <span>Critical: {criticalCount}</span>
          </div>
        </div>
      </div>
      
      <div className="proctoring-info">
        <p>
          <CheckCircle size={14} />
          Your behavior is being monitored during this exam
        </p>
        <p className="info-small">
          Please keep your face visible and look at the screen
        </p>
      </div>
    </div>
  );
};

export default ExamProctoringMonitor;
