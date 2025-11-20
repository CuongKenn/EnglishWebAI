import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import messageService from '../../../services/messageService';
import { getCurrentUser } from '../../../services/userService';
// apiV1 imported but not used - could be used for future features
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import { parentAPI } from '../../../services/parentService';

import { 
  FaComments, 
  FaPaperPlane, 
  FaSearch,
  FaUserCircle,
  FaCircle,
  FaArrowLeft,
  FaChevronRight,
  FaFilter,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import './TeacherCommunication.css';

const TeacherCommunication = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    loadChildren();

    const conversationInterval = setInterval(() => {
      loadConversations();
    }, 15000);

    return () => clearInterval(conversationInterval);
  }, []);

  useEffect(() => {
    if (!selectedChild) {
      setTeachers([]);
      setSelectedUser(null);
      setMessages([]);
      return;
    }

    const childId = selectedChild.id;
    setSearchQuery('');
    setSelectedUser(null);
    setMessages([]);
    setTeachers([]);
    loadTeachersForChild(childId);

    const teacherInterval = setInterval(() => {
      loadTeachersForChild(childId);
    }, 60000);

    return () => clearInterval(teacherInterval);
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const userId = selectedUser.user_id || selectedUser.id;
    loadMessages(userId);
    markConversationAsRead(userId);

    const messageInterval = setInterval(() => {
      loadMessages(userId);
    }, 5000);

    return () => clearInterval(messageInterval);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUserId(user.id);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      const data = await parentAPI.getChildren();
      setChildren(data);
      if (data.length > 0) {
        setSelectedChild(data[0]);
      }
    } catch (error) {
      console.error('Error loading children:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachersForChild = async (childId) => {
    try {
      setTeachersLoading(true);
      const data = await parentAPI.getTeachersForChild(childId);
      const teacherList = Array.isArray(data) ? data : [];
      setTeachers(teacherList);

      if (teacherList.length === 0) {
        setSelectedUser(null);
      } else if (!selectedUser || (selectedUser && selectedUser.user_id && !teacherList.some(t => t.id === selectedUser.user_id)) || (selectedUser && selectedUser.id && !teacherList.some(t => t.id === selectedUser.id))) {
        const firstTeacher = teacherList[0];
        setSelectedUser({
          id: firstTeacher.id,
          full_name: firstTeacher.full_name,
          email: firstTeacher.email,
          role: firstTeacher.role,
          avatar: firstTeacher.avatar_url
        });
      }
    } catch (error) {
      console.error('Error loading teachers for child:', error);
      setTeachers([]);
    } finally {
      setTeachersLoading(false);
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
      loadConversations(); // Refresh unread counts
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);
      const userId = selectedUser.user_id || selectedUser.id;
      
      await messageService.sendMessage({
        receiver_id: userId,
        content: newMessage
      });
      
      setNewMessage('');
      loadMessages(userId);
      loadConversations(); // Update conversation list
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedUser({
      user_id: conversation.user_id,
      full_name: conversation.user_name,
      email: conversation.user_email,
      role: conversation.user_role,
      avatar: conversation.user_avatar
    });
  };

  const handleSelectTeacher = (teacher) => {
    // Check if conversation exists
    const existing = conversations.find(c => c.user_id === teacher.id);
    if (existing) {
      handleSelectConversation(existing);
    } else {
      setSelectedUser({
        id: teacher.id,
        full_name: teacher.full_name,
        email: teacher.email,
        role: teacher.role,
        avatar: teacher.avatar_url
      });
      setMessages([]); // No messages yet
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins}p`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTeachers = teachers.filter(teacher => {
    const name = (teacher.full_name || teacher.name || '').toLowerCase();
    const email = (teacher.email || '').toLowerCase();
    const keyword = searchQuery.toLowerCase();
    return name.includes(keyword) || email.includes(keyword);
  });

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <>
        <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
        <div className="teacher-communication-page">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
      <div className="teacher-communication-page">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb-nav">
          <button className="back-btn" onClick={() => navigate('/')}>
            <FaArrowLeft className="back-icon" />
            <span>Trang chủ</span>
          </button>
          <FaChevronRight className="breadcrumb-separator" />
          <span className="breadcrumb-current">Trao đổi với giáo viên</span>
        </div>

        {/* Page Header */}
        <div className="page-header-modern">
          <div className="page-header-content">
            <div className="page-icon-wrapper">
              <FaComments className="page-icon" />
            </div>
            <div className="page-title-section">
              <h1>Trao đổi với giáo viên</h1>
              <p className="page-subtitle">
                Liên hệ và trao đổi trực tiếp với giáo viên của con bạn
              </p>
            </div>
          </div>
          
          {/* Info card */}
          {children.length > 0 && (
            <div className="info-card">
              <FaInfoCircle className="info-icon" />
              <span>
                Bạn đang xem giáo viên của <strong>{selectedChild?.name}</strong>
              </span>
            </div>
          )}
        </div>

      <div className="communication-container">
        {/* Sidebar: Conversations & Teachers */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Tin nhắn</h3>
          </div>

          {/* Child Selector */}
          {children.length > 0 && (
            <div className="child-selector">
              <label htmlFor="child-select">Chọn con:</label>
              <select 
                id="child-select"
                value={selectedChild?.id || ''}
                onChange={(e) => {
                  const child = children.find(c => c.id === parseInt(e.target.value));
                  setSelectedChild(child);
                }}
                className="child-select-dropdown"
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Conversations */}
          {conversations.length > 0 && (
            <div className="conversations-section">
              <h4>Cuộc trò chuyện</h4>
              <div className="conversation-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.user_id}
                    className={`conversation-item ${selectedUser?.user_id === conv.user_id || selectedUser?.id === conv.user_id ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="conversation-avatar">
                      {conv.user_avatar ? (
                        <img src={conv.user_avatar} alt={conv.user_name} />
                      ) : (
                        <FaUserCircle />
                      )}
                      {conv.unread_count > 0 && (
                        <span className="unread-indicator">
                          <FaCircle />
                        </span>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">
                        {conv.user_name}
                        {conv.unread_count > 0 && (
                          <span className="unread-count">{conv.unread_count}</span>
                        )}
                      </div>
                      <div className="conversation-preview">
                        {conv.last_message}
                      </div>
                    </div>
                    <div className="conversation-time">
                      {formatTime(conv.last_message_time)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Teachers */}
          <div className="teachers-section">
            <h4>Giáo viên</h4>
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Tìm giáo viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={teachersLoading || teachers.length === 0}
              />
            </div>
            <div className="teacher-list">
              {teachersLoading ? (
                <div className="no-conversations">
                  <p>Đang tải danh sách giáo viên...</p>
                </div>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`teacher-item ${selectedUser?.id === teacher.id ? 'active' : ''}`}
                    onClick={() => handleSelectTeacher(teacher)}
                  >
                    <div className="teacher-avatar">
                      {teacher.avatar_url ? (
                        <img src={teacher.avatar_url} alt={teacher.full_name} />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="teacher-info">
                      <div className="teacher-name">{teacher.full_name}</div>
                      <div className="teacher-classes">
                        {teacher.classes && teacher.classes.length > 0 ? (
                          <small style={{ color: '#666' }}>
                            Lớp: {teacher.classes.join(', ')}
                          </small>
                        ) : (
                          <div className="teacher-email">{teacher.email}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-conversations">
                  <p>Chưa có giáo viên nào được phân công cho bé.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-area">
          {selectedUser ? (
            <>
              <div className="chat-header">
                <div className="chat-user-avatar">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.full_name} />
                  ) : (
                    <FaUserCircle />
                  )}
                </div>
                <div className="chat-user-info">
                  <h3>{selectedUser.full_name}</h3>
                  <p>{selectedUser.email}</p>
                </div>
              </div>

              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <FaComments className="empty-icon" />
                    <p>Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        {msg.content}
                      </div>
                      <div className="message-time">
                        {formatMessageTime(msg.created_at)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-area" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  <FaPaperPlane />
                  {sending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <FaComments className="empty-icon" />
              <h3>Chọn giáo viên để bắt đầu trò chuyện</h3>
              <p>Chọn một cuộc trò chuyện hoặc giáo viên từ danh sách bên trái</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default TeacherCommunication;

