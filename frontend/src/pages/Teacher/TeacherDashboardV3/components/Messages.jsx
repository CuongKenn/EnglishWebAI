import { useState } from 'react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { Search, Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Textarea } from '../../../../components/ui/textarea';

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState('1');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const conversations = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      role: 'Học sinh - 10A1',
      lastMessage: 'Thầy ơi, em có thể nộp bài muộn được không ạ?',
      time: '10 phút trước',
      unread: 2,
      avatar: 'NA',
      online: true
    },
    {
      id: '2',
      name: 'Trần Thị B',
      role: 'Phụ huynh',
      lastMessage: 'Con em học tiếng Anh như thế nào ạ?',
      time: '1 giờ trước',
      unread: 0,
      avatar: 'TB',
      online: false
    },
    {
      id: '3',
      name: 'Lớp 10A2',
      role: 'Nhóm lớp',
      lastMessage: 'Thầy: Nhớ làm bài tập về nhà nhé các em',
      time: '2 giờ trước',
      unread: 0,
      avatar: '10A2',
      online: false
    },
    {
      id: '4',
      name: 'Lê Văn C',
      role: 'Học sinh - 11B1',
      lastMessage: 'Cảm ơn thầy đã giúp em!',
      time: '3 giờ trước',
      unread: 0,
      avatar: 'LC',
      online: true
    },
    {
      id: '5',
      name: 'Phạm Thị D',
      role: 'Phụ huynh',
      lastMessage: 'Thầy có thể gửi lịch học cho em không ạ?',
      time: 'Hôm qua',
      unread: 1,
      avatar: 'PD',
      online: false
    }
  ];

  const messages = {
    '1': [
      {
        id: '1',
        sender: 'student',
        content: 'Chào thầy ạ!',
        time: '14:30',
        date: '26/10/2025'
      },
      {
        id: '2',
        sender: 'teacher',
        content: 'Chào em, có chuyện gì thế?',
        time: '14:32',
        date: '26/10/2025'
      },
      {
        id: '3',
        sender: 'student',
        content: 'Thầy ơi, em có thể nộp bài muộn được không ạ? Em bị ốm nên chưa làm xong.',
        time: '14:35',
        date: '26/10/2025'
      },
      {
        id: '4',
        sender: 'teacher',
        content: 'Ừ được, thầy cho em thêm 2 ngày. Nhưng nhớ làm bài đầy đủ nhé!',
        time: '14:40',
        date: '26/10/2025'
      },
      {
        id: '5',
        sender: 'student',
        content: 'Vâng ạ, cảm ơn thầy nhiều!',
        time: '14:41',
        date: '26/10/2025'
      }
    ]
  };

  const currentConversation = conversations.find(c => c.id === selectedChat);
  const currentMessages = messages[selectedChat] || [];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      // Logic to send message
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedChat === conv.id ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedChat(conv.id)}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback className="bg-purple-500 text-white">
                        {conv.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{conv.name}</h4>
                      <span className="text-xs text-gray-500">{conv.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{conv.role}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <Badge className="ml-2 bg-purple-500 text-white">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-purple-500 text-white">
                      {currentConversation.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{currentConversation.name}</h3>
                    <p className="text-xs text-gray-500">{currentConversation.role}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-3 rounded-2xl ${
                        msg.sender === 'teacher'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'teacher' ? 'text-purple-100' : 'text-gray-500'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
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
                  <Button onClick={handleSendMessage} className="gap-2">
                    <Send className="w-4 h-4" />
                    Gửi
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
