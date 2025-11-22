import { useState } from 'react';
import { Search, Send, Paperclip, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import './TeacherCommunication.css';

const TeacherCommunication = () => {
  const [selectedChat, setSelectedChat] = useState('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = [
    {
      id: '1',
      name: 'Cô Nguyễn Thu Hà',
      role: 'Giáo viên - Tiếng Anh 10A1',
      lastMessage: 'Con bạn học rất tốt, tiến bộ rõ rệt!',
      time: '10 phút trước',
      unread: 2,
      avatar: 'NH',
      online: true,
      class: '10A1'
    },
    {
      id: '2',
      name: 'Thầy Trần Văn B',
      role: 'Giáo viên - Tiếng Anh 11B1',
      lastMessage: 'Đã gửi lịch học tuần tới cho bạn',
      time: '1 giờ trước',
      unread: 0,
      avatar: 'TB',
      online: false,
      class: '11B1'
    },
    {
      id: '3',
      name: 'Cô Lê Thị C',
      role: 'Giáo viên - Tiếng Anh 10A1',
      lastMessage: 'Cảm ơn phụ huynh đã quan tâm',
      time: '2 giờ trước',
      unread: 0,
      avatar: 'LC',
      online: true,
      class: '10A1'
    },
    {
      id: '4',
      name: 'Thầy Phạm Văn D',
      role: 'Giáo viên chủ nhiệm - 10A1',
      lastMessage: 'Họp phụ huynh vào thứ 7 tuần sau',
      time: '3 giờ trước',
      unread: 1,
      avatar: 'PD',
      online: false,
      class: '10A1'
    }
  ];

  const messages = {
    '1': [
      {
        id: '1',
        sender: 'teacher',
        content: 'Chào phụ huynh!',
        time: '14:30',
        date: '28/10/2025'
      },
      {
        id: '2',
        sender: 'parent',
        content: 'Chào cô! Cháu em học như thế nào ạ?',
        time: '14:32',
        date: '28/10/2025'
      },
      {
        id: '3',
        sender: 'teacher',
        content: 'Cháu học rất tốt, em rất tích cực trong lớp và bài tập về nhà luôn hoàn thành đầy đủ.',
        time: '14:35',
        date: '28/10/2025'
      },
      {
        id: '4',
        sender: 'teacher',
        content: 'Điểm số của em cũng ổn định, em có tiến bộ rõ rệt so với đầu năm học. Cô rất hài lòng!',
        time: '14:36',
        date: '28/10/2025'
      },
      {
        id: '5',
        sender: 'parent',
        content: 'Cảm ơn cô rất nhiều! Em cũng rất thích học tiếng Anh.',
        time: '14:40',
        date: '28/10/2025'
      },
      {
        id: '6',
        sender: 'teacher',
        content: 'Con bạn học rất tốt, tiến bộ rõ rệt!',
        time: '14:42',
        date: '28/10/2025'
      }
    ],
    '2': [
      {
        id: '1',
        sender: 'teacher',
        content: 'Xin chào phụ huynh, thầy đã gửi lịch học tuần tới',
        time: '10:00',
        date: '28/10/2025'
      }
    ]
  };

  const currentConversation = conversations.find(c => c.id === selectedChat);
  const currentMessages = messages[selectedChat] || [];

  const handleSendMessage = () => {
    if (messageInput.trim()) {

      setMessageInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages-page">
      <div className="messages-header-top">
        <h1 className="messages-title">Trao đổi</h1>
        <p className="messages-subtitle">Liên hệ với giáo viên của con em</p>
      </div>

      <div className="messages-container">
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
          <div className="conversations-list">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedChat === conv.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(conv.id)}
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
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="chat-avatar-wrapper">
                    <div className="chat-avatar">{currentConversation.avatar}</div>
                    {currentConversation.online && <span className="online-dot"></span>}
                  </div>
                  <div className="chat-user-info">
                    <h3 className="chat-user-name">{currentConversation.name}</h3>
                    <p className="chat-user-status">
                      {currentConversation.online ? 'Đang hoạt động' : 'Không hoạt động'}
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
                  {currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-bubble ${message.sender === 'parent' ? 'sent' : 'received'}`}
                    >
                      {message.sender === 'teacher' && (
                        <div className="message-avatar">{currentConversation.avatar}</div>
                      )}
                      <div className="message-content-wrapper">
                        <div className="message-content">{message.content}</div>
                        <span className="message-time">{message.time}</span>
                      </div>
                    </div>
                  ))}
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
                />
                <button className="input-action-btn" title="Emoji">
                  <Smile className="input-action-icon" />
                </button>
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
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

