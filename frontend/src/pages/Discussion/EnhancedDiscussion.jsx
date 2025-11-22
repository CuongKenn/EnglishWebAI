import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Sparkles,
  Bot
} from 'lucide-react';
import './EnhancedDiscussion.css';
import Discussion from './Discussion';
import GroupRoom from './GroupRoom/GroupRoom';
import AIVirtualRoom from './AIVirtualRoom/AIVirtualRoom';

const EnhancedDiscussion = () => {
  const [activeTab, setActiveTab] = useState('questions');

  const tabs = [
    {
      id: 'questions',
      label: 'Đặt câu hỏi',
      icon: MessageSquare,
      color: '#667eea',
      component: Discussion
    },
    {
      id: 'group',
      label: 'Trao Đổi Nhóm',
      icon: Users,
      color: '#4facfe',
      component: GroupRoom
    },
    {
      id: 'ai-room',
      label: 'Phòng Học Ảo AI',
      icon: Bot,
      color: '#f59e0b',
      component: AIVirtualRoom
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Discussion;

  return (
    <div className="enhanced-discussion-container">
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '16px 32px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <Sparkles size={32} style={{ color: '#667eea' }} />
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Hỏi Đáp Thông Minh
          </h1>
        </div>
        <p style={{
          color: 'white',
          marginTop: '12px',
          fontSize: '16px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          Học tập, thi đấu và giao tiếp - Tất cả trong một!
        </p>
      </div>

      {/* Scrollable Tab Navigation */}
      <div className="discussion-tabs-wrapper">
        <div className="discussion-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`discussion-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...(activeTab === tab.id && {
                    background: `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}dd 100%)`
                  })
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="discussion-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default EnhancedDiscussion;
