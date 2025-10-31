import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Headphones, Play, Pause, RotateCcw, Volume2, CheckCircle2, RefreshCw } from "lucide-react";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import { getListeningLesson, submitListeningAnswers } from "../../services/aiService";
import { aiUsageAPI } from "../../services/api";

export function ListeningAI() {
  const [selectedLevel, setSelectedLevel] = useState("intermediate");
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState([1]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [showOptionsForm, setShowOptionsForm] = useState(true);
  
  // Refs for text-to-speech
  const speechSynthRef = useRef(null);
  const utteranceRef = useRef(null);

  // Initialize speech synthesis and cleanup
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      // Cancel any ongoing speech when component mounts
      speechSynthRef.current.cancel();
    }
    
    // Handle page reload/close - stop speech
    const handleBeforeUnload = () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup when component unmounts or page reloads
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      setIsPlaying(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Stop speech when component unmounts or lesson changes
  useEffect(() => {
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      setIsPlaying(false);
      setProgress(0);
    };
  }, [lesson]);

  const loadLesson = async (level) => {
    // Stop any ongoing speech before loading new lesson
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    
    setLoading(true);
    setIsPlaying(false);
    setProgress(0);
    
    try {
      const data = await getListeningLesson(level);
      setLesson(data);
      setSelectedAnswers({});
      setShowAnswers(false);
      setShowOptionsForm(false);
      aiUsageAPI.logUsage('listening', { action: 'generate', level });
    } catch (error) {
      console.error("Error loading lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLesson = () => {
    loadLesson(selectedLevel);
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
  };

  const handleSubmit = async () => {
    // Stop speech when submitting
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsPlaying(false);
    
    setShowAnswers(true);
    
    // Gửi kết quả lên server
    if (lesson && lesson.id) {
      try {
        await submitListeningAnswers(lesson.id, selectedAnswers);
        aiUsageAPI.logUsage('listening', { action: 'submit', level: selectedLevel, answered: Object.keys(selectedAnswers).length });
      } catch (error) {
        console.error("Error submitting answers:", error);
      }
    }
  };

  const resetExercise = () => {
    // Stop speech completely
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsPlaying(false);
    setProgress(0);
    setSelectedAnswers({});
    setShowAnswers(false);
    setShowOptionsForm(true);
    setLesson(null);
  };

  // Toggle play/pause with text-to-speech
  const togglePlayPause = () => {
    if (!lesson) return;

    if (isPlaying) {
      // Stop playing
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      setIsPlaying(false);
    } else {
      // Start playing
      startSpeech();
    }
  };

  const startSpeech = () => {
    if (lesson.transcript && speechSynthRef.current) {
      // Get available voices
      const voices = speechSynthRef.current.getVoices();
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
      
      // Try to get male and female voices
      const femaleVoice = englishVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha'));
      const maleVoice = englishVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('daniel'));
      
      // Fallback voices
      const voice1 = femaleVoice || englishVoices[0];
      const voice2 = maleVoice || englishVoices[1] || englishVoices[0];
      
      // Check if transcript has dialogue format (Speaker: text)
      const lines = lesson.transcript.split('\n').filter(line => line.trim());
      const hasDialogue = lines.some(line => line.includes(':'));
      
      if (hasDialogue && lines.length > 1) {
        // Dialogue mode - speak line by line with different voices
        speakDialogue(lines, voice1, voice2);
      } else {
        // Monologue mode - speak as one piece
        speakMonologue(lesson.transcript, voice1);
      }
    }
  };

  const speakDialogue = (lines, voice1, voice2) => {
    let currentLineIndex = 0;
    const totalLines = lines.length;
    
    // Map speakers to voices
    const speakerVoices = {};
    const speakers = [];
    
    // Identify unique speakers
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const speaker = line.substring(0, colonIndex).trim();
        if (!speakers.includes(speaker)) {
          speakers.push(speaker);
        }
      }
    });
    
    // Assign voices to speakers (alternate between male and female)
    speakers.forEach((speaker, index) => {
      speakerVoices[speaker] = index % 2 === 0 ? voice1 : voice2;
    });
    
    const speakNextLine = () => {
      if (currentLineIndex >= totalLines) {
        setIsPlaying(false);
        setProgress(100);
        return;
      }
      
      const line = lines[currentLineIndex];
      const colonIndex = line.indexOf(':');
      
      let textToSpeak = line;
      let voice = voice1;
      
      if (colonIndex > 0) {
        const speaker = line.substring(0, colonIndex).trim();
        textToSpeak = line.substring(colonIndex + 1).trim();
        voice = speakerVoices[speaker] || voice1;
      }
      
      if (textToSpeak.trim()) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        utterance.rate = speed[0];
        utterance.volume = 1;
        utterance.voice = voice;
        
        utterance.onend = () => {
          currentLineIndex++;
          const progressPercent = (currentLineIndex / totalLines) * 100;
          setProgress(progressPercent);
          
          // Continue to next line after a short pause
          setTimeout(() => speakNextLine(), 300);
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          setIsPlaying(false);
        };
        
        speechSynthRef.current.speak(utterance);
      } else {
        currentLineIndex++;
        speakNextLine();
      }
    };
    
    setIsPlaying(true);
    speakNextLine();
  };

  const speakMonologue = (text, voice) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = speed[0];
    utterance.volume = 1;
    utterance.voice = voice;
    
    // Update progress during speech
    let words = text.split(' ');
    let currentWord = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        currentWord++;
        const progressPercent = (currentWord / words.length) * 100;
        setProgress(progressPercent);
      }
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
    };
    
    utteranceRef.current = utterance;
    speechSynthRef.current.speak(utterance);
    setIsPlaying(true);
  };
  
  // Handle speed change - restart speech with new speed
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    
    // If currently playing, restart with new speed
    if (isPlaying && speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsPlaying(false);
      // Restart after a short delay
      setTimeout(() => {
        startSpeech();
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-green-600" />
          <p className="mt-4 text-gray-600">Đang tải bài nghe...</p>
        </div>
      </div>
    );
  }

  // Show options form before generating lesson
  if (showOptionsForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white shadow-lg">
            <Headphones className="h-5 w-5" />
            <span className="font-medium">Luyện nghe AI thông minh</span>
          </div>
          <h1 className="mb-2">Luyện nghe AI 🎧</h1>
          <p className="text-gray-600">
            Cải thiện kỹ năng nghe hiểu với âm thanh tự nhiên từ AI
          </p>
        </div>

        {/* Options Form */}
        <Card className="p-6">
          <h2 className="mb-6 text-xl font-bold text-gray-900">🎯 Thiết lập bài nghe của bạn</h2>
          
          {/* Level Selection */}
          <div className="space-y-4">
            <div>
              <p className="mb-4 font-semibold text-gray-900">Chọn cấp độ của bạn:</p>
              <div className="grid gap-4 sm:grid-cols-3">
                <button
                  onClick={() => handleLevelChange("beginner")}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    selectedLevel === "beginner"
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-3xl">🌱</span>
                    <span className="font-semibold text-gray-900">Beginner</span>
                    <span className="text-xs text-gray-600">Người mới bắt đầu</span>
                  </div>
                </button>
                <button
                  onClick={() => handleLevelChange("intermediate")}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    selectedLevel === "intermediate"
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-3xl">🌿</span>
                    <span className="font-semibold text-gray-900">Intermediate</span>
                    <span className="text-xs text-gray-600">Trung cấp</span>
                  </div>
                </button>
                <button
                  onClick={() => handleLevelChange("advanced")}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    selectedLevel === "advanced"
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-3xl">🌳</span>
                    <span className="font-semibold text-gray-900">Advanced</span>
                    <span className="text-xs text-gray-600">Nâng cao</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Headphones className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">💡 Gợi ý chọn cấp độ:</p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700">
                    <li><strong>Beginner:</strong> Câu đơn giản, tốc độ chậm, chủ đề hàng ngày</li>
                    <li><strong>Intermediate:</strong> Hội thoại phức tạp hơn, tốc độ trung bình</li>
                    <li><strong>Advanced:</strong> Nội dung chuyên sâu, tốc độ nhanh, từ vựng học thuật</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleGenerateLesson}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all px-8 py-6 text-lg"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Sinh đề bài nghe
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-600">Không thể tải bài nghe. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-white shadow-lg">
          <Headphones className="h-5 w-5" />
          <span className="font-medium">Luyện nghe AI thông minh</span>
        </div>
        <h1 className="mb-2">Luyện nghe AI 🎧</h1>
        <p className="text-gray-600">
          Cải thiện kỹ năng nghe hiểu với âm thanh tự nhiên từ AI
        </p>
      </div>

      {/* Text-to-Speech Notice */}
      <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
        <div className="flex items-center gap-3">
          <Headphones className="h-5 w-5 text-blue-700" />
          <div>
            <p className="font-medium text-blue-900">🎭 Chế độ giọng đọc đa nhân vật</p>
            <p className="text-sm text-blue-700">
              Hệ thống tự động phát hiện hội thoại và sử dụng giọng nam/nữ khác nhau cho từng nhân vật.
              Nhấn nút play để trải nghiệm!
            </p>
          </div>
        </div>
      </div>

      {/* Audio Player */}
      <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-white">{lesson.title}</h2>
              <div className="flex gap-2">
                <Badge className="bg-white/20 hover:bg-white/30">
                  {lesson.level}
                </Badge>
                <Badge className="bg-white/20 hover:bg-white/30">
                  ⏱️ {lesson.duration}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <Volume2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>0:00</span>
              <span>{lesson.duration}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="ml-1 h-7 w-7" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <RotateCcw className="h-5 w-5 rotate-180" />
            </Button>
          </div>

          {/* Speed Control */}
          <div className="rounded-lg bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Tốc độ phát:</span>
              <span className="text-sm text-gray-600">{speed[0]}x</span>
            </div>
            <Slider
              value={speed}
              onValueChange={handleSpeedChange}
              min={0.5}
              max={2}
              step={0.25}
              className="w-full"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>0.5x</span>
              <span>1x</span>
              <span>1.5x</span>
              <span>2x</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 italic">
              {isPlaying ? "Đang điều chỉnh tốc độ..." : "Kéo thanh để thay đổi tốc độ"}
            </div>
          </div>
        </div>
      </Card>

      {/* Questions */}
      <Card className="p-6">
        <h3 className="mb-6 font-bold text-gray-900">📝 Câu hỏi luyện tập</h3>
        <div className="space-y-6">
          {lesson.questions.map((q, qIndex) => (
            <div key={qIndex} className="rounded-xl border-2 border-gray-200 p-4">
              <p className="mb-4 font-semibold text-gray-900">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => {
                  const isSelected = selectedAnswers[qIndex] === oIndex;
                  const isCorrect = oIndex === q.correct;
                  const showCorrection = showAnswers;

                  return (
                    <button
                      key={oIndex}
                      onClick={() => {
                        if (!showAnswers) {
                          setSelectedAnswers({ ...selectedAnswers, [qIndex]: oIndex });
                        }
                      }}
                      disabled={showAnswers}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                        showCorrection && isCorrect
                          ? "border-green-500 bg-green-50"
                          : showCorrection && isSelected && !isCorrect
                          ? "border-red-500 bg-red-50"
                          : isSelected
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{option}</span>
                        {showCorrection && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Explanation */}
              {showAnswers && q.explanation && (
                <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Giải thích:</p>
                      <p className="text-sm text-blue-800">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {!showAnswers && Object.keys(selectedAnswers).length === lesson.questions.length && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              Nộp bài và xem kết quả
            </Button>
          </div>
        )}

        {showAnswers && (
          <>
            {/* Results Summary */}
            <div className="mt-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-2 border-green-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">📊 Kết quả của bạn</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Object.keys(selectedAnswers).filter(qIndex => selectedAnswers[qIndex] === lesson.questions[qIndex].correct).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Câu đúng</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {Object.keys(selectedAnswers).filter(qIndex => selectedAnswers[qIndex] !== lesson.questions[qIndex].correct).length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Câu sai</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round((Object.keys(selectedAnswers).filter(qIndex => selectedAnswers[qIndex] === lesson.questions[qIndex].correct).length / lesson.questions.length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Điểm số</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={resetExercise}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm bài mới
              </Button>
              <Button
                onClick={() => {
                  // Stop speech when redoing exercise
                  if (speechSynthRef.current) {
                    speechSynthRef.current.cancel();
                  }
                  setSelectedAnswers({});
                  setShowAnswers(false);
                  setProgress(0);
                  setIsPlaying(false);
                }}
                variant="outline"
              >
                Làm lại bài này
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

