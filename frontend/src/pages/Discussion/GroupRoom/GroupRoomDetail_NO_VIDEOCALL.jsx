import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Send, Users, Image, Smile, Edit3, Sun, Moon, X, MessageCircle } from 'lucide-react';
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
    const [theme, setTheme] = useState('light');
    const [currentUser, setCurrentUser] = useState(null);

    const wsRef = useRef(null);
    const wsReadyRef = useRef(false);
    const pendingMessagesRef = useRef([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const sendWsMessage = useCallback((payload, options = {}) => {
        const { queueIfNotReady = true } = options;
        const message = JSON.stringify(payload);

        if (wsRef.current && wsReadyRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(message);
                return true;
            } catch (error) {
                console.error('WebSocket send failed:', error);
                return false;
            }
        }

        if (queueIfNotReady) {
            pendingMessagesRef.current.push(message);
        }

        return false;
    }, []);

    // Initialize
    useEffect(() => {
        let isMounted = true;

        const initRoom = async () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr && isMounted) {
                    setCurrentUser(JSON.parse(userStr));
                }

                await chatRoomAPI.joinRoom(group.room_code);
                setTheme(group.theme || 'light');
                await Promise.all([fetchMessages(), fetchParticipants()]);
                connectWebSocket();
            } catch (error) {
                console.error('Error initializing room:', error);
                const errorMsg = error.response?.data?.detail || error.detail || 'Không thể vào nhóm. Vui lòng thử lại!';
                alert(errorMsg);
                onBack();
            }
        };

        initRoom();

        return () => {
            isMounted = false;
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [group.id, group.room_code, onBack]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const connectWebSocket = () => {
        wsReadyRef.current = false;
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v1/chat/ws/${group.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            wsReadyRef.current = true;

            if (pendingMessagesRef.current.length > 0) {
                const queue = [...pendingMessagesRef.current];
                pendingMessagesRef.current.length = 0;
                queue.forEach((message) => {
                    try {
                        wsRef.current?.send(message);
                    } catch (error) {
                        console.error('Failed to flush queued WebSocket message:', error);
                        pendingMessagesRef.current.push(message);
                    }
                });
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'message' && data.data) {
                    setMessages(prev => [...prev, {
                        id: data.data.id,
                        user_id: data.data.sender_id,
                        username: data.data.sender_name,
                        content: data.data.content,
                        message_type: data.data.message_type,
                        media_url: data.data.media_url,
                        created_at: data.data.created_at
                    }]);
                } else if (data.type === 'user_left') {
                    fetchParticipants();
                } else if (data.type === 'user_joined') {
                    fetchParticipants();
                }
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.warn('WebSocket closed');
            wsReadyRef.current = false;
        };
    };

    const fetchMessages = async () => {
        try {
            const data = await chatRoomAPI.getMessages(group.id);
            const formatted = Array.isArray(data)
                ? data.map((msg) => ({
                    id: msg.id,
                    user_id: msg.sender_id,
                    username: msg.sender_name,
                    content: msg.content,
                    message_type: msg.message_type,
                    media_url: msg.media_url,
                    created_at: msg.created_at,
                }))
                : [];
            setMessages(formatted);
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

    const handleSendMessage = async () => {
        const trimmed = newMessage.trim();
        if (!trimmed) return;

        const payload = {
            type: 'message',
            content: trimmed,
            message_type: 'text'
        };

        const sentViaWs = sendWsMessage(payload);

        if (!sentViaWs && wsReadyRef.current) {
            try {
                const response = await chatRoomAPI.sendMessage(group.id, {
                    content: trimmed,
                    message_type: 'text'
                });
                if (response) {
                    setMessages(prev => [...prev, {
                        id: response.id,
                        user_id: response.sender_id,
                        username: response.sender_name,
                        content: response.content,
                        message_type: response.message_type,
                        media_url: response.media_url,
                        created_at: response.created_at
                    }]);
                }
            } catch (error) {
                console.error('HTTP send message failed:', error);
                alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
                return;
            }
        }

        setNewMessage('');
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

        if (file.size > 5 * 1024 * 1024) {
            alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh!');
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const imagePayload = {
                type: 'image',
                content: reader.result,
                message_type: 'image',
                media_url: reader.result,
                filename: file.name
            };

            const sentImageViaWs = sendWsMessage(imagePayload);

            if (!sentImageViaWs && wsReadyRef.current) {
                try {
                    const response = await chatRoomAPI.sendMessage(group.id, {
                        content: reader.result,
                        message_type: 'image',
                        media_url: reader.result
                    });
                    if (response) {
                        setMessages(prev => [...prev, {
                            id: response.id,
                            user_id: response.sender_id,
                            username: response.sender_name,
                            content: response.content,
                            message_type: response.message_type,
                            media_url: response.media_url,
                            created_at: response.created_at
                        }]);
                    }
                } catch (error) {
                    console.error('HTTP send image failed:', error);
                    alert('Không thể gửi ảnh. Vui lòng thử lại!');
                }
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

    const handleLeaveRoom = () => {
        if (confirm('Bạn có chắc muốn rời khỏi nhóm?')) {
            sendWsMessage({ type: 'user_left_manual' }, { queueIfNotReady: false });
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

            {/* Main Content - Only Chat */}
            <div className="group-detail-content" style={{ flexDirection: 'column' }}>
                {/* Chat Section */}
                <div className="chat-section" style={{ flex: 1 }}>
                    <div className="chat-header">
                        <h3 className="chat-title">
                            <MessageCircle size={20} />
                            Trò chuyện nhóm
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
                                        {msg.message_type === 'image' ? (
                                            <img src={msg.media_url || msg.content} alt="Shared" className="message-image" />
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
