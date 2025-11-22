import { apiV1 } from './api';

const messageService = {
  // Get all conversations
  getConversations: async () => {
    const response = await apiV1.get('/messages/conversations');
    return response.data;
  },

  // Get conversation with specific user
  getConversationWithUser: async (userId, params = {}) => {
    const response = await apiV1.get(`/messages/conversation/${userId}`, { params });
    return response.data;
  },

  // Send message
  sendMessage: async (data) => {
    const response = await apiV1.post('/messages/', data);
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await apiV1.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  // Mark all messages in conversation as read
  markConversationAsRead: async (userId) => {
    const response = await apiV1.patch(`/messages/conversation/${userId}/mark-all-read`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiV1.get('/messages/unread-count');
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await apiV1.delete(`/messages/${messageId}`);
    return response.data;
  }
};

export default messageService;
