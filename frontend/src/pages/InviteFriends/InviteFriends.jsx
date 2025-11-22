import React, { useState } from 'react';
import { UserPlusIcon, ClipboardDocumentIcon, CheckIcon, ShareIcon } from '@heroicons/react/24/outline';
import './InviteFriends.css';

const InviteFriends = () => {
  const [copied, setCopied] = useState(false);
  const inviteCode = 'SMARTLEARN2024';
  const inviteLink = `https://smartlearn.vn/register?ref=${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="invite-friends-page">
      <div className="invite-header">
        <UserPlusIcon size={48} />
        <h1>Giới thiệu bạn bè</h1>
        <p>Chia sẻ Smart Learn với bạn bè và nhận ưu đãi!</p>
      </div>

      <div className="invite-content">
        <div className="invite-card">
          <div className="invite-icon">
            <ShareIcon size={64} />
          </div>
          <h2>Mã giới thiệu của bạn</h2>
          <div className="invite-code-box">
            <code className="invite-code">{inviteCode}</code>
          </div>
          
          <div className="invite-link-box">
            <input 
              type="text" 
              value={inviteLink} 
              readOnly 
              className="invite-link-input"
            />
            <button 
              className="copy-btn" 
              onClick={handleCopy}
              title="Sao chép link"
            >
              {copied ? <CheckIcon size={20} /> : <ClipboardDocumentIcon size={20} />}
            </button>
          </div>

          <div className="invite-benefits">
            <h3>Lợi ích khi giới thiệu:</h3>
            <ul>
              <li>🎁 Bạn nhận 1 tháng học miễn phí khi bạn bè đăng ký</li>
              <li>🎓 Bạn bè nhận giảm giá 20% cho lần đăng ký đầu tiên</li>
              <li>⭐ Tích điểm để đổi quà và ưu đãi đặc biệt</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteFriends;

