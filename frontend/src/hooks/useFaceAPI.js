import { useEffect, useState, useRef } from 'react';
import * as faceapi from 'face-api.js';

/**
 * Custom hook to load face-api.js models
 * Models are loaded once and cached for the entire session
 */
export const useFaceAPI = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const loadModels = async () => {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.current || modelsLoaded) return;
      
      isLoadingRef.current = true;
      
      try {
        console.log('🔄 Loading face-api.js models...');
        setLoadingProgress(10);

        // Model paths (served from public folder)
        const MODEL_URL = '/models';

        // Load tiny face detector (fastest)
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setLoadingProgress(40);
        console.log('✅ Tiny Face Detector loaded');

        // Load expression model
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setLoadingProgress(80);
        console.log('✅ Face Expression Net loaded');

        setLoadingProgress(100);
        setModelsLoaded(true);
        console.log('✅ All models loaded successfully!');
      } catch (err) {
        console.error('❌ Error loading face-api models:', err);
        setError(err.message);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadModels();
  }, [modelsLoaded]);

  return { modelsLoaded, loadingProgress, error };
};

/**
 * Detect emotions from video element
 * @param {HTMLVideoElement} videoElement 
 * @returns {Promise<Object>} Emotion detection result
 */
export const detectEmotions = async (videoElement) => {
  if (!videoElement || !videoElement.videoWidth) {
    console.error('❌ Invalid video element:', {
      exists: !!videoElement,
      width: videoElement?.videoWidth,
      height: videoElement?.videoHeight
    });
    throw new Error('Invalid video element');
  }

  try {
    console.log('🔍 Detecting face from video:', videoElement.videoWidth, 'x', videoElement.videoHeight);
    
    // Detect face with expressions (tiny detector for speed)
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({
        inputSize: 224,  // Smaller = faster
        scoreThreshold: 0.5
      }))
      .withFaceExpressions();

    if (!detection) {
      console.log('👤 No face detected in frame');
      return {
        emotion: 'neutral',
        confidence: 0.0,
        all_emotions: {},
        face_detected: false,
        face_count: 0,
        feedback: 'No face detected. Please face the camera.',
        icon: '👤',
        color: 'gray'
      };
    }

    // Get expressions
    const expressions = detection.expressions;
    console.log('✅ Face detected! Expressions:', expressions);
    
    // Find dominant emotion
    const emotionsArray = [
      { name: 'happy', value: expressions.happy },
      { name: 'sad', value: expressions.sad },
      { name: 'angry', value: expressions.angry },
      { name: 'fearful', value: expressions.fearful },
      { name: 'disgusted', value: expressions.disgusted },
      { name: 'surprised', value: expressions.surprised },
      { name: 'neutral', value: expressions.neutral }
    ];

    const dominant = emotionsArray.reduce((prev, current) => 
      current.value > prev.value ? current : prev
    );

    // Emotion feedback mapping
    const feedbackMap = {
      happy: { message: '😊 Great! You look confident!', icon: '😊', color: 'green' },
      sad: { message: '😔 Keep your energy up!', icon: '😔', color: 'blue' },
      angry: { message: '😠 Relax and speak calmly.', icon: '😠', color: 'red' },
      fearful: { message: '😨 Don\'t be afraid!', icon: '😨', color: 'purple' },
      disgusted: { message: '😒 Maintain a positive expression.', icon: '😒', color: 'yellow' },
      surprised: { message: '😲 Great energy!', icon: '😲', color: 'orange' },
      neutral: { message: '😐 Try to be more expressive.', icon: '😐', color: 'gray' }
    };

    const feedback = feedbackMap[dominant.name] || feedbackMap.neutral;

    return {
      emotion: dominant.name,
      confidence: Math.round(dominant.value * 100) / 100,
      all_emotions: {
        happy: Math.round(expressions.happy * 100) / 100,
        sad: Math.round(expressions.sad * 100) / 100,
        angry: Math.round(expressions.angry * 100) / 100,
        fearful: Math.round(expressions.fearful * 100) / 100,
        disgusted: Math.round(expressions.disgusted * 100) / 100,
        surprised: Math.round(expressions.surprised * 100) / 100,
        neutral: Math.round(expressions.neutral * 100) / 100
      },
      face_detected: true,
      face_count: 1,
      feedback: feedback.message,
      icon: feedback.icon,
      color: feedback.color
    };

  } catch (error) {
    console.error('Error detecting emotions:', error);
    throw error;
  }
};
