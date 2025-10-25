import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import messageService from '../../../services/messageService';
import userService from '../../../services/userService';
import { 
  FaComments, 
  FaPaperPlane, 
  FaSearch,
  FaUserCircle,
  FaArrowLeft
} from 'react-icons/fa';

const TeacherCommunication = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.user_id || selectedUser.id);
      markConversationAsRead(selectedUser.user_id || selectedUser.id);
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCurrentUser = async () => {
    try {
      const user = await userService.getCurrentUser();
      setCurrentUserId(user.id);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await userService.getUsers({ role: 'teacher' });
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await messageService.getMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markConversationAsRead = async (userId) => {
    try {
      await messageService.markConversationAsRead(userId);
      await loadConversations();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setSending(true);
      await messageService.sendMessage({
        receiver_id: selectedUser.user_id || selectedUser.id,
        subject: 'Tin nhắn từ phụ huynh',
        content: newMessage,
      });
      
      setNewMessage('');
      await loadMessages(selectedUser.user_id || selectedUser.id);
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allUsers = [
    ...conversations.map(conv => ({
      ...conv,
      isConversation: true
    })),
    ...filteredTeachers.filter(teacher => 
      !conversations.find(conv => conv.user_id === teacher.id)
    ).map(teacher => ({
      user_id: teacher.id,
      user_name: teacher.full_name,
      user_email: teacher.email,
      user_avatar: teacher.avatar_url,
      unread_count: 0,
      last_message: null,
      last_message_time: null,
      isConversation: false
    }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Liên lạc giáo viên</h1>
              <p className="text-cyan-100 mt-1">Trao đổi với giáo viên về quá trình học tập</p>
            </div>
            <FaComments className="w-10 h-10" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Conversations List */}
          <div className="bg-white rounded-xl shadow-md flex flex-col">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm giáo viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {allUsers.length > 0 ? (
                allUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b ${
                      (selectedUser?.user_id === user.user_id || selectedUser?.id === user.user_id)
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : ''
                    }`}
                  >
                    <div className="relative">
                      <FaUserCircle className="w-12 h-12 text-gray-400" />
                      {user.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {user.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${user.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                          {user.user_name || 'Giáo viên'}
                        </p>
                        {user.unread_count > 0 && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${user.unread_count > 0 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
                        {user.last_message || user.user_email || 'Chưa có tin nhắn'}
                      </p>
                      {user.last_message_time && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(user.last_message_time).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FaUserCircle className="w-16 h-16 mb-2" />
                  <p>Không tìm thấy giáo viên</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FaUserCircle className="w-12 h-12 text-gray-400" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        {selectedUser.user_name || 'Giáo viên'}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedUser.user_email}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-semibold">
                      Giáo viên
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isCurrentUser = message.sender_id === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-md ${
                                isCurrentUser
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                                  : 'bg-white text-gray-800'
                              } ${isCurrentUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                            >
                              <p>{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FaComments className="w-16 h-16 mb-2" />
                      <p>Chưa có tin nhắn</p>
                      <p className="text-sm">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      rows="1"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      style={{ minHeight: '50px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-md flex items-center gap-2"
                    >
                      <FaPaperPlane />
                      <span className="hidden sm:inline">Gửi</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FaComments className="w-20 h-20 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Chọn một cuộc trò chuyện</h3>
                <p>Chọn giáo viên từ danh sách để bắt đầu trao đổi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCommunication;
