import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import messageService from '../../../services/messageService';
import userService from '../../../services/userService';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  IconButton,
  InputAdornment,
  Divider,
  Badge,
  Chip,
  Grid,
  Skeleton,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

const TeacherCommunicationMUI = () => {
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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 100px)' }}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height="100%" sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 4 }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 3, 
          mb: 3,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate(-1)}
              sx={{ color: 'white' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="600">
                Liên lạc giáo viên
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                Trao đổi với giáo viên về quá trình học tập
              </Typography>
            </Box>
            <ChatIcon sx={{ fontSize: 40, opacity: 0.8 }} />
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl">
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
          {/* Conversations List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
              {/* Search */}
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Tìm kiếm giáo viên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Divider />

              {/* Users List */}
              <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                {allUsers.length > 0 ? (
                  allUsers.map((user, index) => (
                    <React.Fragment key={user.user_id}>
                      <ListItemButton
                        selected={selectedUser?.user_id === user.user_id || selectedUser?.id === user.user_id}
                        onClick={() => handleSelectUser(user)}
                        sx={{
                          py: 2,
                          '&.Mui-selected': {
                            bgcolor: 'primary.light',
                            '&:hover': {
                              bgcolor: 'primary.light',
                            },
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            badgeContent={user.unread_count}
                            color="error"
                            overlap="circular"
                          >
                            <Avatar src={user.user_avatar}>
                              {user.user_name?.charAt(0) || <PersonIcon />}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography 
                                variant="subtitle1" 
                                fontWeight={user.unread_count > 0 ? 600 : 400}
                              >
                                {user.user_name || 'Giáo viên'}
                              </Typography>
                              {user.unread_count > 0 && (
                                <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                noWrap
                                sx={{ 
                                  fontWeight: user.unread_count > 0 ? 600 : 400,
                                  mb: 0.5
                                }}
                              >
                                {user.last_message || user.user_email || 'Chưa có tin nhắn'}
                              </Typography>
                              {user.last_message_time && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(user.last_message_time).toLocaleString('vi-VN')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                      {index < allUsers.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PersonIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      Không tìm thấy giáo viên
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Chat Area */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={selectedUser.user_avatar}>
                        {selectedUser.user_name?.charAt(0) || <PersonIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="600">
                          {selectedUser.user_name || 'Giáo viên'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedUser.user_email}
                        </Typography>
                      </Box>
                      <Chip 
                        label="Giáo viên" 
                        color="primary" 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  {/* Messages */}
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#fafafa' }}>
                    {messages.length > 0 ? (
                      <Stack spacing={2}>
                        {messages.map((message) => {
                          const isCurrentUser = message.sender_id === currentUserId;
                          return (
                            <Box
                              key={message.id}
                              sx={{
                                display: 'flex',
                                justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                              }}
                            >
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 2,
                                  maxWidth: '70%',
                                  bgcolor: isCurrentUser ? 'primary.main' : 'white',
                                  color: isCurrentUser ? 'white' : 'text.primary',
                                  borderRadius: 2,
                                  borderTopRightRadius: isCurrentUser ? 0 : 2,
                                  borderTopLeftRadius: isCurrentUser ? 2 : 0,
                                }}
                              >
                                <Typography variant="body1">
                                  {message.content}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    display: 'block',
                                    mt: 1,
                                    opacity: 0.8,
                                    textAlign: 'right'
                                  }}
                                >
                                  {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Paper>
                            </Box>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <ChatIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography color="text.secondary">
                          Chưa có tin nhắn
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Message Input */}
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
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
                      />
                      <Button
                        variant="contained"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        sx={{ minWidth: 'auto', px: 3 }}
                      >
                        <SendIcon />
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <ChatIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
                  <Typography variant="h6" color="text.secondary">
                    Chọn một cuộc trò chuyện
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chọn giáo viên từ danh sách để bắt đầu trao đổi
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherCommunicationMUI;
