import React, { useState } from 'react';
import './ShareModal.css';
import { UI_CONFIG } from '../../config/constants';

const ShareModal = ({ isOpen, onClose, shareUrl, title = 'Chia sẻ bài viết' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_CONFIG.COPIED_INDICATOR_DURATION);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_CONFIG.COPIED_INDICATOR_DURATION);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3 className="share-modal-title">
            <i className="fas fa-share-alt"></i>
            {title}
          </h3>
          <button className="share-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="share-modal-body">
          <div className="share-modal-message">
            <i className="fas fa-info-circle"></i>
            <p>Không thể chia sẻ tự động. Hãy sao chép liên kết bên dưới:</p>
          </div>

          <div className="share-modal-url-section">
            <div className="share-url-display">
              <span className="share-url-text">{shareUrl}</span>
            </div>
            <button
              className={`share-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copied ? 'Đã sao chép!' : 'Sao chép'}
            </button>
          </div>

          <div className="share-modal-actions">
            <button className="share-modal-btn secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
