// services/api.js
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/users';  // URL của backend Django

// Đăng ký user mới
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register/`, userData);
    return response.data;  // Trả về dữ liệu đăng ký thành công
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};
