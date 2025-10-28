import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Layers, Check, X, Volume2, Star, GraduationCap, RefreshCw } from "lucide-react";
import { Progress } from "../ui/progress";
import { getFlashcards, saveFlashcardProgress } from "../../services/aiService";
import { aiUsageAPI } from "../../services/api";

export function FlashcardAI() {
  const [selectedLevel, setSelectedLevel] = useState("B1");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs for Web Speech API
  const speechSynthRef = useRef(null);

  // Initialize Web Speech API
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
    }

    // Cleanup on unmount or page reload
    const handleBeforeUnload = () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Load flashcards khi component mount
  useEffect(() => {
    loadFlashcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      // Load all levels from AI API
      const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
      const allCards = [];
      
      console.log('🔄 Loading flashcards from AI...');
      
      for (const level of levels) {
        try {
          const cards = await getFlashcards(level, 7); // 7 cards per level from AI (tổng 42 cards)
          console.log(`✅ Loaded ${cards?.length || 0} cards for level ${level}`);
          if (cards && Array.isArray(cards) && cards.length > 0) {
            allCards.push(...cards);
          }
        } catch (err) {
          console.error(`❌ Failed to load ${level} flashcards from API:`, err);
        }
      }
      
      // Use AI-generated cards
      if (allCards.length > 0) {
        console.log(`✅ Successfully loaded ${allCards.length} flashcards from AI`);
        setAllFlashcards(allCards);
        aiUsageAPI.logUsage('flashcard', { action: 'load', source: 'ai', count: allCards.length });
      } else {
        console.error("❌ AI failed to generate any flashcards. Please check backend logs.");
        alert("Không thể tải flashcards từ AI. Vui lòng kiểm tra GEMINI_API_KEY trong backend .env file.");
        aiUsageAPI.logUsage('flashcard', { action: 'load', status: 'error', source: 'none' });
      }
      
    } catch (error) {
      console.error("❌ Error loading flashcards:", error);
      alert("Lỗi khi tải flashcards: " + error.message);
      aiUsageAPI.logUsage('flashcard', { action: 'load', status: 'error', source: 'none' });
    } finally {
      setLoading(false);
    }
  };


  // ========== TEXT-TO-SPEECH FUNCTIONS ==========
  
  const speakWord = (word) => {
    if (!speechSynthRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech');
      return;
    }

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // Slower for pronunciation
    utterance.pitch = 1;

    // Get available voices
    const voices = speechSynthRef.current.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current.speak(utterance);
  };

  const speakExample = (example) => {
    if (!speechSynthRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ Text-to-Speech');
      return;
    }

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(example);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Normal speed for sentences
    utterance.pitch = 1;

    // Get available voices
    const voices = speechSynthRef.current.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current.speak(utterance);
  };

  // ========== LEVEL INFO ==========

  const levelInfo = {
    A1: {
      name: "Beginner",
      description: "Người mới bắt đầu - Từ vựng cơ bản",
      ielts: "IELTS 1-2",
      color: "from-green-400 to-emerald-500",
      emoji: "🌱",
    },
    A2: {
      name: "Elementary",
      description: "Sơ cấp - Giao tiếp đơn giản",
      ielts: "IELTS 3-3.5",
      color: "from-blue-400 to-cyan-500",
      emoji: "🌿",
    },
    B1: {
      name: "Intermediate",
      description: "Trung cấp - Giao tiếp thành thạo",
      ielts: "IELTS 4-5",
      color: "from-purple-400 to-pink-500",
      emoji: "🌸",
    },
    B2: {
      name: "Upper-Intermediate",
      description: "Trung cấp cao - Sử dụng linh hoạt",
      ielts: "IELTS 5.5-6.5",
      color: "from-orange-400 to-red-500",
      emoji: "🌺",
    },
    C1: {
      name: "Advanced",
      description: "Nâng cao - Thành thạo ngôn ngữ",
      ielts: "IELTS 7-8",
      color: "from-indigo-400 to-purple-600",
      emoji: "🌳",
    },
    C2: {
      name: "Proficiency",
      description: "Thành thục - Gần như người bản xứ",
      ielts: "IELTS 8.5-9",
      color: "from-pink-500 to-rose-600",
      emoji: "🏆",
    },
  };

  const filteredFlashcards = allFlashcards.filter(card => card.level === selectedLevel);
  const currentCard = filteredFlashcards[currentIndex];
  const progress = filteredFlashcards.length > 0 
    ? ((learned.filter(id => filteredFlashcards.some(card => card.id === id)).length) / filteredFlashcards.length) * 100 
    : 0;

  const handleNext = () => {
    // Cancel any ongoing speech
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setIsFlipped(false);
    if (currentIndex < filteredFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleKnow = async () => {
    if (currentCard && !learned.includes(currentCard.id)) {
      setLearned([...learned, currentCard.id]);
      
      // Lưu tiến độ lên server
      try {
        await saveFlashcardProgress(currentCard.id, true);
        aiUsageAPI.logUsage('flashcard', { action: 'know', level: selectedLevel });
      } catch (error) {
        console.error("Error saving progress:", error);
        aiUsageAPI.logUsage('flashcard', { action: 'know', level: selectedLevel, status: 'error' });
      }
    }
    handleNext();
  };

  const handleDontKnow = () => {
    handleNext();
  };

  const toggleFavorite = () => {
    if (!currentCard) return;
    if (favorites.includes(currentCard.id)) {
      setFavorites(favorites.filter(id => id !== currentCard.id));
    } else {
      setFavorites([...favorites, currentCard.id]);
    }
  };

  const handleLevelChange = (level) => {
    // Cancel any ongoing speech
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
    }
    setSelectedLevel(level);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-pink-600" />
          <p className="mt-4 text-gray-600">Đang tải flashcards...</p>
        </div>
      </div>
    );
  }

  // Debug info
  console.log('FlashcardAI Debug:', {
    allFlashcardsLength: allFlashcards.length,
    selectedLevel,
    filteredFlashcardsLength: filteredFlashcards.length,
    currentIndex,
    currentCard
  });

  if (!currentCard || filteredFlashcards.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Không có flashcard nào cho cấp độ {selectedLevel}
          </p>
          <p className="text-sm text-gray-600">
            Tổng số flashcards: {allFlashcards.length}
          </p>
          <Button 
            onClick={() => loadFlashcards()} 
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-white shadow-lg">
          <Layers className="h-5 w-5" />
          <span className="font-medium">Flashcard AI thông minh</span>
        </div>
        <h1 className="mb-2">Flashcard AI 🎴</h1>
        <p className="text-gray-600">
          Học từ vựng hiệu quả với hệ thống flashcard theo cấp độ CEFR & IELTS
        </p>
      </div>

      {/* AI Generation Notice */}
      <div className="rounded-lg border-2 border-purple-400 bg-purple-50 p-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-purple-700" />
          <div>
            <p className="font-medium text-purple-900">🤖 Từ vựng được sinh bởi AI</p>
            <p className="text-sm text-purple-700">
              Mỗi flashcard được Gemini AI tạo ra dựa trên chuẩn CEFR, phù hợp với từng cấp độ của bạn.
              Từ vựng được chọn lọc và giải thích rõ ràng để tối ưu quá trình học tập.
            </p>
          </div>
        </div>
      </div>

      {/* CEFR Level Selection */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
          <div className="mb-2 flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            <h2 className="text-white">Chọn cấp độ của bạn</h2>
          </div>
          <p className="text-sm opacity-90">Theo chuẩn CEFR (Common European Framework of Reference)</p>
        </div>
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(levelInfo).map((level) => {
              const info = levelInfo[level];
              const isActive = selectedLevel === level;
              const levelCards = allFlashcards.filter(card => card.level === level);
              const learnedCount = learned.filter(id => levelCards.some(card => card.id === id)).length;
              
              return (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={`relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                    isActive
                      ? "border-transparent shadow-lg scale-105"
                      : "border-gray-200 hover:border-pink-300 hover:shadow-md"
                  }`}
                >
                  {isActive && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${info.color} opacity-10`} />
                  )}
                  <div className="relative">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-3xl">{info.emoji}</span>
                      <Badge
                        className={isActive ? `bg-gradient-to-r ${info.color} text-white` : ""}
                        variant={isActive ? "default" : "outline"}
                      >
                        {level}
                      </Badge>
                    </div>
                    <h3 className="mb-1 font-bold">{info.name}</h3>
                    <p className="mb-2 text-sm text-gray-600">{info.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {info.ielts}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {levelCards.length} từ
                      </Badge>
                    </div>
                    {learnedCount > 0 && (
                      <div className="mt-2">
                        <Progress value={(learnedCount / levelCards.length) * 100} className="h-1" />
                        <p className="mt-1 text-xs text-gray-500">
                          {learnedCount}/{levelCards.length} đã học
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Current Level Info */}
      <Card className={`overflow-hidden bg-gradient-to-r ${levelInfo[selectedLevel].color}`}>
        <div className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{levelInfo[selectedLevel].emoji}</div>
              <div>
                <h3 className="mb-1 text-white">
                  Cấp độ {selectedLevel} - {levelInfo[selectedLevel].name}
                </h3>
                <p className="text-sm opacity-90">{levelInfo[selectedLevel].description}</p>
              </div>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30">
              {levelInfo[selectedLevel].ielts}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Progress */}
      <Card className="p-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium">Tiến độ học tập - Cấp độ {selectedLevel}</span>
          <span className="text-sm text-gray-600">
            {learned.filter(id => filteredFlashcards.some(card => card.id === id)).length}/{filteredFlashcards.length} từ đã học
          </span>
        </div>
        <Progress value={progress} className="h-3" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-green-50">
            ✓ {learned.filter(id => filteredFlashcards.some(card => card.id === id)).length} Đã biết
          </Badge>
          <Badge variant="outline" className="bg-orange-50">
            📚 {filteredFlashcards.length - learned.filter(id => filteredFlashcards.some(card => card.id === id)).length} Cần học
          </Badge>
          <Badge variant="outline" className="bg-pink-50">
            ⭐ {favorites.filter(id => filteredFlashcards.some(card => card.id === id)).length} Yêu thích
          </Badge>
        </div>
      </Card>

      {/* Flashcard */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl">
          <div
            className="perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative h-96 transition-transform duration-500 ${
                isFlipped ? "[transform:rotateY(180deg)]" : ""
              }`}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front of card */}
              <Card
                className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${levelInfo[selectedLevel].color} p-8 text-white shadow-2xl`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="mb-4 flex gap-2">
                  <Badge className="bg-white/20 hover:bg-white/30">
                    {currentCard.category}
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30">
                    {selectedLevel}
                  </Badge>
                </div>
                <h1 className="mb-3 text-center text-5xl text-white">
                  {currentCard.word}
                </h1>
                <p className="mb-4 text-xl text-white/80">
                  {currentCard.pronunciation}
                </p>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakWord(currentCard.word);
                  }}
                  disabled={isSpeaking}
                >
                  <Volume2 className={`mr-2 h-5 w-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  {isSpeaking ? 'Đang phát âm...' : 'Nghe phát âm'}
                </Button>
                <p className="mt-8 text-sm text-white/70">
                  👆 Nhấn để xem nghĩa
                </p>
              </Card>

              {/* Back of card */}
              <Card
                className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 p-8 text-white shadow-2xl"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <h2 className="mb-4 text-center text-3xl text-white">
                  {currentCard.meaning}
                </h2>
                <div className="mb-6 w-full rounded-lg bg-white/20 p-4 backdrop-blur-sm">
                  <p className="mb-1 text-sm text-white/80">Ví dụ:</p>
                  <p className="italic">{currentCard.example}</p>
                </div>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakExample(currentCard.example);
                  }}
                  disabled={isSpeaking}
                >
                  <Volume2 className={`mr-2 h-5 w-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  {isSpeaking ? 'Đang đọc...' : 'Nghe câu ví dụ'}
                </Button>
                <p className="mt-8 text-sm text-white/70">
                  👆 Nhấn để xem từ vựng
                </p>
              </Card>
            </div>
          </div>

          {/* Favorite Button */}
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-4 rounded-full bg-white shadow-lg"
            onClick={toggleFavorite}
          >
            <Star
              className={`h-5 w-5 ${
                favorites.includes(currentCard.id)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400"
              }`}
            />
          </Button>

          {/* Card Counter */}
          <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-medium shadow-lg">
            {currentIndex + 1} / {filteredFlashcards.length}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={handleDontKnow}
          size="lg"
          variant="outline"
          className="min-w-[150px] border-2 border-red-200 hover:border-red-500 hover:bg-red-50"
        >
          <X className="mr-2 h-5 w-5" />
          Chưa biết
        </Button>
        <Button
          onClick={handleKnow}
          size="lg"
          className="min-w-[150px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Check className="mr-2 h-5 w-5" />
          Đã biết
        </Button>
      </div>

      {/* Study Tips */}
      <Card className="overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="border-b border-pink-200 bg-gradient-to-r from-pink-100 to-rose-100 p-5">
          <h3 className="font-bold text-gray-900">💡 Lộ trình học từ vựng theo CEFR</h3>
          <p className="mt-1 text-sm text-gray-700">Các mẹo học từ vựng hiệu quả</p>
        </div>
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">📚</div>
              <div>
                <p className="font-semibold text-gray-900">A1-A2: Nền tảng</p>
                <p className="text-sm text-gray-700">500-1000 từ cơ bản</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">📖</div>
              <div>
                <p className="font-semibold text-gray-900">B1-B2: Phát triển</p>
                <p className="text-sm text-gray-700">2000-3000 từ thông dụng</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">🎓</div>
              <div>
                <p className="font-semibold text-gray-900">C1-C2: Chuyên sâu</p>
                <p className="text-sm text-gray-700">5000+ từ học thuật</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">🔄</div>
              <div>
                <p className="font-semibold text-gray-900">Ôn tập đều đặn</p>
                <p className="text-sm text-gray-700">Học 15-20 từ/ngày</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">✍️</div>
              <div>
                <p className="font-semibold text-gray-900">Tạo câu ví dụ</p>
                <p className="text-sm text-gray-700">Áp dụng vào thực tế</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-pink-200 bg-white p-4 shadow-sm">
              <div className="text-2xl">⭐</div>
              <div>
                <p className="font-semibold text-gray-900">Đánh dấu từ khó</p>
                <p className="text-sm text-gray-700">Ôn lại nhiều lần</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

