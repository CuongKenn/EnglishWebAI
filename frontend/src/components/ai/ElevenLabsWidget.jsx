import { useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Radio } from "lucide-react";

/**
 * ElevenLabs Conversational AI Widget (Embedded)
 * Uses official ElevenLabs widget for voice conversation
 */
export function ElevenLabsWidget() {
  const widgetContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Load ElevenLabs widget script
    if (!scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('✅ ElevenLabs widget script loaded');
        scriptLoadedRef.current = true;
      };

      script.onerror = () => {
        console.error('❌ Failed to load ElevenLabs widget script');
      };

      document.body.appendChild(script);

      return () => {
        // Cleanup script on unmount
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        scriptLoadedRef.current = false;
      };
    }
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3 mb-2">
          <Radio className="w-10 h-10 text-blue-600" />
          AI Voice Conversation
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Thực hành giao tiếp tiếng Anh với AI thông minh
        </p>
      </div>

      {/* Main Content - Centered Layout */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel - Instructions */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Instructions */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-300 dark:border-blue-700 shadow-lg">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Hướng dẫn sử dụng
              </h3>
              <ol className="space-y-3 text-base text-blue-900 dark:text-blue-100">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl min-w-[28px] text-blue-600">1.</span>
                  <span className="leading-relaxed">Nhấn vào nút Start a call góc phải bên dưới để bắt đầu</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl min-w-[28px] text-blue-600">2.</span>
                  <span className="leading-relaxed">Cho phép truy cập microphone khi được hỏi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl min-w-[28px] text-blue-600">3.</span>
                  <span className="leading-relaxed">Nói chuyện tự nhiên - AI sẽ trả lời bằng giọng nói</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-xl min-w-[28px] text-blue-600">4.</span>
                  <span className="leading-relaxed">Thực hành hội thoại để cải thiện tiếng Anh!</span>
                </li>
              </ol>
            </Card>

            {/* Tips */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-300 dark:border-purple-700 shadow-lg">
              <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Mẹo hay
              </h3>
              <ul className="space-y-3 text-base text-purple-900 dark:text-purple-100">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl">•</span>
                  <span className="leading-relaxed">Dùng tai nghe để tránh tiếng vọng</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl">•</span>
                  <span className="leading-relaxed">Nói rõ ràng với tốc độ bình thường</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl">•</span>
                  <span className="leading-relaxed">Tìm môi trường yên tĩnh</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl">•</span>
                  <span className="leading-relaxed">Đợi AI trả lời xong rồi mới nói tiếp</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 text-xl">•</span>
                  <span className="leading-relaxed">Luyện tập hàng ngày để tiến bộ nhanh</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Center Panel - Widget */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <Card className="p-8 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl">
              <div ref={widgetContainerRef} className="flex flex-col items-center justify-center gap-6">
                {/* ElevenLabs Widget */}
                <elevenlabs-convai 
                  agent-id="agent_3201k9mm6pj9ervtmrm012wm0t08"
                />
                
                {/* Widget Info */}
                <div className="text-center">
                  <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                    👆 Nhấn vào microphone để bắt đầu
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    AI sẵn sàng trò chuyện với bạn
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Features */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Features */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-300 dark:border-green-700 shadow-lg">
              <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Tính năng
              </h3>
              <ul className="space-y-3 text-base text-green-900 dark:text-green-100">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="leading-relaxed">Hội thoại giọng nói tự nhiên</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="leading-relaxed">Phản hồi thời gian thực</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="leading-relaxed">AI hiểu ngữ cảnh</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="leading-relaxed">Luyện phát âm tiếng Anh</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <span className="leading-relaxed">Sẵn sàng 24/7</span>
                </li>
              </ul>
            </Card>

            {/* Stats */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-2 border-orange-300 dark:border-orange-700 shadow-lg">
              <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Lợi ích
              </h3>
              <ul className="space-y-3 text-base text-orange-900 dark:text-orange-100">
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold text-xl">→</span>
                  <span className="leading-relaxed">Cải thiện kỹ năng nghe - nói</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold text-xl">→</span>
                  <span className="leading-relaxed">Tự tin giao tiếp tiếng Anh</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold text-xl">→</span>
                  <span className="leading-relaxed">Học mọi lúc, mọi nơi</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 font-bold text-xl">→</span>
                  <span className="leading-relaxed">Không lo sợ sai khi thực hành</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
