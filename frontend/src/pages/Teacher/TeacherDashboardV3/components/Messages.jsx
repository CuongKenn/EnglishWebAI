import { useState, useEffect, useRef } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { Search, Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';
import messageService from '../../../../services/messageService';
import { getCurrentUser } from '../../../../services/userService';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadCurrentUser();
    loadConversations();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
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

  const loadUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Include students and parents
        const studentsAndParents = data.filter(u => u.role === 'student' || u.role === 'parent');
        setUsers(studentsAndParents);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChat || sending) return;

    setSending(true);
    try {
      await messageService.sendMessage(selectedChat, messageInput.trim());
      setMessageInput('');
      await loadMessages(selectedChat);
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleUserSelect = async (userId) => {
    setSelectedChat(userId);
    await loadMessages(userId);
    
    // Mark messages as read
    try {
      await messageService.markAsRead(userId);
      await loadConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const getConversationInfo = (userId) => {
    const conversation = conversations.find(c => 
      (c.sender_id === userId && c.receiver_id === currentUserId) ||
      (c.receiver_id === userId && c.sender_id === currentUserId)
    );
    
    const user = users.find(u => u.id === userId);
    
    return {
      user,
      lastMessage: conversation?.last_message || '',
      unreadCount: conversation?.unread_count || 0,
      updatedAt: conversation?.updated_at || ''
    };
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
    return date.toLocaleDateString('vi-VN');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[words.length - 1][0];
    }
    return name.substring(0, 2);
  };

  // Combine conversations and users
  const allContactIds = new Set([
    ...conversations.map(c => c.sender_id === currentUserId ? c.receiver_id : c.sender_id),
    ...users.map(u => u.id)
  ]);

  const contactsList = Array.from(allContactIds)
    .filter(id => id !== currentUserId)
    .map(userId => {
      const info = getConversationInfo(userId);
      return {
        id: userId,
        ...info
      };
    })
    .filter(contact => contact.user) // Only show contacts with user info
    .sort((a, b) => {
      // Sort by last message time
      if (!a.updatedAt && !b.updatedAt) return 0;
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  const filteredContacts = contactsList.filter(contact =>
    contact.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.user?.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUser = users.find(u => u.id === selectedChat);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tin nhắn</h1>
        <p className="text-gray-600">Trò chuyện với học sinh và phụ huynh</p>
      </div>

      <Card className="h-[calc(100vh-240px)] flex">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Đang tải...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Chưa có tin nhắn</div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedChat === contact.id ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleUserSelect(contact.id)}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className="bg-purple-500 text-white">
                          {getInitials(contact.user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {contact.user?.full_name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(contact.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {contact.user?.role === 'parent' ? 'Phụ huynh' : 'Học sinh'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {contact.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                        {contact.unreadCount > 0 && (
                          <Badge className="ml-2 bg-purple-500 text-white">
                            {contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-purple-500 text-white">
                      {getInitials(selectedUser?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {selectedUser?.full_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedUser?.role === 'parent' ? 'Phụ huynh' : 'Học sinh'} - {selectedUser?.email}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl ${
                          msg.sender_id === currentUserId
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.sender_id === currentUserId ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={sending} className="gap-2">
                    <Send className="w-4 h-4" />
                    {sending ? 'Đang gửi...' : 'Gửi'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Messages;
