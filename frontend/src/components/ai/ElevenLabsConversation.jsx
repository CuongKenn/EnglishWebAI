import { useConversation } from "@elevenlabs/react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Radio, Mic, MicOff, Loader2, Info, Lightbulb, Sparkles, Target, CheckCircle } from "lucide-react";
import { useState } from "react";

/**
 * ElevenLabs Conversational AI - Official SDK Implementation
 * Docs: https://www.npmjs.com/package/@elevenlabs/react
 */
export function ElevenLabsConversation() {
  const [isStarting, setIsStarting] = useState(false);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log("✅ Connected to ElevenLabs");
      setIsStarting(false);
    },
    onDisconnect: () => {
      console.log("🔌 Disconnected from ElevenLabs");
    },
    onMessage: (message) => {
      console.log("💬 Message:", message);
    },
    onError: (error) => {
      console.error("❌ Error:", error);
      setIsStarting(false);
    },
    onStatusChange: (status) => {
      console.log("📊 Status:", status);
    },
  });

  const startConversation = async () => {
    setIsStarting(true);
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start conversation with public agent
      await conversation.startSession({
        agentId: "agent_3201k9mm6pj9ervtmrm012wm0t08",
        connectionType: "webrtc", // or "websocket"
      });
    } catch (error) {
      console.error("Failed to start:", error);
      alert("Không thể kết nối. Vui lòng cho phép microphone và thử lại!");
      setIsStarting(false);
    }
  };

  const endConversation = async () => {
    await conversation.endSession();
  };

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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel - Instructions */}
        <div className="lg:col-span-3">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-300 dark:border-blue-700 shadow-lg h-full">
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Hướng dẫn sử dụng
            </h3>
            <ol className="space-y-3 text-sm text-blue-900 dark:text-blue-100">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px] text-blue-600">1.</span>
                <span className="leading-relaxed">Nhấn "Bắt đầu trò chuyện"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px] text-blue-600">2.</span>
                <span className="leading-relaxed">Cho phép truy cập microphone</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px] text-blue-600">3.</span>
                <span className="leading-relaxed">Đợi AI chào đón bạn</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px] text-blue-600">4.</span>
                <span className="leading-relaxed">Nói chuyện tự nhiên bằng tiếng Anh</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px] text-blue-600">5.</span>
                <span className="leading-relaxed">AI sẽ trả lời bằng giọng nói</span>
              </li>
            </ol>

            <div className="mt-6 pt-6 border-t border-blue-300 dark:border-blue-600">
              <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Mẹo hữu ích
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Dùng tai nghe để tránh echo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Nói rõ ràng, tốc độ vừa phải</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Chọn nơi yên tĩnh</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Đợi AI nói xong rồi mới nói tiếp</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Center Panel - Main Interface */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <Card className="p-8 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl w-full max-w-2xl">
            
            {conversation.status !== "connected" ? (
              /* Not Connected State */
              <div className="flex flex-col items-center justify-center gap-8 py-12">
                
                {/* Visual Indicator */}
                <div className="relative">
                  <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isStarting 
                      ? 'bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse' 
                      : 'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
                  }`}>
                    {isStarting ? (
                      <Loader2 className="w-32 h-32 text-white animate-spin" />
                    ) : (
                      <Radio className="w-32 h-32 text-white opacity-50" />
                    )}
                  </div>
                </div>

                {/* Start Button */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {isStarting ? "Đang kết nối..." : "Sẵn sàng luyện nói?"}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {isStarting 
                      ? "Vui lòng cho phép microphone và đợi trong giây lát" 
                      : "Nhấn nút bên dưới để kết nối với AI"}
                  </p>
                  
                  <Button
                    onClick={startConversation}
                    disabled={isStarting}
                    className="px-10 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Đang kết nối...
                      </>
                    ) : (
                      <>
                        <Mic className="w-6 h-6 mr-2" />
                        Bắt đầu trò chuyện
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Connected State */
              <div className="flex flex-col items-center justify-center gap-8 py-12">
                
                {/* Active Indicator */}
                <div className="relative">
                  <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-300 ${
                    conversation.isSpeaking 
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 scale-110' 
                      : 'bg-gradient-to-br from-blue-400 to-purple-500'
                  }`}>
                    <Mic className="w-32 h-32 text-white" />
                  </div>
                  
                  {/* Pulse animation when AI speaking */}
                  {conversation.isSpeaking && (
                    <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
                  )}
                </div>

                {/* Status */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {conversation.isSpeaking ? "AI đang nói..." : "Sẵn sàng lắng nghe"}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Đang trò chuyện
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Hãy nói chuyện tự nhiên với AI
                  </p>

                  <Button
                    onClick={endConversation}
                    variant="destructive"
                    className="px-8 py-4 text-base"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    Kết thúc trò chuyện
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" /> AI sẽ tự động nhận biết khi bạn nói và trả lời
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel - Features & Benefits */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Features */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-300 dark:border-green-700 shadow-lg">
            <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Tính năng
            </h3>
            <ul className="space-y-3 text-sm text-green-900 dark:text-green-100">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="leading-relaxed">Hội thoại giọng nói tự nhiên</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="leading-relaxed">Phản hồi thời gian thực</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="leading-relaxed">AI hiểu ngữ cảnh</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="leading-relaxed">Giọng nói như người thật</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="leading-relaxed">Sẵn sàng 24/7</span>
              </li>
            </ul>
          </Card>

          {/* Benefits */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-2 border-purple-300 dark:border-purple-700 shadow-lg">
            <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Lợi ích
            </h3>
            <ul className="space-y-3 text-sm text-purple-900 dark:text-purple-100">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold text-lg">→</span>
                <span className="leading-relaxed">Cải thiện kỹ năng nghe - nói</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold text-lg">→</span>
                <span className="leading-relaxed">Tăng sự tự tin giao tiếp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold text-lg">→</span>
                <span className="leading-relaxed">Học mọi lúc mọi nơi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold text-lg">→</span>
                <span className="leading-relaxed">Không sợ mắc lỗi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold text-lg">→</span>
                <span className="leading-relaxed">Tiết kiệm chi phí</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
