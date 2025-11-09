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
    <div className="h-full flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-blue-600" />
            AI Voice Conversation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time voice conversation with ElevenLabs AI agent
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel - Widget */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full flex flex-col items-center justify-center">
            <div ref={widgetContainerRef} className="w-full flex justify-center">
              {/* ElevenLabs Widget */}
              <elevenlabs-convai 
                agent-id="agent_3201k9mm6pj9ervtmrm012wm0t08"
              />
            </div>

            {/* Widget Info */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click the microphone button above to start conversation
              </p>
            </div>
          </Card>
        </div>

        {/* Right Panel - Instructions & Tips */}
        <div className="flex flex-col gap-6">
          
          {/* Instructions */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              How to Use
            </h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">1.</span>
                <span>Click the microphone button to start</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">2.</span>
                <span>Allow microphone access when prompted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">3.</span>
                <span>Speak naturally - the AI will respond with voice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">4.</span>
                <span>Have a conversation to practice English!</span>
              </li>
            </ol>
          </Card>

          {/* Tips */}
          <Card className="p-6 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              💡 Tips for Best Results
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Use a headset to avoid echo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Speak clearly at normal pace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Find a quiet environment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Wait for AI response before speaking again</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>Practice daily for better results</span>
              </li>
            </ul>
          </Card>

          {/* Features */}
          <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
              ✨ Features
            </h3>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Natural voice conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Real-time responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>Context-aware AI</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>English pronunciation practice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>24/7 availability</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
