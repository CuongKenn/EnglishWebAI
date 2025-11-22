import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Send, 
  LogOut,
  Sun,
  Moon,
  Plus,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import './ChatRoomMode.css';
import { chatRoomAPI } from '../../../services/api';
import authService from '../../../services/authService';

const ChatRoomMode = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const wsRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});

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
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopLocalStream();
    };
  }, [currentRoom]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await chatRoomAPI.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (roomData) => {
    try {
      const newRoom = await chatRoomAPI.createRoom(roomData);
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
      const room = await chatRoomAPI.joinRoom(joinCode, nickname);
      setCurrentRoom(room);
      setShowJoinForm(false);
      setJoinCode('');
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Không thể tham gia phòng. Kiểm tra lại mã phòng!');
    }
  };

  const leaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    stopLocalStream();
    setCurrentRoom(null);
    setMessages([]);
    setParticipants([]);
    fetchRooms();
  };

  const connectWebSocket = () => {
    if (!currentRoom) return;

    const token = localStorage.getItem('token');
    const wsUrl = `ws://localhost:8000/api/v1/chat/ws/${currentRoom.id}?token=${token}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
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
        setMessages(prev => [...prev, data.data]);
        break;
      case 'user_joined':
        fetchParticipants();
        break;
      case 'user_left':
        fetchParticipants();
        break;
      case 'video_toggle':
        fetchParticipants();
        break;
      case 'audio_toggle':
        fetchParticipants();
        break;
      case 'peer_signal':
        // Handle WebRTC signaling
        handlePeerSignal(data.data);
        break;
      default:
        break;
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await chatRoomAPI.getMessages(currentRoom.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const roomDetail = await chatRoomAPI.getRoom(currentRoom.id);
      setParticipants(roomDetail.participants);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !currentRoom) return;

    try {
      await chatRoomAPI.sendMessage(currentRoom.id, {
        content: messageInput,
        message_type: 'text'
      });
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        // Turn on video
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: isAudioOn 
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
      } else {
        // Turn off video
        stopLocalStream();
        setIsVideoOn(false);
      }

      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'video_toggle',
          data: { is_on: !isVideoOn }
        }));
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập!');
    }
  };

  const toggleAudio = async () => {
    try {
      if (!isAudioOn) {
        // Turn on audio
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: isVideoOn, 
          audio: true 
        });
        localStreamRef.current = stream;
        setIsAudioOn(true);
      } else {
        // Turn off audio
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(track => track.enabled = false);
        }
        setIsAudioOn(false);
      }

      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_toggle',
          data: { is_on: !isAudioOn }
        }));
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập!');
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const handlePeerSignal = (signalData) => {
    // Simplified WebRTC signaling - in production, use a library like simple-peer
    console.log('Received peer signal:', signalData);
    // Implementation would handle WebRTC peer connections here
  };

  const toggleTheme = async () => {
    try {
      const newTheme = isDarkTheme ? 'light' : 'dark';
      await chatRoomAPI.updateTheme(currentRoom.id, newTheme);
      setIsDarkTheme(!isDarkTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  if (loading && !currentRoom) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (currentRoom) {
    return (
      <div className={`chat-room-main ${isDarkTheme ? 'dark-theme' : ''}`}>
        {/* Sidebar - Participants */}
        <div className="chat-room-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>{currentRoom.name}</h3>
            <button className="video-control-btn" onClick={leaveRoom} title="Rời phòng">
              <LogOut size={18} />
            </button>
          </div>

          <div className="room-code-display">
            Mã: {currentRoom.room_code}
          </div>

          <div className="participants-header" style={{ marginTop: '20px' }}>
            <Users size={20} />
            Thành viên ({participants.length})
          </div>

          <div className="participants-list">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-item slide-in">
                <div className="participant-avatar">
                  {(participant.nickname || participant.username).charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <div className="participant-name">
                    {participant.nickname || participant.username}
                  </div>
                  <div className="participant-status">
                    <div className={`status-indicator ${participant.is_online ? '' : 'offline'}`} />
                    {participant.is_video_on && <Video size={12} color="#4facfe" />}
                    {participant.is_audio_on && <Mic size={12} color="#4facfe" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="theme-toggle" onClick={toggleTheme}>
            <span>Chế độ tối</span>
            {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
          </div>
        </div>

        {/* Main Content */}
        <div className="chat-room-content">
          {/* Video Grid */}
          <div className="video-grid">
            {/* Local Video */}
            <div className="video-container">
              {isVideoOn ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="video-element"
                />
              ) : (
                <div className="video-placeholder">
                  {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="video-name-tag">Bạn</div>
              <div className="video-controls-overlay">
                <button 
                  className={`video-control-btn ${isVideoOn ? 'active' : ''}`}
                  onClick={toggleVideo}
                  title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
                >
                  {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
                <button 
                  className={`video-control-btn ${isAudioOn ? 'active' : ''}`}
                  onClick={toggleAudio}
                  title={isAudioOn ? 'Tắt mic' : 'Bật mic'}
                >
                  {isAudioOn ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
              </div>
            </div>

            {/* Other participants' videos would go here */}
            {participants.filter(p => p.user_id !== currentUser?.id && p.is_video_on).map(participant => (
              <div key={participant.id} className="video-container">
                <div className="video-placeholder">
                  {(participant.nickname || participant.username).charAt(0).toUpperCase()}
                </div>
                <div className="video-name-tag">
                  {participant.nickname || participant.username}
                </div>
              </div>
            ))}
          </div>

          {/* Messages */}
          <div className="chat-messages-container">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender_id === currentUser?.id;
              return (
                <div key={index} className="chat-message">
                  {!isOwnMessage && (
                    <div className="message-sender">{msg.sender_name}</div>
                  )}
                  <div className={`message-content ${isOwnMessage ? 'own-message' : ''}`}>
                    {msg.content}
                  </div>
                  <div className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input */}
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Nhập tin nhắn..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Room List View
  return (
    <div className="chat-room-mode-container">
      <div className="section-header">
        <div className="section-title">
          <MessageCircle />
          Phòng Trò Chuyện Nhóm
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary-gradient" onClick={() => setShowCreateForm(true)}>
            <Plus size={20} />
            Tạo phòng mới
          </button>
          <button className="btn-primary-gradient" onClick={() => setShowJoinForm(true)}>
            <UserPlus size={20} />
            Tham gia phòng
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="join-room-form fade-in">
          <h3 style={{ marginBottom: '20px' }}>Tạo Phòng Mới</h3>
          <div className="form-group">
            <label className="form-label">Tên phòng</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nhập tên phòng..."
              id="room-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mô tả (tùy chọn)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Mô tả ngắn về phòng..."
              id="room-description"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn-quiz btn-quiz-secondary" onClick={() => setShowCreateForm(false)}>
              Hủy
            </button>
            <button 
              className="btn-quiz btn-quiz-primary" 
              onClick={() => {
                const name = document.getElementById('room-name').value;
                const description = document.getElementById('room-description').value;
                if (name) createRoom({ name, description });
              }}
            >
              Tạo phòng
            </button>
          </div>
        </div>
      )}

      {showJoinForm && (
        <div className="join-room-form fade-in">
          <h3 style={{ marginBottom: '20px' }}>Tham Gia Phòng</h3>
          <div className="form-group">
            <label className="form-label">Mã phòng</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nhập mã phòng..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Biệt danh (tùy chọn)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Tên hiển thị trong phòng..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn-quiz btn-quiz-secondary" onClick={() => setShowJoinForm(false)}>
              Hủy
            </button>
            <button className="btn-quiz btn-quiz-primary" onClick={joinRoom} disabled={!joinCode}>
              Tham gia
            </button>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="empty-state">
          <Users size={80} />
          <h3>Chưa có phòng nào</h3>
          <p>Tạo phòng mới hoặc tham gia phòng bằng mã!</p>
        </div>
      ) : (
        <div className="chat-rooms-list">
          {rooms.map((room) => (
            <div key={room.id} className="chat-room-list-card" onClick={() => setCurrentRoom(room)}>
              <div className="room-list-header">
                <h3 className="room-list-name">{room.name}</h3>
                <div className="room-participants-count">
                  <Users size={14} />
                  <span>{room.participant_count || 0}</span>
                </div>
              </div>
              {room.description && (
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                  {room.description}
                </p>
              )}
              <div className="room-code-display">
                Mã: {room.room_code}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRoomMode;
