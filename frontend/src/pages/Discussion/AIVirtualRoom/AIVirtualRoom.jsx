import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Mic,
  MicOff,
  Send,
  LogOut,
  Plus,
  UserPlus,
  MessageCircle,
  Bot,
  Award,
  Clock,
  TrendingUp,
  Sparkles,
  Volume2,
  VolumeX,
  Star,
  BookOpen
} from 'lucide-react';
import './AIVirtualRoom.css';
import { aiVirtualRoomAPI } from '../../../services/aiVirtualRoomService';
import authService from '../../../services/authService';

const AIVirtualRoom = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [aiTyping, setAiTyping] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiTeacherMood, setAiTeacherMood] = useState('neutral'); // neutral, happy, thinking, speaking

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    fetchRooms();
  }, []);

  useEffect(() => {
    if (currentRoom) {
      connectWebSocket();
      fetchMessages();
      fetchParticipants();
      startSession();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopSpeechRecognition();
    };
  }, [currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await aiVirtualRoomAPI.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const roomData = {
        name: formData.get('name'),
        description: formData.get('description'),
        room_type: formData.get('room_type'),
        level: formData.get('level'),
        topic: formData.get('topic') || null,
        max_participants: 6,
        enable_pronunciation_scoring: true,
        enable_grammar_correction: true,
        enable_vocabulary_hints: true,
        session_duration: 30
      };

      const newRoom = await aiVirtualRoomAPI.createRoom(roomData);
      setCurrentRoom(newRoom);
      setShowCreateForm(false);
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Không thể tạo phòng. Vui lòng thử lại!');
    }
  };

  const joinRoom = async () => {
    try {
      const room = await aiVirtualRoomAPI.joinRoom(joinCode, nickname);
      setCurrentRoom(room);
      setShowJoinForm(false);
      setJoinCode('');
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Không thể tham gia phòng. Kiểm tra lại mã phòng!');
    }
  };

  const leaveRoom = async () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopSpeechRecognition();
    
    if (currentSession) {
      await endSession();
    }
    
    if (currentRoom) {
      await aiVirtualRoomAPI.leaveRoom(currentRoom.id);
    }
    
    setCurrentRoom(null);
    setMessages([]);
    setParticipants([]);
    setCurrentSession(null);
    setSessionStats(null);
    fetchRooms();
  };

  const connectWebSocket = () => {
    if (!currentRoom) return;

    const wsUrl = aiVirtualRoomAPI.getWebSocketUrl(currentRoom.id);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected to AI Virtual Room');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'message':
        setMessages((prev) => [...prev, data.data]);
        break;
      case 'ai_response':
        setMessages((prev) => [...prev, data.data]);
        setAiTyping(false);
        // Speak AI response
        if (data.data && data.data.content) {
          speakText(data.data.content);
        }
        break;
      case 'user_joined':
        fetchParticipants();
        break;
      case 'user_left':
        fetchParticipants();
        break;
      case 'audio_toggle':
      case 'speaking_toggle':
        fetchParticipants();
        break;
      default:
        break;
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await aiVirtualRoomAPI.getMessages(currentRoom.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const roomDetail = await aiVirtualRoomAPI.getRoom(currentRoom.id);
      setParticipants(roomDetail.participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const startSession = async () => {
    try {
      const session = await aiVirtualRoomAPI.startSession(currentRoom.id);
      setCurrentSession(session);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;
    
    try {
      const completedSession = await aiVirtualRoomAPI.endSession(currentSession.id);
      setSessionStats(completedSession);
      setCurrentSession(null);
      return completedSession;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentRoom) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        content: content,
        sender_id: currentUser?.id,
        is_ai_message: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Show AI thinking
      setAiTyping(true);
      setAiTeacherMood('thinking');

      // Send via WebSocket for real-time
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'message',
            content: content,
            message_type: 'text',
          })
        );
      } else {
        // Fallback to API
        await aiVirtualRoomAPI.sendMessage(currentRoom.id, {
          content: content,
          message_type: 'text',
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAiTyping(false);
      setAiTeacherMood('neutral');
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    }
  };

  const toggleAudio = () => {
    if (!isAudioOn) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    setIsAudioOn(!isAudioOn);

    // Notify server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'audio_toggle',
          is_on: !isAudioOn,
        })
      );
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');

      setMessageInput(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // User not speaking, ignore
      } else {
        setIsAudioOn(false);
      }
    };

    recognitionRef.current.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Text-to-Speech for AI responses
  const speakText = (text) => {
    // Stop any ongoing speech
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('Browser does not support speech synthesis');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for friendliness
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setAiSpeaking(true);
      setAiTeacherMood('speaking');
    };

    utterance.onend = () => {
      setAiSpeaking(false);
      setAiTeacherMood('happy');
      setTimeout(() => setAiTeacherMood('neutral'), 2000);
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setAiSpeaking(false);
      setAiTeacherMood('neutral');
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setAiSpeaking(false);
    setAiTeacherMood('neutral');
  };

  const getRoomTypeLabel = (type) => {
    const labels = {
      speaking: 'Luyện nói',
      pronunciation: 'Phát âm',
      conversation: 'Hội thoại',
      group_chat: 'Nhóm chat',
    };
    return labels[type] || type;
  };

  const getLevelLabel = (level) => {
    const labels = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao',
    };
    return labels[level] || level;
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: '#4ade80',
      intermediate: '#fbbf24',
      advanced: '#f87171',
    };
    return colors[level] || '#94a3b8';
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesLevel = selectedLevel === 'all' || room.level === selectedLevel;
    const matchesType = selectedType === 'all' || room.room_type === selectedType;
    return matchesLevel && matchesType;
  });

  if (loading && !currentRoom) {
    return (
      <div className="ai-virtual-room-loading">
        <div className="loading-spinner" />
        <p>Đang tải phòng học ảo...</p>
      </div>
    );
  }

  // Room view
  if (currentRoom) {
    return (
      <div className="ai-virtual-room-main">
        {/* Sidebar */}
        <div className="ai-room-sidebar">
          <div className="ai-room-header">
            <div className="ai-room-title">
              <Bot className="ai-icon" />
              <div>
                <h3>{currentRoom.name}</h3>
                <p className="ai-room-subtitle">{getRoomTypeLabel(currentRoom.room_type)}</p>
              </div>
            </div>
            <button className="leave-btn" onClick={leaveRoom} title="Rời phòng">
              <LogOut size={18} />
            </button>
          </div>

          <div className="room-code-badge">
            <span>Mã phòng: <strong>{currentRoom.room_code}</strong></span>
          </div>

          {/* Session Info */}
          {currentSession && (
            <div className="session-info-card">
              <div className="session-info-header">
                <Clock size={16} />
                <span>Phiên học đang diễn ra</span>
              </div>
              <div className="session-timer">
                {Math.floor((Date.now() - new Date(currentSession.started_at)) / 60000)} phút
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="participants-section">
            <div className="participants-header">
              <Users size={18} />
              <span>Thành viên ({participants.length})</span>
            </div>

            <div className="participants-list">
              {/* AI Teacher */}
              <div className="participant-item ai-teacher">
                <div className="participant-avatar ai-avatar">
                  <Bot size={20} />
                </div>
                <div className="participant-info">
                  <div className="participant-name">AI Teacher</div>
                  <div className="participant-status">
                    <div className="status-indicator active" />
                    <span>Trợ lý AI</span>
                  </div>
                </div>
              </div>

              {/* Human Participants */}
              {participants.map((participant) => (
                <div key={participant.id} className="participant-item">
                  <div className="participant-avatar">
                    {(participant.nickname || participant.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="participant-info">
                    <div className="participant-name">
                      {participant.nickname || participant.username}
                    </div>
                    <div className="participant-status">
                      <div className={`status-indicator ${participant.is_online ? 'active' : ''}`} />
                      {participant.is_audio_on && <Mic size={12} />}
                      {participant.is_speaking && <Volume2 size={12} className="speaking-icon" />}
                    </div>
                  </div>
                  {participant.pronunciation_score && (
                    <div className="participant-score">
                      <Star size={12} />
                      <span>{participant.pronunciation_score.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Room Settings */}
          <div className="room-settings">
            <h4>Tính năng phòng</h4>
            <div className="setting-item">
              <TrendingUp size={14} />
              <span>Đánh giá phát âm</span>
            </div>
            <div className="setting-item">
              <BookOpen size={14} />
              <span>Sửa ngữ pháp</span>
            </div>
            <div className="setting-item">
              <Sparkles size={14} />
              <span>Gợi ý từ vựng</span>
            </div>
          </div>
        </div>

        {/* AI Teacher Avatar Center */}
        <div className="ai-teacher-center">
          <div className={`ai-teacher-avatar ${aiTeacherMood} ${aiSpeaking ? 'speaking' : ''}`}>
            <div className="avatar-circle">
              <Bot size={80} />
            </div>
            <div className="ai-teacher-status">
              {aiTyping && <span className="status-text">Đang suy nghĩ...</span>}
              {aiSpeaking && <span className="status-text">Đang nói...</span>}
              {!aiTyping && !aiSpeaking && <span className="status-text">Sẵn sàng</span>}
            </div>
            
            {/* Sound waves animation when speaking */}
            {aiSpeaking && (
              <div className="sound-waves">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
            )}

            {/* AI Teacher Info */}
            <div className="ai-teacher-info">
              <h3>AI English Teacher</h3>
              <p className="ai-teacher-subtitle">
                {currentRoom?.room_type === 'conversation' && '💬 Hội thoại'}
                {currentRoom?.room_type === 'pronunciation' && '🗣️ Phát âm'}
                {currentRoom?.room_type === 'debate' && '🎯 Tranh luận'}
                {currentRoom?.room_type === 'role_play' && '🎭 Nhập vai'}
              </p>
              <p className="ai-teacher-level">Level: {currentRoom?.level || 'Beginner'}</p>
            </div>

            {/* Control buttons */}
            {aiSpeaking && (
              <button className="stop-speaking-btn" onClick={stopSpeaking} title="Dừng nói">
                <VolumeX size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="ai-room-content">
          {/* Messages */}
          <div className="ai-messages-container">
            {messages.map((msg, index) => {
              const isAi = msg.sender_type === 'ai_teacher';
              const isOwn = msg.sender_id === currentUser?.id;

              return (
                <div key={index} className={`ai-message ${isAi ? 'ai-message-teacher' : isOwn ? 'ai-message-own' : 'ai-message-user'}`}>
                  <div className="message-avatar">
                    {isAi ? (
                      <Bot size={20} />
                    ) : (
                      <span>{(msg.sender_name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-sender-name">
                      {isAi ? 'AI Teacher' : msg.sender_name || 'User'}
                    </div>
                    <div className="message-bubble">
                      {msg.content}
                    </div>
                    
                    {/* Grammar corrections */}
                    {msg.grammar_issues && msg.grammar_issues.length > 0 && (
                      <div className="grammar-corrections">
                        <div className="correction-header">
                          <Award size={14} />
                          <span>Sửa ngữ pháp</span>
                        </div>
                        {msg.grammar_issues.map((issue, idx) => (
                          <div key={idx} className="correction-item">
                            <span className="error-text">{issue.error}</span>
                            <span className="arrow">→</span>
                            <span className="correct-text">{issue.correction}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Vocabulary hints */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="vocabulary-hints">
                        <div className="hint-header">
                          <Sparkles size={14} />
                          <span>Gợi ý từ vựng</span>
                        </div>
                        {msg.suggestions.map((hint, idx) => (
                          <div key={idx} className="hint-item">
                            <span>{hint.original}</span> → <strong>{hint.alternative}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.pronunciation_score && (
                      <div className="pronunciation-score">
                        <Star size={12} />
                        <span>Phát âm: {msg.pronunciation_score.toFixed(0)}/100</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {aiTyping && (
              <div className="ai-message ai-message-teacher">
                <div className="message-avatar">
                  <Bot size={20} />
                </div>
                <div className="message-content-wrapper">
                  <div className="message-sender-name">AI Teacher</div>
                  <div className="message-bubble typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="ai-message-input-container">
            <button
              className={`audio-toggle-btn ${isAudioOn ? 'active' : ''}`}
              onClick={toggleAudio}
              title={isAudioOn ? 'Tắt micro' : 'Bật micro'}
            >
              {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <input
              type="text"
              className="ai-message-input"
              placeholder={isAudioOn ? 'Đang lắng nghe...' : 'Nhập tin nhắn hoặc bật micro...'}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isAudioOn}
            />
            <button className="send-message-btn" onClick={sendMessage} disabled={!messageInput.trim()}>
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* Session Summary Modal */}
        {sessionStats && (
          <div className="session-summary-modal" onClick={() => setSessionStats(null)}>
            <div className="session-summary-content" onClick={(e) => e.stopPropagation()}>
              <h2>Tổng kết buổi học</h2>
              <div className="summary-stats">
                <div className="stat-card">
                  <Clock size={24} />
                  <div>
                    <div className="stat-value">{Math.floor(sessionStats.duration / 60)}</div>
                    <div className="stat-label">Phút</div>
                  </div>
                </div>
                <div className="stat-card">
                  <MessageCircle size={24} />
                  <div>
                    <div className="stat-value">{sessionStats.messages_sent}</div>
                    <div className="stat-label">Tin nhắn</div>
                  </div>
                </div>
                {sessionStats.avg_pronunciation_score && (
                  <div className="stat-card">
                    <Award size={24} />
                    <div>
                      <div className="stat-value">{sessionStats.avg_pronunciation_score.toFixed(0)}</div>
                      <div className="stat-label">Điểm phát âm</div>
                    </div>
                  </div>
                )}
              </div>

              {sessionStats.session_summary && (
                <div className="summary-section">
                  <h3>Tóm tắt</h3>
                  <p>{sessionStats.session_summary}</p>
                </div>
              )}

              {sessionStats.strengths && sessionStats.strengths.length > 0 && (
                <div className="summary-section">
                  <h3>Điểm mạnh</h3>
                  <ul>
                    {sessionStats.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {sessionStats.areas_to_improve && sessionStats.areas_to_improve.length > 0 && (
                <div className="summary-section">
                  <h3>Cần cải thiện</h3>
                  <ul>
                    {sessionStats.areas_to_improve.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button className="close-summary-btn" onClick={() => setSessionStats(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Room List View
  return (
    <div className="ai-virtual-room-container">
      <div className="ai-room-list-header">
        <div className="header-content">
          <div className="header-title">
            <Bot size={32} />
            <div>
              <h1>Phòng Học Ảo AI</h1>
              <p>Luyện nói tiếng Anh với giáo viên AI thông minh</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-create-room" onClick={() => setShowCreateForm(true)}>
              <Plus size={20} />
              Tạo phòng mới
            </button>
            <button className="btn-join-room" onClick={() => setShowJoinForm(true)}>
              <UserPlus size={20} />
              Tham gia phòng
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="room-filters">
          <div className="filter-group">
            <label>Trình độ:</label>
            <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="beginner">Cơ bản</option>
              <option value="intermediate">Trung cấp</option>
              <option value="advanced">Nâng cao</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Loại phòng:</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="speaking">Luyện nói</option>
              <option value="pronunciation">Phát âm</option>
              <option value="conversation">Hội thoại</option>
              <option value="group_chat">Nhóm chat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Room Form */}
      {showCreateForm && (
        <div className="form-modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tạo Phòng Học Ảo Mới</h2>
            <form onSubmit={createRoom}>
              <div className="form-group">
                <label>Tên phòng *</label>
                <input type="text" name="name" required placeholder="Ví dụ: Luyện nói hàng ngày" />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea name="description" rows="3" placeholder="Mô tả ngắn về phòng học..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Loại phòng *</label>
                  <select name="room_type" required>
                    <option value="speaking">Luyện nói</option>
                    <option value="pronunciation">Phát âm</option>
                    <option value="conversation">Hội thoại</option>
                    <option value="group_chat">Nhóm chat</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Trình độ *</label>
                  <select name="level" required>
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Chủ đề (tùy chọn)</label>
                <input type="text" name="topic" placeholder="Ví dụ: Du lịch, Công việc, Sở thích..." />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Tạo phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Room Form */}
      {showJoinForm && (
        <div className="form-modal-overlay" onClick={() => setShowJoinForm(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Tham Gia Phòng Học</h2>
            <div className="form-group">
              <label>Mã phòng *</label>
              <input
                type="text"
                placeholder="Nhập mã phòng 6 ký tự..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            <div className="form-group">
              <label>Biệt danh (tùy chọn)</label>
              <input
                type="text"
                placeholder="Tên hiển thị trong phòng..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowJoinForm(false)}>
                Hủy
              </button>
              <button className="btn-primary" onClick={joinRoom} disabled={!joinCode || joinCode.length < 6}>
                Tham gia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <div className="empty-state">
          <Bot size={80} />
          <h3>Chưa có phòng học ảo</h3>
          <p>Tạo phòng mới để bắt đầu học với AI hoặc tham gia bằng mã phòng!</p>
        </div>
      ) : (
        <div className="ai-rooms-grid">
          {filteredRooms.map((room) => (
            <div key={room.id} className="ai-room-card" onClick={() => setCurrentRoom(room)}>
              <div className="room-card-header">
                <div className="room-icon">
                  <Bot size={24} />
                </div>
                <div className="room-level-badge" style={{ backgroundColor: getLevelColor(room.level) }}>
                  {getLevelLabel(room.level)}
                </div>
              </div>
              <h3 className="room-card-title">{room.name}</h3>
              {room.description && <p className="room-card-description">{room.description}</p>}
              <div className="room-card-meta">
                <span className="room-type-tag">{getRoomTypeLabel(room.room_type)}</span>
                {room.topic && <span className="room-topic-tag">{room.topic}</span>}
              </div>
              <div className="room-card-footer">
                <div className="room-participants-count">
                  <Users size={14} />
                  <span>{room.participant_count || 0} / {room.max_participants}</span>
                </div>
                <div className="room-code-display-small">Mã: {room.room_code}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIVirtualRoom;


