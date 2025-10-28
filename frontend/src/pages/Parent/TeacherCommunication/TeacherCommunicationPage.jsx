import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Send, Paperclip, Smile, MoreVertical, Phone, Video,
  ArrowLeft, ChevronRight, Filter, Star, Clock, CheckCheck, Download,
  FileText, FileSpreadsheet, Trash2, Archive, Bell, BellOff, X
} from 'lucide-react';
import Navbar from '../../../components/Navbar/Navbar';
import authService from '../../../services/authService';
import Modal from '../ParentDashboardV2/components/Modal';
import './TeacherCommunicationPage.css';

const TeacherCommunicationPage = () => {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      class: '10A1',
      isPinned: true
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
      class: '11B1',
      isPinned: false
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
      class: '10A1',
      isPinned: false
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
      class: '10A1',
      isPinned: true
    }
  ];

  const messages = {
    '1': [
      {
        id: '1',
        sender: 'teacher',
        content: 'Chào phụ huynh!',
        time: '14:30',
        date: '28/10/2025',
        isRead: true
      },
      {
        id: '2',
        sender: 'parent',
        content: 'Chào cô! Cháu em học như thế nào ạ?',
        time: '14:32',
        date: '28/10/2025',
        isRead: true
      },
      {
        id: '3',
        sender: 'teacher',
        content: 'Cháu học rất tốt, em rất tích cực trong lớp và bài tập về nhà luôn hoàn thành đầy đủ.',
        time: '14:35',
        date: '28/10/2025',
        isRead: true
      },
      {
        id: '4',
        sender: 'teacher',
        content: 'Điểm số của em cũng ổn định, em có tiến bộ rõ rệt so với đầu năm học. Cô rất hài lòng!',
        time: '14:36',
        date: '28/10/2025',
        isRead: true
      },
      {
        id: '5',
        sender: 'parent',
        content: 'Cảm ơn cô rất nhiều! Em cũng rất thích học tiếng Anh.',
        time: '14:40',
        date: '28/10/2025',
        isRead: true
      },
      {
        id: '6',
        sender: 'teacher',
        content: 'Con bạn học rất tốt, tiến bộ rõ rệt!',
        time: '14:42',
        date: '28/10/2025',
        isRead: false
      }
    ],
    '2': [
      {
        id: '1',
        sender: 'teacher',
        content: 'Xin chào phụ huynh, thầy đã gửi lịch học tuần tới',
        time: '10:00',
        date: '28/10/2025',
        isRead: true
      }
    ]
  };

  const currentConversation = conversations.find(c => c.id === selectedChat);
  const currentMessages = messages[selectedChat] || [];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log('Sending message:', messageInput);
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

  // Sort: pinned first, then by time
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <>
      <Navbar userRole="parent" isLoggedIn={true} onLogout={handleLogout} />
      <div className="teacher-communication-page-container">
        {/* Page Header */}
        <div className="page-header-communication">
          <div className="breadcrumb">
            <span className="back-btn" onClick={() => navigate('/')}>
              <ArrowLeft className="back-icon" />
              Home
            </span>
            <ChevronRight className="breadcrumb-separator" />
            <span className="breadcrumb-current">Trao đổi với giáo viên</span>
          </div>

          <div className="page-title-section-comm">
            <div className="page-title-left-comm">
              <div className="page-icon-wrapper-comm">
                <Send className="page-icon-comm" />
              </div>
              <div>
                <h1 className="page-title-comm">Trao đổi với giáo viên</h1>
                <p className="page-subtitle-comm">Liên hệ trực tiếp với giáo viên của con em</p>
              </div>
            </div>
          </div>
        </div>

        {/* Communication Container */}
        <div className="communication-main-container">
          {/* Conversations Sidebar */}
          <div className="conversations-sidebar-modern">
            <div className="sidebar-header-modern">
              <h2 className="sidebar-title-modern">Tin nhắn</h2>
              <button className="filter-btn-comm" onClick={() => setShowFilterModal(true)} title="Bộ lọc">
                <Filter className="filter-icon-comm" />
              </button>
            </div>

            <div className="search-box-modern">
              <Search className="search-icon-comm" />
              <input
                type="text"
                placeholder="Tìm kiếm giáo viên..."
                className="search-input-comm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="conversations-list-modern">
              {sortedConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-card ${selectedChat === conv.id ? 'active' : ''} ${conv.isPinned ? 'pinned' : ''}`}
                  onClick={() => setSelectedChat(conv.id)}
                >
                  {conv.isPinned && (
                    <div className="pin-indicator">
                      <Star className="pin-icon" />
                    </div>
                  )}
                  
                  <div className="conv-avatar-container">
                    <div className="conv-avatar-modern">{conv.avatar}</div>
                    {conv.online && <span className="online-status"></span>}
                  </div>

                  <div className="conv-details-modern">
                    <div className="conv-header-modern">
                      <h4 className="conv-name-modern">{conv.name}</h4>
                      <span className="conv-time-modern">{conv.time}</span>
                    </div>
                    <p className="conv-role-modern">{conv.role}</p>
                    <div className="conv-footer-modern">
                      <p className="conv-last-message-modern">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="unread-badge-modern">{conv.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="chat-area-modern">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="chat-header-modern">
                  <div className="chat-header-left-modern">
                    <div className="chat-avatar-container">
                      <div className="chat-avatar-modern">{currentConversation.avatar}</div>
                      {currentConversation.online && <span className="online-dot-chat"></span>}
                    </div>
                    <div className="chat-user-info-modern">
                      <h3 className="chat-user-name-modern">{currentConversation.name}</h3>
                      <p className="chat-user-status-modern">
                        {currentConversation.online ? (
                          <><span className="status-dot online"></span>Đang hoạt động</>
                        ) : (
                          <><span className="status-dot offline"></span>Không hoạt động</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="chat-header-actions-modern">
                    <button className="action-btn-chat" onClick={() => setShowPhoneModal(true)} title="Gọi điện">
                      <Phone className="action-icon-chat" />
                    </button>
                    <button className="action-btn-chat" onClick={() => setShowVideoModal(true)} title="Gọi video">
                      <Video className="action-icon-chat" />
                    </button>
                    <button className="action-btn-chat" onClick={() => setShowMoreModal(true)} title="Thêm">
                      <MoreVertical className="action-icon-chat" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="messages-area-modern">
                  <div className="messages-scroll-modern">
                    <div className="date-divider">
                      <span className="date-text">Hôm nay</span>
                    </div>
                    
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-wrapper ${message.sender === 'parent' ? 'sent' : 'received'}`}
                      >
                        {message.sender === 'teacher' && (
                          <div className="message-avatar-small">{currentConversation.avatar}</div>
                        )}
                        <div className="message-content-container">
                          <div className={`message-bubble-modern ${message.sender}`}>
                            {message.content}
                          </div>
                          <div className="message-meta">
                            <span className="message-time-modern">{message.time}</span>
                            {message.sender === 'parent' && (
                              <CheckCheck className={`read-status ${message.isRead ? 'read' : 'sent'}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="message-input-container">
                  <button className="input-action-btn-modern" onClick={() => setShowAttachmentModal(true)} title="Đính kèm">
                    <Paperclip className="input-action-icon-modern" />
                  </button>
                  <div className="input-wrapper-modern">
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      className="message-input-modern"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <button className="emoji-btn-modern" title="Emoji">
                      <Smile className="emoji-icon-modern" />
                    </button>
                  </div>
                  <button
                    className={`send-btn-modern ${messageInput.trim() ? 'active' : ''}`}
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="send-icon-modern" />
                  </button>
                </div>
              </>
            ) : (
              <div className="no-chat-selected-modern">
                <div className="no-chat-icon-modern">💬</div>
                <h3 className="no-chat-title">Chọn một cuộc trò chuyện</h3>
                <p className="no-chat-description">Chọn giáo viên từ danh sách bên trái để bắt đầu trò chuyện</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      
      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Bộ lọc tin nhắn"
        size="small"
      >
        <div className="filter-modal-content">
          <div className="filter-option">
            <input type="checkbox" id="filter-unread" className="filter-checkbox" />
            <label htmlFor="filter-unread" className="filter-label">Chỉ hiện tin nhắn chưa đọc</label>
          </div>
          <div className="filter-option">
            <input type="checkbox" id="filter-pinned" className="filter-checkbox" />
            <label htmlFor="filter-pinned" className="filter-label">Chỉ hiện cuộc trò chuyện đã ghim</label>
          </div>
          <div className="filter-option">
            <input type="checkbox" id="filter-online" className="filter-checkbox" />
            <label htmlFor="filter-online" className="filter-label">Chỉ hiện giáo viên đang online</label>
          </div>
          <div className="filter-buttons">
            <button className="modal-btn-secondary" onClick={() => setShowFilterModal(false)}>
              Hủy
            </button>
            <button className="modal-btn-primary" onClick={() => {
              console.log('Áp dụng bộ lọc');
              setShowFilterModal(false);
            }}>
              Áp dụng
            </button>
          </div>
        </div>
      </Modal>

      {/* Phone Call Modal */}
      <Modal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        title="Gọi điện thoại"
        size="small"
      >
        <div className="call-modal-content">
          <div className="call-info">
            <div className="call-avatar">
              {currentConversation?.avatar}
            </div>
            <h3 className="call-name">{currentConversation?.name}</h3>
            <p className="call-role">{currentConversation?.role}</p>
            <p className="call-number">📞 0987 654 321</p>
          </div>
          <div className="call-note">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', marginBottom: '1rem' }}>
              Bạn có muốn gọi điện cho giáo viên này không?
            </p>
          </div>
          <div className="call-buttons">
            <button className="modal-btn-secondary" onClick={() => setShowPhoneModal(false)}>
              Hủy
            </button>
            <button className="modal-btn-primary call-btn-green" onClick={() => {
              console.log('Bắt đầu cuộc gọi...');
              setShowPhoneModal(false);
            }}>
              <Phone style={{ width: '18px', height: '18px' }} />
              Gọi ngay
            </button>
          </div>
        </div>
      </Modal>

      {/* Video Call Modal */}
      <Modal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title="Gọi video"
        size="small"
      >
        <div className="call-modal-content">
          <div className="call-info">
            <div className="call-avatar">
              {currentConversation?.avatar}
            </div>
            <h3 className="call-name">{currentConversation?.name}</h3>
            <p className="call-role">{currentConversation?.role}</p>
          </div>
          <div className="call-note">
            <p style={{ fontSize: '0.875rem', color: '#6b7280', textAlign: 'center', marginBottom: '1rem' }}>
              Bạn có muốn bắt đầu cuộc gọi video với giáo viên này không?
            </p>
          </div>
          <div className="call-buttons">
            <button className="modal-btn-secondary" onClick={() => setShowVideoModal(false)}>
              Hủy
            </button>
            <button className="modal-btn-primary call-btn-blue" onClick={() => {
              console.log('Bắt đầu cuộc gọi video...');
              setShowVideoModal(false);
            }}>
              <Video style={{ width: '18px', height: '18px' }} />
              Gọi video
            </button>
          </div>
        </div>
      </Modal>

      {/* More Options Modal */}
      <Modal
        isOpen={showMoreModal}
        onClose={() => setShowMoreModal(false)}
        title="Tùy chọn"
        size="small"
      >
        <div className="more-options-content">
          <button className="option-btn" onClick={() => {
            setShowMoreModal(false);
            setShowExportModal(true);
          }}>
            <Download style={{ width: '20px', height: '20px' }} />
            <span>Xuất danh sách tin nhắn</span>
          </button>
          <button className="option-btn" onClick={() => {
            console.log('Đánh dấu tất cả đã đọc');
            setShowMoreModal(false);
          }}>
            <CheckCheck style={{ width: '20px', height: '20px' }} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
          <button className="option-btn" onClick={() => {
            console.log('Lưu trữ cuộc trò chuyện');
            setShowMoreModal(false);
          }}>
            <Archive style={{ width: '20px', height: '20px' }} />
            <span>Lưu trữ cuộc trò chuyện</span>
          </button>
          <button className="option-btn" onClick={() => {
            console.log('Tắt thông báo');
            setShowMoreModal(false);
          }}>
            <BellOff style={{ width: '20px', height: '20px' }} />
            <span>Tắt thông báo</span>
          </button>
          <button className="option-btn danger" onClick={() => {
            setShowMoreModal(false);
            setShowDeleteModal(true);
          }}>
            <Trash2 style={{ width: '20px', height: '20px' }} />
            <span>Xóa cuộc trò chuyện</span>
          </button>
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Xuất danh sách tin nhắn"
        size="small"
      >
        <div className="export-modal-communication">
          <p className="export-description-comm">
            Chọn định dạng để xuất cuộc trò chuyện với {currentConversation?.name}
          </p>
          
          <div className="export-options-grid-comm">
            <button className="export-option-card-comm" onClick={() => {
              console.log('Xuất PDF - Tin nhắn');
              setShowExportModal(false);
            }}>
              <div className="export-icon-wrapper-comm pdf">
                <FileText style={{ width: '32px', height: '32px' }} />
              </div>
              <div className="export-option-info-comm">
                <h4>Tải báo cáo PDF</h4>
                <p>Định dạng PDF, dễ in ấn và chia sẻ</p>
              </div>
            </button>

            <button className="export-option-card-comm" onClick={() => {
              console.log('Xuất Excel - Tin nhắn');
              setShowExportModal(false);
            }}>
              <div className="export-icon-wrapper-comm excel">
                <FileSpreadsheet style={{ width: '32px', height: '32px' }} />
              </div>
              <div className="export-option-info-comm">
                <h4>Xuất dữ liệu Excel</h4>
                <p>Định dạng Excel, dễ phân tích dữ liệu</p>
              </div>
            </button>
          </div>

          <div className="export-info-box-comm">
            <div className="export-info-icon-comm">ℹ️</div>
            <div className="export-info-text-comm">
              <strong>Danh sách bao gồm:</strong>
              <ul>
                <li>Lịch sử tin nhắn đầy đủ</li>
                <li>Thời gian gửi và nhận</li>
                <li>Trạng thái đã đọc</li>
                <li>Thông tin giáo viên</li>
              </ul>
            </div>
          </div>

          <button className="modal-btn-secondary-comm" style={{ width: '100%', marginTop: '1rem' }} onClick={() => setShowExportModal(false)}>
            Đóng
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa"
        size="small"
      >
        <div className="delete-modal-content">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Trash2 style={{ width: '48px', height: '48px', color: '#ef4444', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.9375rem', color: '#111827', fontWeight: '600', marginBottom: '0.5rem' }}>
              Bạn có chắc chắn muốn xóa cuộc trò chuyện này?
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <div className="delete-buttons">
            <button className="modal-btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Hủy
            </button>
            <button className="modal-btn-danger" onClick={() => {
              console.log('Xóa cuộc trò chuyện');
              setShowDeleteModal(false);
            }}>
              Xóa
            </button>
          </div>
        </div>
      </Modal>

      {/* Attachment Modal */}
      <Modal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        title="Đính kèm tệp"
        size="small"
      >
        <div className="attachment-modal-content">
          <div className="attachment-options">
            <button className="attachment-btn" onClick={() => {
              console.log('Đính kèm ảnh');
              setShowAttachmentModal(false);
            }}>
              <div className="attachment-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
                📷
              </div>
              <span>Ảnh</span>
            </button>
            <button className="attachment-btn" onClick={() => {
              console.log('Đính kèm tài liệu');
              setShowAttachmentModal(false);
            }}>
              <div className="attachment-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                📄
              </div>
              <span>Tài liệu</span>
            </button>
            <button className="attachment-btn" onClick={() => {
              console.log('Đính kèm video');
              setShowAttachmentModal(false);
            }}>
              <div className="attachment-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                🎥
              </div>
              <span>Video</span>
            </button>
            <button className="attachment-btn" onClick={() => {
              console.log('Đính kèm âm thanh');
              setShowAttachmentModal(false);
            }}>
              <div className="attachment-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                🎵
              </div>
              <span>Âm thanh</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TeacherCommunicationPage;

