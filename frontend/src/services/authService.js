// services/authService.js
import { authAPI, apiUsers } from './api';

/**
 * Authentication Service
 * Xử lý tất cả các chức năng liên quan đến authentication
 */
class AuthService {
  /**
   * Đăng ký tài khoản mới
   */
  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Đăng nhập
   */
  async login(credentials) {
    try {
      const response = await authAPI.login(credentials);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Đăng xuất
   */
  logout() {
    authAPI.logout();
  }
  

  /**
   * Lấy thông tin user hiện tại
   */
  getCurrentUser() {
    return authAPI.getCurrentUser();
  }

  /**
   * Kiểm tra đã đăng nhập
   */
  isAuthenticated() {
    return authAPI.isAuthenticated();
  }

  /**
   * Lấy access token
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Kiểm tra role của user
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Kiểm tra có phải admin không
   */
  isAdmin() {
    return this.hasRole('admin') || this.hasRole('superadmin');
  }

  /**
   * Kiểm tra có phải teacher không
   */
  isTeacher() {
    return this.hasRole('teacher');
  }

  /**
   * Kiểm tra có phải student không
   */
  isStudent() {
    return this.hasRole('user');
  }

  /**
   * Kiểm tra có phải parent không
   */
  isParent() {
    return this.hasRole('parent');
  }

  /**
   * Xử lý lỗi
   */
  handleError(error) {
    if (error.detail) {
      return new Error(error.detail);
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error('Đã xảy ra lỗi, vui lòng thử lại');
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
