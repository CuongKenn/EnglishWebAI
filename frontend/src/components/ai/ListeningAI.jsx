import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Headphones, Play, Pause, RotateCcw, Volume2, CheckCircle2, RefreshCw } from "lucide-react";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import { getListeningLesson, submitListeningAnswers } from "../../services/aiService";

export function ListeningAI() {
  const [selectedLevel, setSelectedLevel] = useState("intermediate");
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState([1]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);

  // Load lesson khi component mount hoặc level thay đổi
  useEffect(() => {
    loadLesson(selectedLevel);
  }, [selectedLevel]);

  const loadLesson = async (level) => {
    setLoading(true);
    try {
      const data = await getListeningLesson(level);
      setLesson(data);
      setSelectedAnswers({});
      setShowAnswers(false);
      setProgress(0);
      setIsPlaying(false);
    } catch (error) {
      console.error("Error loading lesson:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
  };

  const handleSubmit = async () => {
    setShowAnswers(true);
    
    // Gửi kết quả lên server
    if (lesson && lesson.id) {
      try {
        await submitListeningAnswers(lesson.id, selectedAnswers);
      } catch (error) {
        console.error("Error submitting answers:", error);
      }
    }
  };

  const resetExercise = () => {
    loadLesson(selectedLevel);
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

      {/* Difficulty Selection */}
      <Card className="p-6">
        <p className="mb-4 font-semibold text-gray-900">Chọn cấp độ của bạn:</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => handleLevelChange("beginner")}
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
      </Card>

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
              onClick={() => setIsPlaying(!isPlaying)}
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
              onValueChange={setSpeed}
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
        )}
      </Card>

      {/* Transcript */}
      {lesson.transcript && (
        <Card className="overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-green-100 to-emerald-100 p-5">
            <h3 className="font-bold text-gray-900">📄 Script (Bản ghi âm)</h3>
            <p className="mt-1 text-sm text-gray-700">Nội dung đầy đủ của bài nghe</p>
          </div>
          <div className="p-6">
            <div className="space-y-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-inner">
              {lesson.transcript.split('\n').map((line, index) => {
                const [speaker, ...textParts] = line.split(':');
                const text = textParts.join(':').trim();
                
                if (!text) return null;
                
                const speakerColors = {
                  'Customer': 'text-green-700 font-bold',
                  'Barista': 'text-blue-700 font-bold',
                  'Waiter': 'text-purple-700 font-bold',
                  'Manager': 'text-orange-700 font-bold',
                  'Employee': 'text-indigo-700 font-bold',
                };
                
                const colorClass = speakerColors[speaker] || 'text-gray-900 font-bold';
                
                return (
                  <div key={index} className="flex gap-3">
                    <span className={colorClass}>{speaker}:</span>
                    <p className="flex-1 text-gray-900">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

