/**
 * AI Image Recognition API
 * Client for ML-based object recognition and vocabulary learning
 */

import { apiV1 } from '../services/api';

const BASE_URL = '/ai/image-recognition';

/**
 * Recognize objects in image and get vocabulary
 * @param {File} file - Image file
 * @param {Object} options - Recognition options
 * @param {string} options.level - beginner | intermediate | advanced
 * @returns {Promise<Object>} Recognition result with vocabulary details
 */
export const recognizeImage = async (file, options = {}) => {
  const { level = 'beginner' } = options;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('level', level);

    const response = await apiV1.post(
      `${BASE_URL}/recognize`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for image processing
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error recognizing image:', error);
    throw error;
  }
};

/**
 * Check service health
 * @returns {Promise<Object>} Service status
 */
export const checkServiceHealth = async () => {
  try {
    const response = await apiV1.get(`${BASE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('Error checking service health:', error);
    throw error;
  }
};
