import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Mic, MicOff, Video, VideoOff, RefreshCw, Send, Loader2 } from "lucide-react";
import axios from "axios";
import { useFaceAPI, detectEmotions } from "../../hooks/useFaceAPI";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Emotion to encouraging message mapping
 */
const EMOTION_MESSAGES = {
  happy: {
    label: "Tuyệt vời! 😊",
    message: "Bạn đang rất tự tin và vui vẻ!",
    color: "bg-green-500/80"
  },
  neutral: {
    label: "Bình tĩnh 😌",
    message: "Hãy thư giãn và tự tin hơn nhé!",
    color: "bg-blue-500/80"
  },
  sad: {
    label: "Đừng lo! 💪",
    message: "Hãy mỉm cười và tự tin lên bạn nhé!",
    color: "bg-yellow-500/80"
  },
  angry: {
    label: "Thư giãn 🌈",
    message: "Hít thở sâu và bình tĩnh lại nhé!",
    color: "bg-orange-500/80"
  },
  fearful: {
    label: "Cố lên! 🌟",
    message: "Đừng lo lắng, bạn làm rất tốt rồi!",
    color: "bg-purple-500/80"
  },
  disgusted: {
    label: "Thoải mái 🎯",
    message: "Hãy tập trung vào nội dung nhé!",
    color: "bg-red-500/80"
  },
  surprised: {
    label: "Bất ngờ! ✨",
    message: "Bạn đang làm tốt lắm, tiếp tục nhé!",
    color: "bg-pink-500/80"
  }
};

/**
 * AI Speaking Practice Component
 * Allows users to practice speaking with AI-generated topics
 * Includes real-time emotion detection via webcam
 */
