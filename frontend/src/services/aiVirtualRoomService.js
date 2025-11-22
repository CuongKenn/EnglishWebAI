/**
 * AI Virtual Room Service
 * API calls for AI-powered English learning virtual rooms
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AI_ROOM_API = `${API_URL}/api/v1/ai-virtual-room`;

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const aiVirtualRoomAPI = {
  // === ROOM MANAGEMENT ===
  
  /**
   * Get all AI Virtual Rooms
   */
  getRooms: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.room_type) params.append('room_type', filters.room_type);
      if (filters.level) params.append('level', filters.level);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      
      const response = await axios.get(`${AI_ROOM_API}/rooms?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AI rooms:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get AI Virtual Room details
   */
  getRoom: async (roomId) => {
    try {
      const response = await axios.get(`${AI_ROOM_API}/rooms/${roomId}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new AI Virtual Room
   */
  createRoom: async (roomData) => {
    try {
      const response = await axios.post(`${AI_ROOM_API}/rooms`, roomData, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Join AI Virtual Room by code
   */
  joinRoom: async (roomCode, nickname = null) => {
    try {
      const response = await axios.post(
        `${AI_ROOM_API}/rooms/join`,
        { room_code: roomCode, nickname },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Leave AI Virtual Room
   */
  leaveRoom: async (roomId) => {
    try {
      const response = await axios.post(
        `${AI_ROOM_API}/rooms/${roomId}/leave`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error.response?.data || error;
    }
  },

  // === MESSAGES ===

  /**
   * Send message to AI Virtual Room
   */
  sendMessage: async (roomId, messageData) => {
    try {
      const response = await axios.post(
        `${AI_ROOM_API}/rooms/${roomId}/messages`,
        messageData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get messages from AI Virtual Room
   */
  getMessages: async (roomId, limit = 50, offset = 0) => {
    try {
      const response = await axios.get(
        `${AI_ROOM_API}/rooms/${roomId}/messages?limit=${limit}&offset=${offset}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error.response?.data || error;
    }
  },

  // === SESSIONS ===

  /**
   * Start practice session
   */
  startSession: async (roomId) => {
    try {
      const response = await axios.post(
        `${AI_ROOM_API}/sessions/start`,
        { room_id: roomId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * End practice session
   */
  endSession: async (sessionId) => {
    try {
      const response = await axios.post(
        `${AI_ROOM_API}/sessions/${sessionId}/end`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get my practice sessions
   */
  getMySessions: async (limit = 10) => {
    try {
      const response = await axios.get(
        `${AI_ROOM_API}/sessions/my-sessions?limit=${limit}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error.response?.data || error;
    }
  },

  // === CONVERSATION TOPICS ===

  /**
   * Get conversation topics
   */
  getTopics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.level) params.append('level', filters.level);
      if (filters.category) params.append('category', filters.category);
      
      const response = await axios.get(`${AI_ROOM_API}/topics?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create conversation topic (teacher/admin only)
   */
  createTopic: async (topicData) => {
    try {
      const response = await axios.post(`${AI_ROOM_API}/topics`, topicData, {
        headers: getAuthHeader(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error.response?.data || error;
    }
  },

  // === WEBSOCKET CONNECTION ===

  /**
   * Get WebSocket URL for room
   */
  getWebSocketUrl: (roomId) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_URL.replace(/^https?:\/\//, '');
    return `${wsProtocol}//${wsHost}/api/v1/ai-virtual-room/ws/${roomId}?token=${token}`;
  },
};

export default aiVirtualRoomAPI;


