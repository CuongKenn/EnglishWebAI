import { useState } from 'react';
import { Book, Loader2, Check, X, Award, TrendingUp, Sparkles } from 'lucide-react';
import { aiAPI, aiUsageAPI } from '../../services/api';

export function ReadingAI() {
  const [level, setLevel] = useState('intermediate');
  const [readingType, setReadingType] = useState('article');
  const [topic, setTopic] = useState('');
  const [passage, setPassage] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const levels = [
    { value: 'beginner', label: 'Beginner', desc: 'A1-A2 (Người mới bắt đầu)' },
    { value: 'intermediate', label: 'Intermediate', desc: 'B1-B2 (Trung cấp)' },
    { value: 'advanced', label: 'Advanced', desc: 'C1-C2 (Nâng cao)' }
  ];

  const types = [
    { value: 'story', label: 'Story', icon: <Book className="w-4 h-4" />, desc: 'Truyện ngắn' },
    { value: 'article', label: 'Article', icon: '📰', desc: 'Bài báo' },
    { value: 'news', label: 'News', icon: '📺', desc: 'Tin tức' },
    { value: 'essay', label: 'Essay', icon: '📝', desc: 'Tiểu luận' },
    { value: 'letter', label: 'Letter', icon: '✉️', desc: 'Thư tín' }
  ];

  const handleGeneratePassage = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setPassage(null);
    setUserAnswers([]);
    setResults(null);

    try {
      const data = await aiAPI.generateReadingPassage(
        level,
        readingType,
        topic || null
      );
      
      setPassage(data);
      // Initialize answers: -1 for MC/TF, empty string for fill_blank
      const initialAnswers = data.questions.map(q => 
        q.question_format === 'fill_blank' ? '' : -1
      );
      setUserAnswers(initialAnswers);
      // Log usage: generate passage
      aiUsageAPI.logUsage('reading', { action: 'generate', level, readingType, hasTopic: !!topic });
    } catch (error) {
      console.error('Error generating passage:', error);
      alert('Không thể tạo bài đọc. Vui lòng thử lại!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    if (results) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const handleFillBlankChange = (questionIndex, value) => {
    if (results) return;
    
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const allAnswered = userAnswers.every((answer, idx) => {
      const question = passage.questions[idx];
      if (question.question_format === 'fill_blank') {
        return answer && answer.toString().trim() !== '';
      }
      return answer !== -1 && answer !== null && answer !== undefined;
    });

    if (!allAnswered) {
      alert('Vui lòng trả lời tất cả các câu hỏi!');
      return;
    }

    setIsChecking(true);

    try {
      const data = await aiAPI.checkReadingAnswers(userAnswers);
      setResults(data);
      aiUsageAPI.logUsage('reading', { action: 'submit', level, readingType, total: data?.total_questions, correct: data?.correct_answers, score: data?.score });
    } catch (error) {
      console.error('Error checking answers:', error);
      alert('Không thể chấm bài. Vui lòng thử lại!');
      aiUsageAPI.logUsage('reading', { action: 'submit', level, readingType, status: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setPassage(null);
    setUserAnswers([]);
    setResults(null);
    setTopic('');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'main_idea': '💡 Main Idea',
      'detail': '🔍 Detail',
      'inference': '🧠 Inference',
      'vocabulary': '📚 Vocabulary',
      'author_purpose': '✍️ Author\'s Purpose',
      'reference': '🔗 Reference',
      'application': '🎯 Application'
    };
    return labels[type] || '❓ Question';
  };

  const getQuestionFormatLabel = (format) => {
    const labels = {
      'multiple_choice': '🔘 Multiple Choice',
      'true_false': '✓✗ True/False',
      'fill_blank': '✏️ Fill in the Blank'
    };
    return labels[format] || '❓ Question';
  };

  const getQuestionFormatColor = (format) => {
    const colors = {
      'multiple_choice': 'bg-blue-100 text-blue-700',
      'true_false': 'bg-green-100 text-green-700',
      'fill_blank': 'bg-purple-100 text-purple-700'
    };
    return colors[format] || 'bg-gray-100 text-gray-700';
  };

  const getQuestionTypeColor = (type) => {
    const colors = {
      'main_idea': 'bg-purple-100 text-purple-700',
      'detail': 'bg-blue-100 text-blue-700',
      'inference': 'bg-green-100 text-green-700',
      'vocabulary': 'bg-yellow-100 text-yellow-700',
      'author_purpose': 'bg-pink-100 text-pink-700',
      'reference': 'bg-indigo-100 text-indigo-700',
      'application': 'bg-orange-100 text-orange-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Book className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Reading Practice
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Luyện đọc hiểu tiếng Anh với AI - Tạo đề tự động theo level
          </p>
        </div>

        {!passage && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Tạo bài đọc mới
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Chọn trình độ:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {levels.map((lvl) => (
                  <button
                    key={lvl.value}
                    onClick={() => setLevel(lvl.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      level === lvl.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{lvl.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Chọn loại bài đọc:
              </label>
              <div className="grid grid-cols-5 gap-3">
                {types.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setReadingType(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      readingType === type.value
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-2xl mb-1 flex justify-center">{type.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chủ đề cụ thể (tùy chọn):
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: technology, environment, education..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">
                Để trống để AI tự động chọn chủ đề phù hợp
              </p>
            </div>

            <button
              onClick={handleGeneratePassage}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tạo bài đọc... (30-60s)
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Tạo bài đọc AI
                </>
              )}
            </button>
          </div>
        )}

        {passage && !results && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{passage.title}</h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {passage.level}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {passage.reading_type}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm text-gray-600 mb-6">
                <span>📝 {passage.word_count} từ</span>
                <span>⏱️ ~{passage.estimated_time} phút</span>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {passage.passage}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                📋 Comprehension Questions ({passage.questions.length} câu - MC, T/F, Fill-in)
              </h3>

              <div className="space-y-6">
                {passage.questions.map((q, qIdx) => (
                  <div key={qIdx} className="border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-gray-800 flex-1">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="flex gap-2 ml-3">
                        {q.question_format && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getQuestionFormatColor(q.question_format)}`}>
                            {getQuestionFormatLabel(q.question_format)}
                          </span>
                        )}
                        {q.question_type && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getQuestionTypeColor(q.question_type)}`}>
                            {getQuestionTypeLabel(q.question_type)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Multiple Choice or True/False */}
                    {(q.question_format === 'multiple_choice' || q.question_format === 'true_false' || !q.question_format) && q.options && (
                      <div className="space-y-2">
                        {q.options.map((option, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleAnswerSelect(qIdx, oIdx)}
                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                              userAnswers[qIdx] === oIdx
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                                : 'border-gray-300 hover:border-indigo-400'
                            }`}
                          >
                            <span className="font-medium mr-2">
                              {q.question_format === 'true_false' 
                                ? (oIdx === 0 ? '✓' : '✗')
                                : String.fromCharCode(65 + oIdx) + '.'}
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Fill in the Blank */}
                    {q.question_format === 'fill_blank' && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={userAnswers[qIdx] || ''}
                          onChange={(e) => handleFillBlankChange(qIdx, e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none transition-colors text-gray-800"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Type the missing word from the passage
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isChecking || userAnswers.some(a => a === -1)}
                className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang chấm bài...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Nộp bài
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className={`rounded-2xl shadow-xl p-8 border-2 ${getScoreBgColor(results.score)}`}>
              <div className="text-center">
                <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(results.score)}`} />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Kết quả: {results.score}/100
                </h2>
                <p className="text-xl text-gray-700 mb-4">
                  Đúng {results.correct_answers}/{results.total_questions} câu
                </p>
                <p className="text-gray-600 mb-4">{results.feedback}</p>
                
                {results.level_recommendation && (
                  <div className="mt-4 p-4 bg-white rounded-xl border-2 border-current">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                    <p className="font-medium text-gray-800">{results.level_recommendation}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 border border-indigo-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Xem lại đáp án</h3>
              
              <div className="space-y-4">
                {results.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 ${
                      result.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.is_correct ? (
                        <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-semibold text-gray-800 flex-1">
                            Câu {idx + 1}: {passage.questions[idx].question}
                          </p>
                          <div className="flex gap-2 ml-3">
                            {passage.questions[idx].question_format && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getQuestionFormatColor(passage.questions[idx].question_format)}`}>
                                {getQuestionFormatLabel(passage.questions[idx].question_format)}
                              </span>
                            )}
                            {passage.questions[idx].question_type && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getQuestionTypeColor(passage.questions[idx].question_type)}`}>
                                {getQuestionTypeLabel(passage.questions[idx].question_type)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {!result.is_correct && (
                          <div className="space-y-1 text-sm mb-2">
                            {passage.questions[idx].question_format === 'fill_blank' ? (
                              <>
                                <p className="text-red-700">
                                  ❌ Bạn trả lời: <span className="font-medium">{result.user_answer}</span>
                                </p>
                                <p className="text-green-700">
                                  ✅ Đáp án đúng: <span className="font-medium">{result.correct_answer}</span>
                                </p>
                                {result.acceptable_answers && result.acceptable_answers.length > 0 && (
                                  <p className="text-blue-700">
                                    💡 Các đáp án chấp nhận: {result.acceptable_answers.join(', ')}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <p className="text-red-700">
                                  ❌ Bạn chọn: {passage.questions[idx].options && passage.questions[idx].options[result.user_answer]}
                                </p>
                                <p className="text-green-700">
                                  ✅ Đáp án đúng: {passage.questions[idx].options && passage.questions[idx].options[result.correct_answer]}
                                </p>
                              </>
                            )}
                          </div>
                        )}
                        
                        {result.is_correct && passage.questions[idx].question_format === 'fill_blank' && (
                          <p className="text-green-700 text-sm mb-2">
                            ✅ Bạn trả lời: <span className="font-medium">{result.user_answer}</span>
                          </p>
                        )}
                        
                        <p className="text-gray-600 text-sm mt-2">{result.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                Làm bài mới
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReadingAI;
