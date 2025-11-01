import { Bot, Languages, MessageCircle, Headphones, PenTool, BookOpen, Layers } from "lucide-react";
import React from 'react';

export const AISidebar = React.memo(function AISidebar({ activeTab, onTabChange }) {
  const menuItems = [
    {
      id: "translate",
      icon: Languages,
      label: "Dịch bằng AI",
      gradient: "from-blue-500 to-cyan-500",
      emoji: "🌐",
    },
    {
      id: "conversation",
      icon: MessageCircle,
      label: "Conversation AI",
      gradient: "from-purple-500 to-pink-500",
      emoji: "💬",
    },
    {
      id: "listening",
      icon: Headphones,
      label: "Luyện nghe AI",
      gradient: "from-green-500 to-emerald-500",
      emoji: "🎧",
    },
    {
      id: "writing",
      icon: PenTool,
      label: "Luyện viết AI",
      gradient: "from-orange-500 to-red-500",
      emoji: "✍️",
    },
    {
      id: "reading",
      icon: BookOpen,
      label: "Luyện đọc AI",
      gradient: "from-indigo-500 to-blue-500",
      emoji: "📖",
    },
    {
      id: "flashcard",
      icon: Layers,
      label: "Flashcard AI",
      gradient: "from-pink-500 to-rose-500",
      emoji: "🎴",
    },
  ];

  return (
    <div className="flex h-full w-72 flex-col border-r border-gray-200 bg-gradient-to-b from-slate-50 to-white shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Practice
            </h2>
            <p className="text-xs text-gray-600 font-medium">Thực hành tiếng Anh</p>
          </div>
        </div>
      </div>

      {/* Menu Items - với padding thích hợp */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group relative w-full overflow-hidden rounded-xl p-3.5 text-left transition-all duration-300 ${
                  isActive
                    ? "bg-white shadow-lg scale-[1.02] border border-gray-200"
                    : "bg-white/60 hover:bg-white hover:shadow-md hover:scale-[1.01] border border-transparent"
                }`}
              >
                {/* Gradient background for active state */}
                {isActive && (
                  <div className={`absolute inset-0 bg-gradient-to-r opacity-10 ${item.gradient}`} />
                )}
                
                <div className="relative flex items-center gap-3">
                  {/* Icon with gradient */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110 ${item.gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.emoji}</span>
                      <span className={`text-sm font-semibold transition-colors ${
                        isActive ? "text-gray-900" : "text-gray-700"
                      }`}>
                        {item.label}
                      </span>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-r shadow-sm ${item.gradient}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer - Fixed Bottom với design đẹp hơn */}
      <div className="border-t border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow-md">
          <div className="flex items-start gap-2">
            <span className="text-xl">💡</span>
            <div className="flex-1">
              <p className="mb-1.5 text-sm font-bold">Mẹo học tập</p>
              <p className="text-xs leading-relaxed opacity-95">
                Học đều đặn 30 phút mỗi ngày để tiến bộ nhanh chóng!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AISidebar;