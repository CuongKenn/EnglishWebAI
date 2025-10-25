import { apiV1 } from './api';

const notificationService = {
  // Get all notifications with filters
  getNotifications: async (params = {}) => {
    const response = await apiV1.get('/notifications', { params });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await apiV1.get('/notifications/unread-count');
    return response.data;
  },

  // Create notification (admin/system)
  createNotification: async (data) => {
    const response = await apiV1.post('/notifications', data);
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const response = await apiV1.patch(`/notifications/${notificationId}`, {
      is_read: true
    });
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await apiV1.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Delete single notification
  deleteNotification: async (notificationId) => {
    const response = await apiV1.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await apiV1.delete('/notifications');
    return response.data;
  }
};

export default notificationService;
