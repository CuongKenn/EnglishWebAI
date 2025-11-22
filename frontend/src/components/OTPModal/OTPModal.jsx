import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './OTPModal.css';

const OTPModal = ({ 
  isOpen, 
  onClose, 
  onVerify, 
  email, 
  purpose = 'verification',
  onResend 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setTimer(300);
      setOtp(['', '', '', '', '', '']);
      setError('');
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (timer > 0 && isOpen) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all fields filled
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus last filled input or next empty one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto submit if all filled
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 số');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await onVerify(otpCode);
    } catch (err) {
      setError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    
    try {
      await onResend();
      setTimer(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  const getPurposeText = () => {
    switch (purpose) {
      case 'verification':
        return 'xác thực email';
      case 'password_reset':
        return 'đặt lại mật khẩu';
      case '2fa':
        return 'xác thực hai yếu tố';
      default:
        return 'xác thực';
    }
  };

  return (
    <div className="otp-modal-overlay" onClick={onClose}>
      <div className="otp-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="otp-modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="otp-modal-header">
          <div className="otp-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Nhập mã OTP</h2>
          <p>Chúng tôi đã gửi mã {getPurposeText()} đến</p>
          <p className="email-text">{email}</p>
        </div>

        <div className="otp-input-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="otp-input"
              disabled={isVerifying}
            />
          ))}
        </div>

        {error && <div className="otp-error">{error}</div>}

        <div className="otp-timer">
          {timer > 0 ? (
            <span>Mã OTP hết hạn sau: <strong>{formatTime(timer)}</strong></span>
          ) : (
            <span className="expired">Mã OTP đã hết hạn</span>
          )}
        </div>

        <button
          className="otp-verify-btn"
          onClick={() => handleVerify()}
          disabled={otp.some(d => !d) || isVerifying}
        >
          {isVerifying ? (
            <>
              <span className="spinner"></span>
              Đang xác thực...
            </>
          ) : (
            'Xác thực'
          )}
        </button>

        <div className="otp-resend">
          <span>Không nhận được mã?</span>
          <button
            onClick={handleResend}
            disabled={isResending || timer > 240}
            className="resend-btn"
          >
            {isResending ? 'Đang gửi...' : 'Gửi lại'}
          </button>
        </div>
      </div>
    </div>
  );
};

OTPModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  email: PropTypes.string.isRequired,
  purpose: PropTypes.string,
  onResend: PropTypes.func.isRequired,
};

export default OTPModal;
