import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card } from "../ui/card";
import { Languages, ArrowRightLeft, Volume2, Copy, Check, Loader2 } from "lucide-react";
import { aiUsageAPI } from "../../services/api";
import translationService from "../../services/translationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function TranslateAI() {
  const [sourceLang, setSourceLang] = useState("vi");
  const [targetLang, setTargetLang] = useState("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpeakingSource, setIsSpeakingSource] = useState(false);
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false);

  // Text-to-Speech function
  const speak = (text, language, setSpeakingState) => {
    if (!text || !text.trim()) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language codes to speech synthesis language codes
    const langMap = {
      'vi': 'vi-VN',
      'en': 'en-US',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'es': 'es-ES',
      'pt': 'pt-PT',
      'it': 'it-IT',
      'ru': 'ru-RU',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ar': 'ar-SA',
      'th': 'th-TH',
      'hi': 'hi-IN'
    };

    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    setSpeakingState(true);

    utterance.onend = () => {
      setSpeakingState(false);
    };

    utterance.onerror = () => {
      setSpeakingState(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeakingSource(false);
    setIsSpeakingTarget(false);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      // Call real translation API
      const result = await translationService.translate(
        sourceText,
        targetLang,
        sourceLang,
        'google'
      );
      
      if (result.success) {
        setTranslatedText(result.translated_text);
        
        // Log usage (non-blocking)
        aiUsageAPI.logUsage('translate', {
          source: sourceLang,
          target: targetLang,
          length: sourceText.length,
        });
      } else {
        setError(result.error || 'Dịch thất bại');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Không thể kết nối đến dịch vụ dịch thuật');
    } finally {
      setLoading(false);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          borderRadius: '9999px',
          background: 'linear-gradient(to right, #3b82f6, #06b6d4)',
          padding: '8px 16px',
          color: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '16px',
        }}>
          <Languages style={{ width: '20px', height: '20px' }} />
          <span style={{ fontWeight: 500 }}>Dịch thuật AI thông minh</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Dịch bằng AI 🌐</h1>
        <p style={{ color: '#6b7280' }}>
          Công nghệ AI hiện đại giúp dịch chính xác và tự nhiên như người bản xứ
        </p>
      </div>

      {/* Language Selector */}
      <Card style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Từ ngôn ngữ
            </label>
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
            style={{ marginTop: '24px', borderRadius: '9999px' }}
          >
            <ArrowRightLeft style={{ width: '16px', height: '16px' }} />
          </Button>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>
              Sang ngôn ngữ
            </label>
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
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 1fr' : '1fr',
        gap: '24px',
        alignItems: 'stretch'
      }}>
        {/* Source Text */}
        <Card style={{ 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            minHeight: '32px'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Văn bản gốc</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => isSpeakingSource ? stopSpeaking() : speak(sourceText, sourceLang, setIsSpeakingSource)}
              disabled={!sourceText.trim()}
              style={{
                background: isSpeakingSource ? 'linear-gradient(to right, #ef4444, #dc2626)' : 'transparent',
                color: isSpeakingSource ? 'white' : 'inherit'
              }}
            >
              <Volume2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              {isSpeakingSource ? 'Dừng' : 'Nghe'}
            </Button>
          </div>
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Nhập văn bản cần dịch..."
            style={{ 
              height: '380px',
              resize: 'none'
            }}
          />
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginTop: '12px',
            minHeight: '36px'
          }}>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {sourceText.length} ký tự
            </span>
            <Button
              onClick={handleTranslate}
              disabled={loading || !sourceText.trim()}
              style={{ 
                background: loading ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #0891b2)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', marginRight: '8px' }} className="animate-spin" />
                  Đang dịch...
                </>
              ) : (
                'Dịch ngay'
              )}
            </Button>
          </div>
        </Card>

        {/* Translated Text */}
        <Card style={{ 
          background: 'linear-gradient(to bottom right, #eff6ff, #ecfeff)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            minHeight: '32px'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Bản dịch AI</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => isSpeakingTarget ? stopSpeaking() : speak(translatedText, targetLang, setIsSpeakingTarget)}
                disabled={!translatedText.trim()}
                style={{
                  background: isSpeakingTarget ? 'linear-gradient(to right, #ef4444, #dc2626)' : 'transparent',
                  color: isSpeakingTarget ? 'white' : 'inherit'
                }}
              >
                <Volume2 style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                {isSpeakingTarget ? 'Dừng' : 'Nghe'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Đã sao
                  </>
                ) : (
                  <>
                    <Copy style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Sao chép
                  </>
                )}
              </Button>
            </div>
          </div>
          <div style={{ 
            height: '380px',
            borderRadius: '8px', 
            backgroundColor: 'white', 
            padding: '16px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb'
          }}>
            {error ? (
              <div style={{ 
                padding: '12px', 
                background: '#fee2e2', 
                border: '1px solid #fca5a5', 
                borderRadius: '8px',
                color: '#dc2626'
              }}>
                ⚠️ {error}
              </div>
            ) : translatedText ? (
              <p style={{ color: '#1f2937', lineHeight: '1.6', margin: 0 }}>{translatedText}</p>
            ) : (
              <p style={{ color: '#9ca3af', margin: 0 }}>Bản dịch sẽ xuất hiện ở đây...</p>
            )}
          </div>
          {/* Empty div to match source card's bottom spacing */}
          <div style={{ minHeight: '48px', marginTop: '12px' }}></div>
        </Card>
      </div>

      {/* Quick Phrases */}
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>💡 Cụm từ thông dụng</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth >= 640 ? (window.innerWidth >= 1024 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)') : '1fr',
          gap: '8px' 
        }}>
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
              onClick={() => setSourceText(phrase)}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              {phrase}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}

