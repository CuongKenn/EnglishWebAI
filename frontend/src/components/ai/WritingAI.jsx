import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { PenTool, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Loader2, RotateCcw, Send } from "lucide-react";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import { aiAPI, aiUsageAPI } from "../../services/api";

export function WritingAI() {
  const [text, setText] = useState("");
  const [writingType, setWritingType] = useState("general");
  const [level, setLevel] = useState("intermediate");
  const [feedback, setFeedback] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [topic, setTopic] = useState(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);

  const handleGenerateTopic = async () => {
    setIsLoadingTopic(true);
    try {
      const generatedTopic = await aiAPI.generateWritingTopic(writingType, level);
      setTopic(generatedTopic);
      setText(""); // Clear text when new topic is generated
      setFeedback(null); // Clear previous feedback
      // Log usage: generate topic
      aiUsageAPI.logUsage('writing', { action: 'generate_topic', writingType, level });
    } catch (error) {
      console.error('Failed to generate topic:', error);
      alert('Failed to generate topic. Please try again.');
    } finally {
      setIsLoadingTopic(false);
    }
  };

  const handleCheck = async () => {
    if (text.trim().length < 10) {
      alert("Please write at least 10 characters");
      return;
    }

    setIsChecking(true);
    try {
      const result = await aiAPI.checkWriting(text, writingType, level);
      setFeedback(result);
      aiUsageAPI.logUsage('writing', { action: 'check', writingType, level, length: text.length });
    } catch (error) {
      console.error('Failed to check writing:', error);
      alert('Failed to check your writing. Please try again.');
      aiUsageAPI.logUsage('writing', { action: 'check', status: 'error', writingType, level, length: text.length });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setText("");
    setFeedback(null);
    setTopic(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const writingTypes = [
    { value: "general", label: "General Writing" },
    { value: "essay", label: "Essay" },
    { value: "email", label: "Email" },
    { value: "letter", label: "Letter" },
    { value: "story", label: "Story" },
    { value: "article", label: "Article" },
  ];

  const levels = [
    { value: "beginner", label: "Beginner (A1-A2)" },
    { value: "intermediate", label: "Intermediate (B1-B2)" },
    { value: "advanced", label: "Advanced (C1-C2)" },
  ];

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-white shadow-lg">
          <PenTool className="h-5 w-5" />
          <span className="font-medium">Luyện viết AI thông minh</span>
        </div>
        <h1 className="mb-2">Luyện viết AI ✍️</h1>
        <p className="text-gray-600">
          Viết tiếng Anh và nhận phản hồi chi tiết từ AI về ngữ pháp, từ vựng và cấu trúc
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Writing Area */}
        <Card className="flex flex-col">
          <div className="border-b bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PenTool className="h-5 w-5" />
                <span className="font-medium">Your Writing</span>
              </div>
              <span className="text-sm opacity-90">
                {wordCount} words
              </span>
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Writing Type
                </label>
                <Select value={writingType} onValueChange={setWritingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {writingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Your Level
                </label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lvl) => (
                      <SelectItem key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Topic Button */}
            <div className="mb-4">
              <Button
                onClick={handleGenerateTopic}
                variant="outline"
                className="w-full border-orange-300 hover:bg-orange-50"
                disabled={isLoadingTopic || isChecking}
              >
                {isLoadingTopic ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo đề bài...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI sinh đề bài tự động
                  </>
                )}
              </Button>
            </div>

            {/* Generated Topic Card */}
            {topic && (
              <div className="mb-4 rounded-lg border-2 border-orange-200 bg-orange-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className="bg-orange-500">{writingType}</Badge>
                  <Badge variant="outline" className="border-orange-400">
                    {topic.word_count}
                  </Badge>
                </div>
                <h3 className="mb-2 font-semibold text-orange-900">{topic.title}</h3>
                <p className="mb-3 text-sm text-gray-700">{topic.prompt}</p>
                {topic.tips && topic.tips.length > 0 && (
                  <div className="border-t border-orange-200 pt-3">
                    <p className="mb-2 text-xs font-medium text-orange-800">💡 Tips:</p>
                    <ul className="space-y-1">
                      {topic.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <span className="text-orange-500">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your text in English here... (minimum 10 characters)"
              className="min-h-[300px] resize-none font-mono"
              disabled={isChecking}
            />

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleCheck}
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                disabled={isChecking || text.length < 10}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang chấm bài... (có thể mất 30-60s)
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Chấm bài AI
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isChecking}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {isChecking && (
              <div className="mt-2 flex items-center gap-2 text-sm text-orange-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI đang phân tích bài viết của bạn, vui lòng đợi...</span>
              </div>
            )}
          </div>
        </Card>

        {/* Feedback Area */}
        <Card className="flex flex-col">
          <div className="border-b bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">AI Feedback</span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {isChecking ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-orange-500" />
                  <p className="text-lg font-medium text-gray-700">AI đang phân tích...</p>
                  <p className="mt-2 text-sm">Đang kiểm tra ngữ pháp, từ vựng và cấu trúc</p>
                  <p className="mt-1 text-xs text-gray-500">(Quá trình này có thể mất 30-60 giây)</p>
                </div>
              </div>
            ) : !feedback ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <PenTool className="mx-auto mb-4 h-16 w-16 opacity-20" />
                  <p>Write something and click "Chấm bài AI"</p>
                  <p className="mt-2 text-sm">AI will analyze your writing</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="rounded-lg bg-gradient-to-br from-orange-50 to-red-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">
                      Overall Score
                    </span>
                    <span className={`text-4xl font-bold ${getScoreColor(feedback.overall_score)}`}>
                      {feedback.overall_score}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Grammar</span>
                        <span className={`font-medium ${getScoreColor(feedback.grammar_score)}`}>
                          {feedback.grammar_score}
                        </span>
                      </div>
                      <Progress value={feedback.grammar_score} className="h-2" />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Vocabulary</span>
                        <span className={`font-medium ${getScoreColor(feedback.vocabulary_score)}`}>
                          {feedback.vocabulary_score}
                        </span>
                      </div>
                      <Progress value={feedback.vocabulary_score} className="h-2" />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Structure</span>
                        <span className={`font-medium ${getScoreColor(feedback.structure_score)}`}>
                          {feedback.structure_score}
                        </span>
                      </div>
                      <Progress value={feedback.structure_score} className="h-2" />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Coherence</span>
                        <span className={`font-medium ${getScoreColor(feedback.coherence_score)}`}>
                          {feedback.coherence_score}
                        </span>
                      </div>
                      <Progress value={feedback.coherence_score} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Overall Comment */}
                <div className="rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-900">AI Comment</p>
                      <p className="mt-1 text-sm text-orange-800">{feedback.overall_comment}</p>
                    </div>
                  </div>
                </div>

                {/* Grammar Errors */}
                {feedback.grammar_errors && feedback.grammar_errors.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      Grammar Errors ({feedback.grammar_errors.length})
                    </h3>
                    <div className="space-y-3">
                      {feedback.grammar_errors.map((error, idx) => (
                        <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <div className="mb-2 flex items-start gap-2">
                            <Badge variant="destructive" className="mt-0.5">Error</Badge>
                            <span className="flex-1 text-sm line-through">{error.error}</span>
                          </div>
                          <div className="mb-2 flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                            <span className="flex-1 text-sm font-medium text-green-700">{error.correction}</span>
                          </div>
                          <p className="ml-6 text-xs text-gray-600">{error.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vocabulary Suggestions */}
                {feedback.vocabulary_suggestions && feedback.vocabulary_suggestions.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Vocabulary Improvements ({feedback.vocabulary_suggestions.length})
                    </h3>
                    <div className="space-y-3">
                      {feedback.vocabulary_suggestions.map((suggestion, idx) => (
                        <div key={idx} className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                          <div className="mb-2 flex items-center gap-2 flex-wrap">
                            <Badge className="bg-yellow-500">Original</Badge>
                            <span className="text-sm">{suggestion.original}</span>
                            <span className="text-gray-400">→</span>
                            <Badge className="bg-green-500">Better</Badge>
                            <span className="text-sm font-medium text-green-700">{suggestion.suggestion}</span>
                          </div>
                          <p className="text-xs text-gray-600">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {feedback.improvements && feedback.improvements.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {feedback.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Corrected Text */}
                {feedback.corrected_text && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Corrected Version
                    </h3>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {feedback.corrected_text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}


