import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============= READING API =============
export const getReadingPassage = async (unitId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/content/units/${unitId}/reading`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    // Don't log 404 - it's expected when no rich content exists
    if (error.response?.status !== 404) {
      console.error('Error fetching reading passage:', error);
    }
    throw error;
  }
};

export const createReadingPassage = async (unitId, data) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/content/units/${unitId}/reading`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating reading passage:', error);
    throw error;
  }
};

export const updateReadingPassage = async (passageId, data) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/v1/content/reading/${passageId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating reading passage:', error);
    throw error;
  }
};

export const deleteReadingPassage = async (passageId) => {
  try {
    await axios.delete(
      `${API_URL}/api/v1/content/reading/${passageId}`,
      { headers: getAuthHeader() }
    );
  } catch (error) {
    console.error('Error deleting reading passage:', error);
    throw error;
  }
};

// ============= WRITING API =============
export const getWritingPrompt = async (unitId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/content/units/${unitId}/writing`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    // Don't log 404 - it's expected when no rich content exists
    if (error.response?.status !== 404) {
      console.error('Error fetching writing prompt:', error);
    }
    throw error;
  }
};

export const createWritingPrompt = async (unitId, data) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/content/units/${unitId}/writing`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating writing prompt:', error);
    throw error;
  }
};

export const updateWritingPrompt = async (promptId, data) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/v1/content/writing/${promptId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating writing prompt:', error);
    throw error;
  }
};

export const deleteWritingPrompt = async (promptId) => {
  try {
    await axios.delete(
      `${API_URL}/api/v1/content/writing/${promptId}`,
      { headers: getAuthHeader() }
    );
  } catch (error) {
    console.error('Error deleting writing prompt:', error);
    throw error;
  }
};

// ============= LISTENING API =============
export const getListeningAudio = async (unitId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/content/units/${unitId}/listening`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    // Don't log 404 - it's expected when no rich content exists
    if (error.response?.status !== 404) {
      console.error('Error fetching listening audio:', error);
    }
    throw error;
  }
};

export const createListeningAudio = async (unitId, data) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/content/units/${unitId}/listening`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating listening audio:', error);
    throw error;
  }
};

export const updateListeningAudio = async (audioId, data) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/v1/content/listening/${audioId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating listening audio:', error);
    throw error;
  }
};

export const deleteListeningAudio = async (audioId) => {
  try {
    await axios.delete(
      `${API_URL}/api/v1/content/listening/${audioId}`,
      { headers: getAuthHeader() }
    );
  } catch (error) {
    console.error('Error deleting listening audio:', error);
    throw error;
  }
};

// ============= SPEAKING API =============
export const getSpeakingPrompt = async (unitId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/content/units/${unitId}/speaking`,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    // Don't log 404 - it's expected when no rich content exists
    if (error.response?.status !== 404) {
      console.error('Error fetching speaking prompt:', error);
    }
    throw error;
  }
};

export const createSpeakingPrompt = async (unitId, data) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/v1/content/units/${unitId}/speaking`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating speaking prompt:', error);
    throw error;
  }
};

export const updateSpeakingPrompt = async (promptId, data) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/v1/content/speaking/${promptId}`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating speaking prompt:', error);
    throw error;
  }
};

export const deleteSpeakingPrompt = async (promptId) => {
  try {
    await axios.delete(
      `${API_URL}/api/v1/content/speaking/${promptId}`,
      { headers: getAuthHeader() }
    );
  } catch (error) {
    console.error('Error deleting speaking prompt:', error);
    throw error;
  }
};

export default {
  // Reading
  getReadingPassage,
  createReadingPassage,
  updateReadingPassage,
  deleteReadingPassage,
  // Writing
  getWritingPrompt,
  createWritingPrompt,
  updateWritingPrompt,
  deleteWritingPrompt,
  // Listening
  getListeningAudio,
  createListeningAudio,
  updateListeningAudio,
  deleteListeningAudio,
  // Speaking
  getSpeakingPrompt,
  createSpeakingPrompt,
  updateSpeakingPrompt,
  deleteSpeakingPrompt,
};

