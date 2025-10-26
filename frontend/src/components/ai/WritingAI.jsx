import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { PenTool, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Progress } from "../ui/progress";
import { getWritingPrompt, submitWriting } from "../../services/aiService";

export function WritingAI() {
  const [selectedLevel, setSelectedLevel] = useState("intermediate");
  const [selectedType, setSelectedType] = useState("essay");
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [essay, setEssay] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadPrompt();
  }, [selectedLevel, selectedType]);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const data = await getWritingPrompt(selectedLevel, selectedType);
      setTopic(data);
      setEssay("");
      setAnalyzed(false);
    } catch (error) {
      console.error("Error loading prompt:", error);
      // Fallback to mock data
      setTopic({
        title: "Technology and Education",
        prompt: "Do you agree or disagree with the following statement? Technology has made learning more accessible and effective. Use specific reasons and examples to support your answer.",
        type: "Opinion Essay",
        wordCount: "250-300 words",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (essay.trim().length < 100) return;
    
    setAnalyzing(true);
    try {
      const result = await submitWriting(topic.prompt, essay);
      setAnalysis(result);
      setAnalyzed(true);
    } catch (error) {
      console.error("Error analyzing essay:", error);
      // Fallback to mock analysis
      setAnalyzed(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const [analysis, setAnalysis] = useState({
    score: 85,
    grammar: 90,
    vocabulary: 85,
    coherence: 80,
    taskResponse: 88,
    suggestions: [
      "Excellent use of linking words and transitions",
      "Strong argumentation with relevant examples",
      "Consider adding more variety in sentence structures",
      "Good vocabulary range, but could include more academic terms",
    ],
    errors: [
      { text: "tecnology", correction: "technology", type: "spelling" },
      { text: "more easier", correction: "easier", type: "grammar" },
    ],
  });

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-orange-600" />
          <p className="mt-4 text-gray-600">Đang tải đề bài...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-600">Không thể tải đề bài. Vui lòng thử lại.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-white shadow-lg">
          <PenTool className="h-5 w-5" />
          <span className="font-medium">Luyện viết AI thông minh</span>
        </div>
        <h1 className="mb-2">Luyện viết AI ✍️</h1>
        <p className="text-gray-600">
          AI chấm bài và đưa ra phản hồi chi tiết giúp bạn cải thiện kỹ năng viết
        </p>
      </div>

      {/* Topic Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="mb-2 flex items-center gap-2">
            <Badge className="bg-white/20 hover:bg-white/30">
              {topic.type}
            </Badge>
            <Badge className="bg-white/20 hover:bg-white/30">
              📝 {topic.wordCount}
            </Badge>
          </div>
          <h2 className="mb-2 text-white">{topic.title}</h2>
          <p className="text-sm opacity-90">{topic.prompt}</p>
        </div>
      </Card>

      {/* Writing Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3>✍️ Viết bài của bạn</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {wordCount} từ
                </span>
                <div className={`h-2 w-2 rounded-full ${
                  wordCount >= 250 && wordCount <= 300
                    ? "bg-green-500"
                    : "bg-orange-500"
                }`} />
              </div>
            </div>
            <Textarea
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder="Start writing your essay here..."
              className="min-h-[400px] resize-none"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mục tiêu: 250-300 từ
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  Lưu nháp
                </Button>
                <Button
                  onClick={handleAnalyze}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  disabled={wordCount < 100 || analyzing}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Chấm bài AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 p-4">
              <h4 className="flex items-center gap-2 font-bold text-gray-900">
                💡 Mẹo viết hay
              </h4>
            </div>
            <div className="p-4">
              <ul className="space-y-2 text-sm text-gray-800">
                <li className="flex gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  <span>Lập dàn ý trước khi viết</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  <span>Sử dụng từ nối để liên kết ý</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  <span>Đưa ra ví dụ cụ thể</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-600">✓</span>
                  <span>Kiểm tra lỗi chính tả</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 p-4">
              <h4 className="flex items-center gap-2 font-bold text-gray-900">
                📚 Từ vựng gợi ý
              </h4>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {[
                  "Furthermore",
                  "Moreover",
                  "However",
                  "In addition",
                  "Consequently",
                  "Nevertheless",
                ].map((word, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer border-orange-300 bg-white text-gray-900 hover:border-orange-500 hover:bg-orange-50">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Analysis */}
      {analyzed && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
            <h2 className="mb-2 flex items-center gap-2 text-white">
              <Sparkles className="h-6 w-6" />
              Phân tích AI của bài viết
            </h2>
            <p className="text-sm opacity-90">
              Dựa trên các tiêu chí IELTS Writing
            </p>
          </div>

          <div className="p-6">
            {/* Overall Score */}
            <div className="mb-6 text-center">
              <div className="mb-2 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-3xl font-bold text-white">
                {analysis.score}
              </div>
              <p className="text-gray-600">Điểm tổng thể</p>
            </div>

            {/* Detailed Scores */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Ngữ pháp", score: analysis.grammar },
                { label: "Từ vựng", score: analysis.vocabulary },
                { label: "Mạch lạc", score: analysis.coherence },
                { label: "Hoàn thành", score: analysis.taskResponse },
              ].map((item, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-lg font-bold text-orange-600">
                      {item.score}
                    </span>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
              ))}
            </div>

            {/* Suggestions */}
            <div className="mb-6 overflow-hidden rounded-xl border-2 border-green-200 bg-green-50">
              <div className="border-b border-green-200 bg-green-100 p-4">
                <h4 className="flex items-center gap-2 font-bold text-green-900">
                  <CheckCircle2 className="h-5 w-5" />
                  Điểm mạnh
                </h4>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex gap-2 text-sm text-green-900">
                      <span className="font-bold">✓</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Errors */}
            {analysis.errors.length > 0 && (
              <div className="overflow-hidden rounded-xl border-2 border-orange-200 bg-orange-50">
                <div className="border-b border-orange-200 bg-orange-100 p-4">
                  <h4 className="flex items-center gap-2 font-bold text-orange-900">
                    <AlertCircle className="h-5 w-5" />
                    Lỗi cần sửa
                  </h4>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {analysis.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        <span className="font-mono rounded-md bg-red-200 px-2 py-1 text-red-900 line-through">
                          {error.text}
                        </span>
                        <span className="mx-2 font-bold text-gray-900">→</span>
                        <span className="font-mono rounded-md bg-green-200 px-2 py-1 text-green-900">
                          {error.correction}
                        </span>
                        <Badge variant="outline" className="ml-2 border-orange-400 text-xs text-orange-900">
                          {error.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

