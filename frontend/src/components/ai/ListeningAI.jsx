import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Headphones, Play, Pause, RotateCcw, Volume2, CheckCircle2 } from "lucide-react";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";

export function ListeningAI() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState([1]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const lesson = {
    title: "Daily Conversation at a Coffee Shop",
    level: "Intermediate",
    duration: "3:45",
    questions: [
      {
        question: "What does the customer order?",
        options: [
          "A cappuccino and a croissant",
          "A latte and a muffin",
          "An espresso and a sandwich",
          "A tea and a cookie",
        ],
        correct: 0,
      },
    ],
  };

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
        <p className="mb-3 font-medium">Chọn cấp độ của bạn:</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 border-2 p-4 hover:border-green-500 hover:bg-green-50"
          >
            <span className="text-2xl">🌱</span>
            <span className="font-medium">Beginner</span>
            <span className="text-xs text-gray-500">Người mới bắt đầu</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 border-2 border-green-500 bg-green-50 p-4"
          >
            <span className="text-2xl">🌿</span>
            <span className="font-medium">Intermediate</span>
            <span className="text-xs text-gray-500">Trung cấp</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 border-2 p-4 hover:border-green-500 hover:bg-green-50"
          >
            <span className="text-2xl">🌳</span>
            <span className="font-medium">Advanced</span>
            <span className="text-xs text-gray-500">Nâng cao</span>
          </Button>
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
        <h3 className="mb-4">📝 Câu hỏi luyện tập</h3>
        {lesson.questions.map((q, qIndex) => (
          <div key={qIndex} className="space-y-3">
            <p className="font-medium">{q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, oIndex) => (
                <button
                  key={oIndex}
                  onClick={() => {
                    setSelectedAnswer(oIndex);
                    setShowAnswer(true);
                  }}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    showAnswer && oIndex === q.correct
                      ? "border-green-500 bg-green-50"
                      : showAnswer && selectedAnswer === oIndex
                      ? "border-red-500 bg-red-50"
                      : selectedAnswer === oIndex
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showAnswer && oIndex === q.correct && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            {showAnswer && (
              <div className="rounded-lg bg-green-50 p-4 text-green-800">
                <p className="font-medium">✅ Đáp án đúng!</p>
                <p className="text-sm">
                  Bạn đã nghe và hiểu chính xác nội dung hội thoại.
                </p>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Transcript */}
      <Card className="p-6">
        <h3 className="mb-4">📄 Script (Bản ghi âm)</h3>
        <div className="space-y-3 rounded-lg bg-gray-50 p-4">
          <div className="flex gap-3">
            <span className="font-medium text-green-600">Customer:</span>
            <p className="flex-1 text-gray-700">
              Hi! I'd like a cappuccino and a croissant, please.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-blue-600">Barista:</span>
            <p className="flex-1 text-gray-700">
              Sure! Would you like that for here or to go?
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-medium text-green-600">Customer:</span>
            <p className="flex-1 text-gray-700">For here, thank you.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