export function AISpeakingPractice() {
  // Topic generation state
  const [options, setOptions] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("intermediate");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [duration, setDuration] = useState(2);
  const [customPrompt, setCustomPrompt] = useState("");
  const [topic, setTopic] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Camera & emotion state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionsLog, setEmotionsLog] = useState([]);

  // Face-api.js models
  const { modelsLoaded } = useFaceAPI();

  // Grading state
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const emotionLoopRef = useRef(null);
  const isAnalyzingRef = useRef(false);  // Prevent concurrent analysis

  // Load available options on mount
  useEffect(() => {
    loadOptions();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const loadOptions = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(`${API_BASE_URL}/api/v1/ai/speaking/options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOptions(response.data);
    } catch (error) {
      console.error("Error loading options:", error);
    }
  };

  const generateTopic = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/ai/speaking/generate-topic`,
        {
          level: selectedLevel,
          category: selectedCategory || null,
          duration: duration,
          custom_prompt: customPrompt || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTopic(response.data);
      setGradingResult(null); // Reset previous grading
    } catch (error) {
      console.error("Error generating topic:", error);
      alert("Failed to generate topic. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const startCamera = async () => {
    try {
      console.log('📷 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        
        console.log('⏳ Waiting for video to be ready...');
        // Wait for video metadata to load before starting detection
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video ready! Dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          // Start realtime emotion detection loop
          startEmotionDetectionLoop();
        };
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please grant permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Stop realtime emotion detection loop
    if (emotionLoopRef.current) {
      cancelAnimationFrame(emotionLoopRef.current);
      emotionLoopRef.current = null;
    }
    if (emotionIntervalRef.current) {
      clearInterval(emotionIntervalRef.current);
      emotionIntervalRef.current = null;
    }
    isAnalyzingRef.current = false;
    setIsCameraOn(false);
  };

  const startEmotionDetectionLoop = () => {
    let lastLogTime = Date.now();
    console.log('🎬 Starting emotion detection loop...');
    
    const detect = async () => {
      // Check video stream (use ref instead of state to avoid closure issues)
      if (!streamRef.current || !videoRef.current) {
        console.log('⏸️ Loop paused: no stream or video element');
        emotionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      // Check if video is ready (has dimensions)
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) {
        console.log('⏸️ Loop waiting: video dimensions not ready', video.videoWidth, video.videoHeight);
        emotionLoopRef.current = requestAnimationFrame(detect);
        return;
      }

      // Only analyze if not already analyzing (prevent queue buildup)
      if (!isAnalyzingRef.current) {
        isAnalyzingRef.current = true;
        
        // Determine if we should log this emotion (every 2 seconds)
        const now = Date.now();
        const shouldLog = (now - lastLogTime) >= 2000;
        if (shouldLog) {
          lastLogTime = now;
        }
        
        await captureAndAnalyzeEmotion(shouldLog);
        isAnalyzingRef.current = false;
      }

      // Continue loop (runs as fast as possible, but API calls are throttled)
      emotionLoopRef.current = requestAnimationFrame(detect);
    };

    // Start the loop
    emotionLoopRef.current = requestAnimationFrame(detect);
  };

  const captureAndAnalyzeEmotion = async (shouldLog = true) => {
    if (!videoRef.current || !streamRef.current) {
      if (shouldLog) console.log('⏸️ Skipping detection: camera off or video not ready');
      return;
    }

    if (!modelsLoaded) {
      if (shouldLog) console.log('⏸️ Skipping detection: models not loaded yet');
      return;
    }
    
    if (shouldLog) console.log('🔄 Running detection...');

    try {
      const video = videoRef.current;
      
      // Debug: log video state
      if (shouldLog) {
        console.log('📹 Video ready:', video.videoWidth, 'x', video.videoHeight);
      }
      
      // Use face-api.js to detect emotions locally (no backend call)
      const emotionData = await detectEmotions(video);
      
      if (!emotionData) {
        if (shouldLog) console.log('⚠️ No emotion data returned');
        return;
      }
      
      // Always update UI for realtime display
      setCurrentEmotion(emotionData);
      
      // Only log to session summary every 2 seconds (reduce memory)
      if (shouldLog) {
        console.log("💭 Emotion detected (LOCAL):", emotionData.emotion, `(${Math.round(emotionData.confidence * 100)}%)`);
        setEmotionsLog(prev => [...prev, emotionData]);
      }
    } catch (error) {
      // Log errors for debugging
      if (shouldLog) {
        console.error("❌ Error analyzing emotion:", error.message);
      }
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone access
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start camera if not already on
      if (!isCameraOn) {
        await startCamera();
      }

      mediaRecorderRef.current = new MediaRecorder(audioStream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        
        // Stop audio stream
        audioStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setEmotionsLog([]); // Reset emotions log

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Unable to access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const submitForGrading = async () => {
    if (!audioBlob || !topic) {
      alert("Please record your answer first.");
      return;
    }

    setIsGrading(true);

    try {
      const token = localStorage.getItem("access_token");

      // Step 1: Upload audio file
      const formData = new FormData();
      formData.append("file", audioBlob, "speaking.webm");
      
      const uploadResponse = await axios.post(
        `${API_BASE_URL}/api/v1/media/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - axios will set it automatically with boundary
          },
        }
      );

      const audioUrl = uploadResponse.data.url;

      // Step 2: Transcribe using Azure Speech
      const transcribeResponse = await axios.post(
        `${API_BASE_URL}/api/v1/ai/speaking/transcribe`,
        null,
        {
          params: {
            audio_path: audioUrl,
            language: "en-US",
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const transcription = transcribeResponse.data.transcription;
      const pronunciationAssessment = transcribeResponse.data.pronunciation_assessment;

      // Step 3: Get emotion summary
      let emotionSummary = null;
      if (emotionsLog.length > 0) {
        const emotionResponse = await axios.post(
          `${API_BASE_URL}/api/v1/ai/speaking/emotion/session-summary`,
          emotionsLog,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        emotionSummary = emotionResponse.data;
      }

      // Step 4: Submit for grading
      const gradingResponse = await axios.post(
        `${API_BASE_URL}/api/v1/ai/speaking/grade`,
        {
          audio_url: audioUrl,
          transcription: transcription,
          topic: topic.topic,
          questions: topic.questions,
          level: selectedLevel,
          emotion_summary: emotionSummary,
          pronunciation_assessment: pronunciationAssessment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGradingResult(gradingResponse.data);
    } catch (error) {
      console.error("Error submitting for grading:", error);
      alert("Failed to grade your speaking. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3 mb-2">
          <Mic className="w-10 h-10 text-purple-600" />
          AI Speaking Practice
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Luyện nói tiếng Anh với AI - Nhận phản hồi chi tiết
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel - Topic Generation */}
        <div className="lg:col-span-4">
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
              🎯 Tạo đề Speaking
            </h2>

            {options && (
              <div className="space-y-4">
                {/* Level Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trình độ
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(options.levels).map(([key, value]) => (
                      <option key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} - {value}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chủ đề (tùy chọn)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Ngẫu nhiên</option>
                    {options.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thời lượng: {duration} phút
                  </label>
                  <input
                    type="range"
                    min={options.duration_range.min}
                    max={options.duration_range.max}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yêu cầu đặc biệt (tùy chọn)
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ví dụ: Tập trung vào từ vựng về du lịch..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateTopic}
                  disabled={isGenerating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tạo đề...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tạo đề mới
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Generated Topic */}
            {topic && (
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-300 dark:border-purple-700">
                <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                  {topic.topic}
                </h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  {topic.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100">Câu hỏi:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-purple-800 dark:text-purple-200">
                    {topic.questions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ol>
                </div>

                {topic.key_vocabulary && topic.key_vocabulary.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">Từ vựng gợi ý:</h4>
                    <div className="flex flex-wrap gap-2">
                      {topic.key_vocabulary.map((word, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 rounded text-xs font-medium"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Center Panel - Recording & Camera */}
        <div className="lg:col-span-4">
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg h-full flex flex-col">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
              🎤 Ghi âm & Camera
            </h2>

            {/* Camera Preview */}
            <div className="mb-4 relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ display: isCameraOn ? "block" : "none" }}
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400">
                  <VideoOff className="w-16 h-16" />
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
              
              {/* Emotion Overlay - Compact Badge */}
              {currentEmotion && isCameraOn && (() => {
                const emotionKey = currentEmotion.emotion.toLowerCase();
                const emotionInfo = EMOTION_MESSAGES[emotionKey] || EMOTION_MESSAGES.neutral;
                
                return (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className={`${emotionInfo.color} backdrop-blur-md text-white px-3 py-2 rounded-full shadow-lg inline-flex items-center gap-2 max-w-fit`}>
                      <span className="text-xl">{currentEmotion.icon}</span>
                      <div className="flex flex-col">
                        <div className="font-bold text-sm leading-tight">{emotionInfo.label}</div>
                        <div className="text-xs opacity-90 leading-tight">{emotionInfo.message}</div>
                      </div>
                      <div className="text-xs opacity-75 ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                        {Math.round(currentEmotion.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Camera Controls */}
            <Button
              onClick={isCameraOn ? stopCamera : startCamera}
              variant={isCameraOn ? "destructive" : "default"}
              className="w-full mb-4"
            >
              {isCameraOn ? (
                <>
                  <VideoOff className="w-4 h-4 mr-2" />
                  Tắt camera
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Bật camera
                </>
              )}
            </Button>

            {/* Recording Controls */}
            <div className="space-y-3">
              {isRecording && (
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-red-600 animate-pulse">
                    {formatTime(recordingTime)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Đang ghi âm...</div>
                </div>
              )}

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!topic}
                variant={isRecording ? "destructive" : "default"}
                className="w-full"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Dừng ghi âm
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Bắt đầu ghi âm
                  </>
                )}
              </Button>

              {!topic && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Vui lòng tạo đề speaking trước khi ghi âm
                </p>
              )}
            </div>

            {/* Recorded Audio Player */}
            {recordedAudio && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Bản ghi âm:</h4>
                <audio src={recordedAudio} controls className="w-full" />
                
                <Button
                  onClick={submitForGrading}
                  disabled={isGrading}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGrading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang chấm điểm...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Nộp bài để chấm điểm
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel - Results & Feedback */}
        <div className="lg:col-span-4">
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-4">
              📊 Kết quả & Phản hồi
            </h2>

            {!gradingResult && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p>Hoàn thành bài nói và nộp bài để xem kết quả</p>
              </div>
            )}

            {gradingResult && gradingResult.success && (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg border-2 border-green-300 dark:border-green-700">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(gradingResult.grading.overall_score)}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Điểm tổng / 100
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="space-y-3">
                  {/* Pronunciation & Fluency */}
                  <ScoreCard
                    title="Phát âm & Lưu loát"
                    score={gradingResult.grading.pronunciation_fluency.score}
                    feedback={gradingResult.grading.pronunciation_fluency.feedback}
                    color="blue"
                  />

                  {/* Grammar & Accuracy */}
                  <ScoreCard
                    title="Ngữ pháp & Chính xác"
                    score={gradingResult.grading.grammar_accuracy.score}
                    feedback={gradingResult.grading.grammar_accuracy.feedback}
                    color="purple"
                  />

                  {/* Vocabulary */}
                  <ScoreCard
                    title="Vốn từ vựng"
                    score={gradingResult.grading.vocabulary.score}
                    feedback={gradingResult.grading.vocabulary.feedback}
                    color="orange"
                  />

                  {/* Content & Relevance */}
                  <ScoreCard
                    title="Nội dung & Liên quan"
                    score={gradingResult.grading.content_relevance.score}
                    feedback={gradingResult.grading.content_relevance.feedback}
                    color="pink"
                  />
                </div>

                {/* Overall Feedback */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💬 Nhận xét chung:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {gradingResult.grading.overall_feedback}
                  </p>
                </div>

                {/* Emotion Analysis */}
                {gradingResult.grading.emotion_analysis && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-300 dark:border-purple-700">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                      <span className="text-2xl">{gradingResult.grading.emotion_analysis.feedback}</span>
                      Phân tích cảm xúc
                    </h4>
                    <div className="text-sm text-purple-800 dark:text-purple-200">
                      <p>Cảm xúc chủ đạo: <strong>{gradingResult.grading.emotion_analysis.dominant_emotion}</strong></p>
                      <p>Độ tự tin: <strong>{Math.round(gradingResult.grading.emotion_analysis.confidence * 100)}%</strong></p>
                      <p className="mt-2 italic">{gradingResult.grading.emotion_analysis.feedback}</p>
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {gradingResult.grading.strengths && gradingResult.grading.strengths.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Điểm mạnh:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-200">
                      {gradingResult.grading.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas for Improvement */}
                {gradingResult.grading.areas_for_improvement && gradingResult.grading.areas_for_improvement.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">📈 Cần cải thiện:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-800 dark:text-orange-200">
                      {gradingResult.grading.areas_for_improvement.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {gradingResult.grading.suggested_next_steps && gradingResult.grading.suggested_next_steps.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Bước tiếp theo:</h4>
                    <ul className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      {gradingResult.grading.suggested_next_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper component for score cards
function ScoreCard({ title, score, feedback, color }) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100",
    orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100",
    pink: "bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700 text-pink-900 dark:text-pink-100",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">{title}</h4>
        <span className="text-2xl font-bold">{score}/25</span>
      </div>
      <p className="text-sm">{feedback}</p>
    </div>
  );
}
