import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TRANSLATION_API = `${API_URL}/api/v1/translation`;

/**
 * Translation Service - Uses Python deep-translator library
 */
const translationService = {
  /**
   * Translate text to target language
   */
  async translate(text, targetLanguage = 'vi', sourceLanguage = 'auto', engine = 'google') {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TRANSLATION_API}/translate`,
        {
          text,
          target_language: targetLanguage,
          source_language: sourceLanguage,
          engine
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  },

  /**
   * Translate multiple texts at once
   */
  async translateBatch(texts, targetLanguage = 'vi', sourceLanguage = 'auto', engine = 'google') {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TRANSLATION_API}/translate/batch`,
        {
          texts,
          target_language: targetLanguage,
          source_language: sourceLanguage,
          engine
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Batch translation error:', error);
      throw error;
    }
  },

  /**
   * Bidirectional translation (auto-detect and translate)
   */
  async translateBidirectional(text, language1 = 'en', language2 = 'vi', engine = 'google') {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TRANSLATION_API}/translate/bidirectional`,
        {
          text,
          language1,
          language2,
          engine
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Bidirectional translation error:', error);
      throw error;
    }
  },

  /**
   * Detect language of text
   */
  async detectLanguage(text) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${TRANSLATION_API}/detect-language`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Language detection error:', error);
      throw error;
    }
  },

  /**
   * Get list of supported languages
   */
  async getSupportedLanguages() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${TRANSLATION_API}/supported-languages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Get languages error:', error);
      throw error;
    }
  },

  /**
   * Health check for translation service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${TRANSLATION_API}/health`);
      return response.data;
    } catch (error) {
      console.error('Translation health check error:', error);
      throw error;
    }
  }
};

export default translationService;
