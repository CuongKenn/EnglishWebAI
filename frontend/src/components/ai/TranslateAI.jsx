import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Languages, ArrowRightLeft, Volume2, Copy, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function TranslateAI() {
  const [sourceLang, setSourceLang] = useState("vi");
  const [targetLang, setTargetLang] = useState("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleTranslate = () => {
    // Mock translation
    if (sourceText.trim()) {
      setTranslatedText("This is a sample AI translation. In a real application, this would call an AI translation API.");
    }
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-white shadow-lg">
          <Languages className="h-5 w-5" />
          <span className="font-medium">Dịch thuật AI thông minh</span>
        </div>
        <h1 className="mb-2">Dịch bằng AI 🌐</h1>
        <p className="text-gray-600">
          Công nghệ AI hiện đại giúp dịch chính xác và tự nhiên như người bản xứ
        </p>
      </div>

      {/* Language Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">Từ ngôn ngữ</label>
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                <SelectItem value="en">🇬🇧 Tiếng Anh</SelectItem>
                <SelectItem value="fr">🇫🇷 Tiếng Pháp</SelectItem>
                <SelectItem value="de">🇩🇪 Tiếng Đức</SelectItem>
                <SelectItem value="ja">🇯🇵 Tiếng Nhật</SelectItem>
                <SelectItem value="ko">🇰🇷 Tiếng Hàn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapLanguages}
            className="mt-6 rounded-full"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700">Sang ngôn ngữ</label>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 Tiếng Anh</SelectItem>
                <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                <SelectItem value="fr">🇫🇷 Tiếng Pháp</SelectItem>
                <SelectItem value="de">🇩🇪 Tiếng Đức</SelectItem>
                <SelectItem value="ja">🇯🇵 Tiếng Nhật</SelectItem>
                <SelectItem value="ko">🇰🇷 Tiếng Hàn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Translation Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source Text */}
        <Card className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3>Văn bản gốc</h3>
            <Button variant="ghost" size="sm">
              <Volume2 className="mr-2 h-4 w-4" />
              Nghe
            </Button>
          </div>
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            className="min-h-[300px] resize-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {sourceText.length} ký tự
            </span>
            <Button
              onClick={handleTranslate}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Dịch ngay
            </Button>
          </div>
        </Card>

        {/* Translated Text */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3>Bản dịch AI</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Volume2 className="mr-2 h-4 w-4" />
                Nghe
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Đã sao" : "Sao chép"}
              </Button>
            </div>
          </div>
          <div className="min-h-[300px] rounded-lg bg-white p-4">
            {translatedText ? (
              <p className="text-gray-800">{translatedText}</p>
            ) : (
              <p className="text-gray-400">Bản dịch sẽ xuất hiện ở đây...</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Phrases */}
      <Card className="p-6">
        <h3 className="mb-4">💡 Cụm từ thông dụng</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Xin chào, bạn khỏe không?",
            "Tôi muốn học tiếng Anh",
            "Cảm ơn bạn rất nhiều",
            "Hẹn gặp lại",
            "Bạn có thể giúp tôi không?",
            "Tôi không hiểu",
          ].map((phrase, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start"
              onClick={() => setSourceText(phrase)}
            >
              {phrase}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

