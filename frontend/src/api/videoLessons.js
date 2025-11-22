import { apiV1 } from '../services/api';

/**
 * Video Lesson API
 * Endpoints for PPT-to-Video generation
 */
export const videoLessonAPI = {
  /**
   * Upload PowerPoint and generate video lesson
   * @param {FormData} formData - Form data with file and settings
   * @returns {Promise<Object>} Video lesson details
   */
  generateFromPPT: async (formData) => {
    const response = await apiV1.post(
      '/video-lessons/generate-from-ppt',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get video lesson by ID
   * @param {number} videoId - Video lesson ID
   * @returns {Promise<Object>} Video lesson details
   */
  getVideoLesson: async (videoId) => {
    const response = await apiV1.get(`/video-lessons/${videoId}`);
    return response.data;
  },

  /**
   * List all video lessons for current teacher
   * @param {Object} params - Query params (skip, limit)
   * @returns {Promise<Array>} List of video lessons
   */
  listVideoLessons: async (params = {}) => {
    const response = await apiV1.get('/video-lessons/', { params });
    return response.data;
  },

  /**
   * Poll video lesson status until completed or failed
   * @param {number} videoId - Video lesson ID
   * @param {number} interval - Polling interval in ms (default 5000)
   * @param {number} maxAttempts - Max polling attempts (default 120 = 10 minutes)
   * @returns {Promise<Object>} Final video lesson details
   */
  pollVideoStatus: async (videoId, interval = 5000, maxAttempts = 120) => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const video = await videoLessonAPI.getVideoLesson(videoId);

          if (video.status === 'completed' || video.status === 'failed') {
            resolve(video);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Polling timeout'));
          } else {
            attempts++;
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  },
};

export default videoLessonAPI;
