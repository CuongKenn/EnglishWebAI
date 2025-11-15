import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Loader2,
  Bot,
  User,
  Sparkles,
  Trash2,
} from 'lucide-react';
import './ChatBot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! 👋 I\'m your AI English learning assistant powered by Gemini. I can help you with grammar, vocabulary, pronunciation, and more. What would you like to learn today?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/api/v1/chatbot/chat`,
        {
          message: userMessage,
          conversation_history: messages.slice(-10), // Send last 10 messages for context
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Add bot response to chat
      setMessages([
        ...newMessages,
        { role: 'assistant', content: response.data.message },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error. Please try again or contact support if the issue persists.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Hello! 👋 I\'m your AI English learning assistant powered by Gemini. I can help you with grammar, vocabulary, pronunciation, and more. What would you like to learn today?',
      },
    ]);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="chatbot-button"
          aria-label="Open chat"
        >
          <Sparkles size={24} className="chatbot-button-icon" />
          <span className="chatbot-button-pulse"></span>
          <span className="chatbot-badge">AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <Sparkles size={20} />
              </div>
              <div className="chatbot-header-text">
                <h3 className="chatbot-title">AI Learning Assistant</h3>
                <p className="chatbot-status">
                  <span className="status-indicator"></span>
                  Powered by Gemini
                </p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                onClick={clearChat}
                className="chatbot-icon-button"
                aria-label="Clear chat"
                title="Clear conversation"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={toggleMinimize}
                className="chatbot-icon-button"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button
                onClick={toggleChat}
                className="chatbot-icon-button"
                aria-label="Close chat"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`chatbot-message ${
                      message.role === 'user' ? 'user' : 'assistant'
                    }`}
                  >
                    <div className="message-avatar">
                      {message.role === 'user' ? (
                        <User size={20} />
                      ) : (
                        <Bot size={20} />
                      )}
                    </div>
                    <div className="message-content">
                      <p>{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chatbot-message assistant">
                    <div className="message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="message-content loading">
                      <Loader2 size={20} className="spinner" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chatbot-input-container">
                <div className="chatbot-input-wrapper">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about English..."
                    className="chatbot-input"
                    rows="1"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="chatbot-send-button"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="spinner" />
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
                <div className="chatbot-footer">
                  <span className="chatbot-footer-text">
                    💡 Tip: Press Enter to send
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;
