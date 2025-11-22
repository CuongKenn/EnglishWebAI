// services/otpService.js
import api from './api';

/**
 * OTP Service
 * Xử lý các chức năng liên quan đến OTP
 */
class OTPService {
  /**
   * Gửi OTP đến email người dùng
   * @param {string} email - Email của người dùng
   * @param {string} purpose - Mục đích của OTP (verification, password_reset, etc.)
   */
  async sendOTP(email, purpose = 'verification') {
    try {
      const response = await api.post('/api/v1/otp/send', {
        email,
        purpose
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gửi OTP đến user hiện tại (authenticated)
   * @param {string} purpose - Mục đích của OTP
   */
  async sendOTPToMe(purpose = 'verification') {
    try {
      const response = await api.post('/api/v1/otp/send-to-me', {
        purpose
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Xác thực OTP
   * @param {string} email - Email của người dùng
   * @param {string} otp_code - Mã OTP
   * @param {string} purpose - Mục đích của OTP
   */
  async verifyOTP(email, otp_code, purpose = 'verification') {
    try {
      const response = await api.post('/api/v1/otp/verify', {
        email,
        otp_code,
        purpose
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Gửi lại OTP
   * @param {string} email - Email của người dùng
   * @param {string} purpose - Mục đích của OTP
   */
  async resendOTP(email, purpose = 'verification') {
    try {
      const response = await api.post('/api/v1/otp/resend', {
        email,
        purpose
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Xử lý lỗi
   */
  handleError(error) {
    if (error.response) {
      const detail = error.response.data?.detail;
      if (detail) {
        return new Error(detail);
      }
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('Đã xảy ra lỗi, vui lòng thử lại');
  }
}

// Export singleton instance
const otpService = new OTPService();
export default otpService;
