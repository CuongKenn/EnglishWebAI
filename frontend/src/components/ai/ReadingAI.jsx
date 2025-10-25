import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { BookOpen, Timer, CheckCircle2, XCircle } from "lucide-react";
import { Progress } from "../ui/progress";

export function ReadingAI() {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const passage = {
    title: "The Future of Artificial Intelligence in Education",
    level: "Advanced",
    timeLimit: "10 minutes",
    content: `
      Artificial Intelligence (AI) is revolutionizing the education sector in unprecedented ways. From personalized learning experiences to automated grading systems, AI is transforming how students learn and teachers teach. 

      One of the most significant impacts of AI in education is the ability to provide personalized learning paths. Traditional classroom settings often struggle to cater to individual student needs, but AI-powered systems can analyze a student's learning style, pace, and preferences to create customized educational content. This adaptive learning approach ensures that each student receives instruction tailored to their specific requirements.

      Moreover, AI is enabling new forms of assessment and feedback. Automated grading systems can now evaluate not just multiple-choice questions but also essays and complex problem-solving tasks. These systems provide instant feedback, allowing students to learn from their mistakes immediately rather than waiting days or weeks for teacher feedback.

      However, the integration of AI in education also raises important questions about data privacy, the role of human teachers, and ensuring equal access to these technologies. As we move forward, it will be crucial to address these concerns while harnessing the benefits of AI to create more effective and inclusive educational environments.
    `,
    questions: [
      {
        question: "What is the main idea of the passage?",
        options: [
          "AI is replacing human teachers in classrooms",
          "AI is transforming education through personalization and automation",
          "Traditional education is better than AI-powered learning",
          "AI can only grade multiple-choice questions",
        ],
        correct: 1,
      },
      {
        question: "According to the passage, how does AI help with personalized learning?",
        options: [
          "By creating the same content for all students",
          "By analyzing student learning styles and creating customized content",
          "By replacing teachers with robots",
          "By making classes smaller",
        ],
        correct: 1,
      },
      {
        question: "What concern about AI in education is mentioned in the passage?",
        options: [
          "AI is too expensive",
          "AI makes learning too easy",
          "Questions about data privacy and equal access",
          "AI cannot understand human language",
        ],
        correct: 2,
      },
    ],
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    passage.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct) correct++;
    });
    return (correct / passage.questions.length) * 100;
  };

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
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-2 p-4 hover:border-indigo-500 hover:bg-indigo-50">
          <div className="text-center">
            <div className="mb-2 text-3xl">📘</div>
            <p className="font-medium">Beginner</p>
            <p className="text-xs text-gray-500">100-150 từ</p>
          </div>
        </Card>
        <Card className="border-2 p-4 hover:border-indigo-500 hover:bg-indigo-50">
          <div className="text-center">
            <div className="mb-2 text-3xl">📗</div>
            <p className="font-medium">Intermediate</p>
            <p className="text-xs text-gray-500">200-300 từ</p>
          </div>
        </Card>
        <Card className="border-2 border-indigo-500 bg-indigo-50 p-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">📕</div>
            <p className="font-medium">Advanced</p>
            <p className="text-xs text-gray-500">300-500 từ</p>
          </div>
        </Card>
      </div>

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
          <div className="prose max-w-none rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
            {passage.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed text-gray-800 last:mb-0">
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

            <div className="mt-6 text-center">
              <Button
                onClick={() => {
                  setSelectedAnswers({});
                  setShowResults(false);
                  setTimeLeft(600);
                }}
                variant="outline"
              >
                Làm bài mới
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

