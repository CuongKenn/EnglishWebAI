import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { MessageCircle, Send, Mic, Volume2, Loader2, MicOff, Globe, Film, Lightbulb, Bot, AlertTriangle } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { aiAPI, aiUsageAPI } from "../../services/api";
import { useSpeechRecognition } from "../../hooks/useMicrophone";
import { useToast } from "../../hooks/useToast";

export function ConversationAI() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: "Hello! I'm your AI English conversation partner. Let's practice English together! What would you like to talk about today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  
  const { showError } = useToast();
  const { 
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    clearTranscript
  } = useSpeechRecognition();

  // Update input text when transcript changes
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Show error toast when speech recognition fails
  useEffect(() => {
    if (speechError) {
      showError(speechError);
    }
  }, [speechError, showError]);

  // Handle microphone button click
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      setInputText('');
      startListening();
    }
  };

  // Text-to-Speech functionality
  const speak = (text, messageIndex) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      if (speakingIndex === messageIndex) {
        // If clicking the same button, stop speaking
        setSpeakingIndex(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Conversation AI is in English
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        setSpeakingIndex(null);
      };
      
      utterance.onerror = () => {
        setSpeakingIndex(null);
      };

      setSpeakingIndex(messageIndex);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt không hỗ trợ text-to-speech');
    }
  };

  const handleSend = async () => {
    if (inputText.trim() && !isLoading) {
      // Add user message
      const userMessage = {
        role: "user",
        content: inputText,
        timestamp: new Date(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      const currentMessage = inputText;
      setInputText("");
      setIsLoading(true);

      try {
        // Prepare chat history for API (exclude the current message)
        const chatHistory = messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));

        // Call AI conversation API using aiAPI
        const response = await aiAPI.sendMessage(currentMessage, chatHistory);

        // Add AI response
        const aiMessage = {
          role: "ai",
          content: response.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        // Log usage (success)
        aiUsageAPI.logUsage('conversation', {
          action: 'send',
          status: 'success',
          message_length: currentMessage.length,
        });
      } catch (error) {
        console.error('Failed to get AI response:', error);
        
        // Add error message
        const errorMessage = {
          role: "ai",
          content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);

        // Log usage (error)
        aiUsageAPI.logUsage('conversation', {
          action: 'send',
          status: 'error',
          message_length: currentMessage.length,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedTopics = [
    "Học tập và giáo dục",
    "Du lịch",
    "Ẩm thực",
    "Phim ảnh",
    "Thể thao",
    "Công việc",
  ];

  return (
    <div className="flex h-full flex-col space-y-6">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white shadow-lg">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Trò chuyện AI thông minh</span>
        </div>
        <h1 className="mb-2 flex items-center gap-2"><MessageCircle className="w-6 h-6" /> Conversation AI</h1>
        <p className="text-gray-600">
          Luyện hội thoại tiếng Anh với AI như người thật, học mọi lúc mọi nơi
        </p>
      </div>

      {/* Suggested Topics */}
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-gray-700 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Chủ đề gợi ý để bắt đầu:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedTopics.map((topic, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => setInputText(`Let's talk about ${topic}`)}
              className="hover:bg-purple-50"
            >
              {topic}
            </Button>
          ))}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarFallback className="bg-white text-purple-600">AI</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">AI Assistant</p>
              <p className="text-xs opacity-90">🟢 Online - Sẵn sàng trò chuyện</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={
                      message.role === "ai"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    }
                  >
                    {message.role === "ai" ? "AI" : "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[70%] space-y-2 ${
                    message.role === "user" ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 ${
                      message.role === "ai"
                        ? "bg-gradient-to-r from-purple-50 to-pink-50"
                        : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                    }`}
                  >
                    <p>{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 px-2 ${speakingIndex === index ? 'text-red-500' : ''}`}
                      onClick={() => speak(message.content, index)}
                      title="Phát âm"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[70%]">
                  <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-gray-50 p-4">
          {!isSupported && (
            <div className="mb-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Speech recognition is not supported in this browser. Please use Chrome or Edge for voice input.</div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant={isListening ? "destructive" : "outline"}
              size="icon" 
              className="rounded-full" 
              disabled={isLoading || !isSupported}
              onClick={handleMicClick}
              title={isListening ? "Stop Listening" : "Start Voice Input"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Nhập tin nhắn bằng tiếng Anh..."}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="icon"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {isListening ? (
                <span className="text-red-500">
                  🔴 Listening... Speak in English
                  {interimTranscript && ` (${interimTranscript}...)`}
                </span>
              ) : isLoading ? (
                <span className="flex items-center gap-1"><Bot className="w-3 h-3 animate-pulse" /> AI đang suy nghĩ...</span>
              ) : (
                <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Mẹo: Nhấn Enter để gửi hoặc dùng mic để nói</span>
              )}
            </p>
            
            {isListening && (
              <Button
                variant="ghost"
                size="sm"
                onClick={stopListening}
                className="h-6 text-xs"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

