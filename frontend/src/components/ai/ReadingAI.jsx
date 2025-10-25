import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { BookOpen, Timer, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Progress } from "../ui/progress";
import { getReadingPassage, submitReadingAnswers } from "../../services/aiService";

export function ReadingAI() {
  const [selectedLevel, setSelectedLevel] = useState("advanced");
  const [passage, setPassage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [startTime, setStartTime] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Load passage khi component mount hoặc khi level thay đổi
  useEffect(() => {
    loadPassage(selectedLevel);
  }, [selectedLevel]);

  // Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          handleSubmit(); // Auto submit khi hết thời gian
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const loadPassage = async (level) => {
    setLoading(true);
    try {
      const data = await getReadingPassage(level);
      setPassage(data);
      setSelectedAnswers({});
      setShowResults(false);
      setTimeLeft(600);
      setStartTime(Date.now());
      setIsTimerRunning(true);
    } catch (error) {
      console.error("Error loading passage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (level) => {
    setSelectedLevel(level);
  };

  const handleSubmit = async () => {
    setIsTimerRunning(false);
    setShowResults(true);
    
    // Nếu có API backend, gửi kết quả lên
    if (passage && passage.id) {
      try {
        await submitReadingAnswers(passage.id, selectedAnswers);
      } catch (error) {
        console.error("Error submitting answers:", error);
      }
    }
  };

  const calculateScore = () => {
    if (!passage) return 0;
    let correct = 0;
    passage.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct) correct++;
    });
    return Math.round((correct / passage.questions.length) * 100);
  };

  const resetExercise = () => {
    loadPassage(selectedLevel);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải bài đọc...</p>
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-600">Không thể tải bài đọc. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-2 text-white shadow-lg">
          <BookOpen className="h-5 w-5" />
          <span className="font-medium">Luyện đọc AI thông minh</span>
        </div>
        <h1 className="mb-2">Luyện đọc AI 📖</h1>
        <p className="text-gray-600">
          Rèn luyện kỹ năng đọc hiểu với bài tập được AI cá nhân hóa
        </p>
      </div>

      {/* Level Selection */}
      <Card className="p-6">
        <p className="mb-4 font-semibold text-gray-900">Chọn cấp độ của bạn:</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => handleLevelChange("beginner")}
            disabled={loading}
            className={`rounded-xl border-2 p-4 transition-all ${
              selectedLevel === "beginner"
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <div className="text-center">
              <div className="mb-2 text-3xl">📘</div>
              <p className="font-semibold text-gray-900">Beginner</p>
              <p className="text-xs text-gray-600">100-150 từ</p>
            </div>
          </button>
          <button
            onClick={() => handleLevelChange("intermediate")}
            disabled={loading}
            className={`rounded-xl border-2 p-4 transition-all ${
              selectedLevel === "intermediate"
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <div className="text-center">
              <div className="mb-2 text-3xl">📗</div>
              <p className="font-semibold text-gray-900">Intermediate</p>
              <p className="text-xs text-gray-600">200-300 từ</p>
            </div>
          </button>
          <button
            onClick={() => handleLevelChange("advanced")}
            disabled={loading}
            className={`rounded-xl border-2 p-4 transition-all ${
              selectedLevel === "advanced"
                ? "border-indigo-500 bg-indigo-50 shadow-md"
                : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            <div className="text-center">
              <div className="mb-2 text-3xl">📕</div>
              <p className="font-semibold text-gray-900">Advanced</p>
              <p className="text-xs text-gray-600">300-500 từ</p>
            </div>
          </button>
        </div>
      </Card>

      {/* Reading Passage */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-white">{passage.title}</h2>
              <div className="flex gap-2">
                <Badge className="bg-white/20 hover:bg-white/30">
                  {passage.level}
                </Badge>
                <Badge className="bg-white/20 hover:bg-white/30">
                  <Timer className="mr-1 h-3 w-3" />
                  {passage.timeLimit}
                </Badge>
              </div>
            </div>
            {!showResults && (
              <div className="rounded-lg bg-white/20 px-4 py-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  <span className="font-mono text-xl">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="prose max-w-none rounded-xl bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 shadow-inner">
            {passage.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed text-gray-900 last:mb-0">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>
      </Card>

      {/* Questions */}
      <Card className="p-6">
        <h3 className="mb-6">❓ Câu hỏi đọc hiểu</h3>
        <div className="space-y-6">
          {passage.questions.map((q, qIndex) => (
            <div key={qIndex} className="rounded-lg border-2 border-gray-200 p-4">
              <p className="mb-4 font-medium">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => {
                  const isSelected = selectedAnswers[qIndex] === oIndex;
                  const isCorrect = oIndex === q.correct;
                  const showCorrection = showResults;

                  return (
                    <button
                      key={oIndex}
                      onClick={() => {
                        if (!showResults) {
                          setSelectedAnswers({ ...selectedAnswers, [qIndex]: oIndex });
                        }
                      }}
                      disabled={showResults}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                        showCorrection && isCorrect
                          ? "border-green-500 bg-green-50"
                          : showCorrection && isSelected && !isCorrect
                          ? "border-red-500 bg-red-50"
                          : isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showCorrection && isCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {showCorrection && isSelected && !isCorrect && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!showResults && (
          <div className="mt-6 text-center">
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              size="lg"
              disabled={Object.keys(selectedAnswers).length !== passage.questions.length}
            >
              Nộp bài và xem kết quả
            </Button>
          </div>
        )}
      </Card>

      {/* Results */}
      {showResults && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
            <h3 className="text-white">📊 Kết quả của bạn</h3>
          </div>
          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="mb-2 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-3xl font-bold text-white">
                {calculateScore()}%
              </div>
              <p className="text-gray-600">
                Bạn trả lời đúng {Object.entries(selectedAnswers).filter(([key, value]) => 
                  value === passage.questions[parseInt(key)].correct
                ).length}/{passage.questions.length} câu
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-indigo-50 p-4">
                <span>Độ chính xác</span>
                <span className="font-bold text-indigo-600">{calculateScore()}%</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
                <span>Thời gian hoàn thành</span>
                <span className="font-bold text-blue-600">
                  {Math.floor((600 - timeLeft) / 60)} phút {(600 - timeLeft) % 60} giây
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                onClick={resetExercise}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Làm bài mới
              </Button>
              <Button
                onClick={() => {
                  setSelectedAnswers({});
                  setShowResults(false);
                  setTimeLeft(600);
                  setStartTime(Date.now());
                  setIsTimerRunning(true);
                }}
                variant="outline"
              >
                Làm lại bài này
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

