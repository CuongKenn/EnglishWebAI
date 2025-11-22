import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, Users, Send, MessageCircle, X, Image, Smile, Edit3, Sun, Moon, Monitor } from 'lucide-react';
import { chatRoomAPI } from '../../../services/api';
import './GroupRoomDetail.css';

const GroupRoomDetail = ({ group, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [theme, setTheme] = useState('light'); // 'light', 'dark'
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize
  useEffect(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }

    // Fetch initial data
    fetchMessages();
    fetchParticipants();
    
    // Connect WebSocket
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopLocalStream();
    };
  }, [group.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    // Use correct API path
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/v1/chat/ws/${group.id}?token=${token}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          setMessages(prev => [...prev, {
            id: Date.now(),
            user_id: data.user_id,
            username: data.username,
            content: data.content,
            created_at: new Date().toISOString()
          }]);
        } else if (data.type === 'user_joined' || data.type === 'user_left') {
          fetchParticipants();
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
    };
  };

  const fetchMessages = async () => {
    try {
      const data = await chatRoomAPI.getMessages(group.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await chatRoomAPI.getParticipants(group.id);
      setParticipants(response);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: newMessage.trim()
      }));
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh!');
      return;
    }

    // Convert to base64 and send
    const reader = new FileReader();
    reader.onload = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'image',
          content: reader.result,
          filename: file.name
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNicknameChange = async () => {
    if (!newNickname.trim()) return;

    try {
      const participant = participants.find(p => p.user_id === currentUser?.id);
      if (participant) {
        await chatRoomAPI.updateParticipant(participant.id, {
          nickname: newNickname.trim()
        });
        
        // Update local state
        setParticipants(prev => prev.map(p => 
          p.id === participant.id ? { ...p, nickname: newNickname.trim() } : p
        ));
        
        setShowNicknameModal(false);
        setNewNickname('');
      }
    } catch (error) {
      console.error('Error updating nickname:', error);
      alert('Không thể cập nhật biệt danh');
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await chatRoomAPI.updateTheme(group.id, newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true
        });
        
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        // Notify when screen sharing stops
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };

        // Notify server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'screen_share_toggle',
            is_on: true
          }));
        }
      } catch (error) {
        console.error('Error sharing screen:', error);
        alert('Không thể chia sẻ màn hình');
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'screen_share_toggle',
          is_on: false
        }));
      }
    }
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: isAudioOn 
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        
        // Notify server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'video_toggle',
            is_on: true
          }));
        }
      } catch (error) {
        console.error('Error accessing video:', error);
        alert('Không thể truy cập camera');
      }
    } else {
      stopLocalStream();
      setIsVideoOn(false);
      
      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'video_toggle',
          is_on: false
        }));
      }
    }
  };

  const toggleAudio = async () => {
    if (!isAudioOn) {
      if (!localStreamRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: isVideoOn, 
            audio: true 
          });
          localStreamRef.current = stream;
          if (localVideoRef.current && isVideoOn) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing audio:', error);
          alert('Không thể truy cập microphone');
          return;
        }
      }
      
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsAudioOn(true);
      }
      
      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_toggle',
          is_on: true
        }));
      }
    } else {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
      }
      setIsAudioOn(false);
      
      // Notify server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_toggle',
          is_on: false
        }));
      }
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const handleLeaveRoom = () => {
    if (confirm('Bạn có chắc muốn rời khỏi nhóm?')) {
      stopLocalStream();
      onBack();
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const commonEmojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👏', '🎉', '❤️', '🔥', '✨'];

  return (
    <div className={`group-room-detail theme-${theme}`}>
      {/* Header */}
      <div className="group-detail-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleLeaveRoom}>
            <ArrowLeft size={24} />
          </button>
          
          <div className="group-info">
            <h1 className="group-title-header">{group.name}</h1>
            <p className="group-code-header">Mã: {group.room_code}</p>
          </div>
        </div>

        <div className="header-right">
          <div className="theme-switcher">
            <button 
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
              title="Light mode"
            >
              <Sun size={18} />
            </button>
            <button 
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
              title="Dark mode"
            >
              <Moon size={18} />
            </button>
          </div>

          <button 
            className="header-btn btn-nickname"
            onClick={() => setShowNicknameModal(true)}
            title="Đổi biệt danh"
          >
            <Edit3 size={18} />
          </button>

          <button 
            className="header-btn btn-participants"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users size={18} />
            <span>{participants.length}</span>
          </button>
          
          <button className="header-btn btn-leave" onClick={handleLeaveRoom}>
            Rời nhóm
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="group-detail-content">
        {/* Video Section */}
        <div className="video-section">
          <div className="video-controls-header">
            <h3 className="video-title">
              <Video size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Video Call
            </h3>
            
            <div className="video-controls">
              <button 
                className={`video-control-btn ${isVideoOn ? 'active' : ''}`}
                onClick={toggleVideo}
                title={isVideoOn ? 'Tắt camera' : 'Bật camera'}
              >
                {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              
              <button 
                className={`video-control-btn ${isAudioOn ? 'active' : ''}`}
                onClick={toggleAudio}
                title={isAudioOn ? 'Tắt mic' : 'Bật mic'}
              >
                {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button 
                className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
                onClick={toggleScreenShare}
                title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
              >
                <Monitor size={20} />
              </button>
            </div>
          </div>

          <div className="video-grid">
            {/* Local Video */}
            {isVideoOn && (
              <div className="video-item">
                <video 
                  ref={localVideoRef}
                  autoPlay 
                  muted 
                  playsInline
                  className="video-element"
                />
                <div className="video-name-tag">Bạn</div>
                <div className="video-status-indicators">
                  {!isAudioOn && (
                    <div className="status-icon muted">
                      <MicOff size={16} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other participants placeholders */}
            {participants.filter(p => p.user_id !== currentUser?.id).map(participant => (
              <div key={participant.id} className="video-item">
                <div className="video-placeholder">
                  {getInitials(participant.username || participant.user?.username)}
                </div>
                <div className="video-name-tag">
                  {participant.username || participant.user?.username || 'User'}
                </div>
                <div className="video-status-indicators">
                  {!participant.is_audio_on && (
                    <div className="status-icon muted">
                      <MicOff size={16} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {participants.length === 0 && !isVideoOn && (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                color: '#999', 
                padding: '40px',
                fontSize: '16px'
              }}>
                <Video size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>Chưa có ai tham gia video call</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Nhấn nút camera để bắt đầu
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-header">
            <h3 className="chat-title">
              <MessageCircle size={20} />
              Trò chuyện
            </h3>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => {
              const isOwn = msg.user_id === currentUser?.id;
              return (
                <div key={msg.id} className="chat-message">
                  {!isOwn && (
                    <div className="message-sender">
                      {msg.username || msg.user?.username || 'User'}
                    </div>
                  )}
                  <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
                    {msg.type === 'image' ? (
                      <img src={msg.content} alt="Shared" className="message-image" />
                    ) : (
                      msg.content
                    )}
                  </div>
                  <div className="message-time" style={{ textAlign: isOwn ? 'right' : 'left' }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />

            {messages.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '40px 20px',
                fontSize: '14px'
              }}>
                <MessageCircle size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>Chưa có tin nhắn nào</p>
                <p style={{ marginTop: '8px' }}>Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              
              <button 
                className="input-action-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Gửi ảnh"
              >
                <Image size={20} />
              </button>

              <button 
                className="input-action-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Chọn emoji"
              >
                <Smile size={20} />
              </button>

              {showEmojiPicker && (
                <div className="emoji-picker">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      className="emoji-btn"
                      onClick={() => handleEmojiSelect(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <input
                type="text"
                className="chat-input"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="send-btn" onClick={handleSendMessage}>
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <div className="modal-overlay" onClick={() => setShowNicknameModal(false)}>
          <div className="modal-content nickname-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi biệt danh</h3>
              <button className="modal-close" onClick={() => setShowNicknameModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="nickname-input"
                placeholder="Nhập biệt danh mới..."
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNicknameChange()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowNicknameModal(false)}>
                Hủy
              </button>
              <button className="btn-confirm" onClick={handleNicknameChange}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Sidebar */}
      <div className={`participants-sidebar ${showParticipants ? 'open' : ''}`}>
        <div className="participants-header">
          <h3 className="participants-title">Thành viên ({participants.length})</h3>
          <button className="back-btn" onClick={() => setShowParticipants(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="participants-list">
          {participants.map((participant) => (
            <div key={participant.id} className="participant-item">
              <div className="participant-avatar">
                {getInitials(participant.username || participant.user?.username)}
              </div>
              <div className="participant-info">
                <div className="participant-name">
                  {participant.username || participant.user?.username || 'User'}
                  {participant.user_id === currentUser?.id && ' (Bạn)'}
                </div>
                <div className="participant-status">
                  <div className="status-dot"></div>
                  Online
                </div>
              </div>
            </div>
          ))}

          {participants.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: '#999', 
              padding: '40px 20px',
              fontSize: '14px'
            }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Chưa có thành viên nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRoomDetail;
