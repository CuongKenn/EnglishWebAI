import { useState, useEffect, useRef } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video, Users, Plus } from 'lucide-react';
import messageService from '../../../../services/messageService';
import { getCurrentUser } from '../../../../services/userService';
import { parentAPI } from '../../../../services/parentService';
import './TeacherCommunication.css';

const TeacherCommunication = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showTeachersList, setShowTeachersList] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    loadChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadTeachersForChild(selectedChild.id);
    }
  }, [selectedChild]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.user_id);
      markConversationAsRead(selectedChat.user_id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        alert('⚠️ Bạn chưa đăng nhập. Vui lòng đăng nhập!');
        window.location.href = '/login';
        return;
      }
      
      const user = await getCurrentUser();
      console.log('Current user:', user);
      
      if (user.role !== 'parent') {
        alert('⚠️ Chỉ phụ huynh mới có thể truy cập trang này!');
        window.location.href = '/';
        return;
      }
      
      setCurrentUserId(user.id);
    } catch (error) {
      console.error('Error loading current user:', error);
      
      if (error.response?.status === 401) {
        alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      
      // Transform to match UI format
      const transformed = data.map(conv => ({
        id: conv.user_id.toString(),
        user_id: conv.user_id,
        name: conv.user_name || 'Giáo viên',
        role: conv.user_role === 'teacher' ? 'Giáo viên' : conv.user_role,
        lastMessage: conv.last_message || 'Chưa có tin nhắn',
        time: formatTime(conv.last_message_time),
        unread: conv.unread_count || 0,
        avatar: getInitials(conv.user_name),
        online: false,
        email: conv.user_email
      }));
      
      setConversations(transformed);
      
      // Auto-select first conversation
      if (transformed.length > 0 && !selectedChat) {
        setSelectedChat(transformed[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      
      // Check if it's an auth error
      if (error.response?.status === 401) {
        alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    try {
      const data = await parentAPI.getChildren();
      setChildren(data);
      
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadTeachersForChild = async (childId) => {
    try {
      const response = await fetch(`/api/v1/parent/children/${childId}/teachers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await messageService.getConversationWithUser(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markConversationAsRead = async (userId) => {
    try {
      await messageService.markConversationAsRead(userId);
      loadConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'GV';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedChat || sending) return;

    try {
      setSending(true);
      
      await messageService.sendMessage({
        receiver_id: selectedChat.user_id,
        content: messageInput.trim()
      });
      
      setMessageInput('');
      await loadMessages(selectedChat.user_id);
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectChat = (conv) => {
    setSelectedChat(conv);
    setShowTeachersList(false);
  };

  const handleSelectTeacher = (teacher) => {
    // Check if conversation already exists
    const existing = conversations.find(c => c.user_id === teacher.id);
    
    if (existing) {
      setSelectedChat(existing);
    } else {
      // Create new chat object for teacher
      const newChat = {
        id: teacher.id.toString(),
        user_id: teacher.id,
        name: teacher.full_name || teacher.name,
        role: `Giáo viên - ${teacher.classes?.join(', ') || ''}`,
        lastMessage: 'Bắt đầu trò chuyện',
        time: '',
        unread: 0,
        avatar: getInitials(teacher.full_name || teacher.name),
        online: false,
        email: teacher.email
      };
      
      setSelectedChat(newChat);
      setMessages([]); // No messages yet
    }
    
    setShowTeachersList(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="teacher-communication-page">
        <div className="communication-header">
          <h1 className="communication-title">Trao đổi với giáo viên</h1>
          <p className="communication-subtitle">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-communication-page">
      <div className="communication-header">
        <h1 className="communication-title">Trao đổi với giáo viên</h1>
        <p className="communication-subtitle">Liên hệ trực tiếp với giáo viên của con em</p>
      </div>

      <div className="communication-container">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm giáo viên..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Toggle button between conversations and teachers */}
          <div className="view-toggle">
            <button
              className={`toggle-btn ${!showTeachersList ? 'active' : ''}`}
              onClick={() => setShowTeachersList(false)}
            >
              <Users size={16} />
              Cuộc trò chuyện ({conversations.length})
            </button>
            <button
              className={`toggle-btn ${showTeachersList ? 'active' : ''}`}
              onClick={() => setShowTeachersList(true)}
            >
              <Plus size={16} />
              Giáo viên ({teachers.length})
            </button>
          </div>
          
          {/* Conversations or Teachers List */}
          <div className="conversations-list">
            {!showTeachersList ? (
              // Show conversations
              filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedChat?.id === conv.id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(conv)}
                  >
                    <div className="conv-avatar-wrapper">
                      <div className="conv-avatar">{conv.avatar}</div>
                      {conv.online && <span className="online-indicator"></span>}
                    </div>
                    <div className="conv-details">
                      <div className="conv-header">
                        <h4 className="conv-name">{conv.name}</h4>
                        <span className="conv-time">{conv.time}</span>
                      </div>
                      <div className="conv-footer">
                        <p className="conv-last-message">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="unread-badge">{conv.unread}</span>
                        )}
                      </div>
                      <span className="conv-class">{conv.role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-conversations">
                  <p>Chưa có cuộc trò chuyện nào</p>
                  <button 
                    className="btn-start-chat"
                    onClick={() => setShowTeachersList(true)}
                  >
                    <Plus size={16} />
                    Bắt đầu trò chuyện
                  </button>
                </div>
              )
            ) : (
              // Show teachers list
              teachers.length > 0 ? (
                <>
                  {children.length > 1 && (
                    <div className="child-selector">
                      <select 
                        value={selectedChild?.id || ''}
                        onChange={(e) => {
                          const child = children.find(c => c.id === parseInt(e.target.value));
                          setSelectedChild(child);
                        }}
                        className="child-select"
                      >
                        {children.map(child => (
                          <option key={child.id} value={child.id}>
                            {child.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="conversation-item teacher-item"
                      onClick={() => handleSelectTeacher(teacher)}
                    >
                      <div className="conv-avatar-wrapper">
                        <div className="conv-avatar teacher-avatar">
                          {getInitials(teacher.full_name || teacher.name)}
                        </div>
                      </div>
                      <div className="conv-details">
                        <div className="conv-header">
                          <h4 className="conv-name">{teacher.full_name || teacher.name}</h4>
                        </div>
                        <p className="conv-last-message">{teacher.email}</p>
                        <span className="conv-class">
                          {teacher.classes?.join(', ') || 'Giáo viên'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="no-conversations">
                  <p>Chưa có giáo viên nào</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="chat-avatar-wrapper">
                    <div className="chat-avatar">{selectedChat.avatar}</div>
                    {selectedChat.online && <span className="online-dot"></span>}
                  </div>
                  <div className="chat-user-info">
                    <h3 className="chat-user-name">{selectedChat.name}</h3>
                    <p className="chat-user-status">
                      {selectedChat.online ? 'Đang hoạt động' : selectedChat.email}
                    </p>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="action-btn" title="Gọi điện">
                    <Phone className="action-icon" />
                  </button>
                  <button className="action-btn" title="Gọi video">
                    <Video className="action-icon" />
                  </button>
                  <button className="action-btn" title="Thêm">
                    <MoreVertical className="action-icon" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="messages-area">
                <div className="messages-scroll">
                  {/* Date divider */}
                  {messages.length > 0 && <div className="date-divider">Hôm nay</div>}
                  
                  {messages.map((message) => {
                    const isFromMe = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`message-bubble ${isFromMe ? 'sent' : 'received'}`}
                      >
                        {!isFromMe && (
                          <div className="message-avatar">{selectedChat.avatar}</div>
                        )}
                        <div className="message-content-wrapper">
                          <div className="message-content">{message.content}</div>
                          <span className="message-time">
                            {formatMessageTime(message.created_at)}
                            {isFromMe && message.is_read && ' ✓✓'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <button className="input-action-btn" title="Đính kèm">
                  <Paperclip className="input-action-icon" />
                </button>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="message-input"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                />
                <button className="input-action-btn" title="Emoji">
                  <Smile className="input-action-icon" />
                </button>
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                >
                  <Send className="send-icon" />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">💬</div>
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Chọn giáo viên từ danh sách bên trái để bắt đầu trò chuyện</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherCommunication;

