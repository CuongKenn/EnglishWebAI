import React, { useState } from 'react';
import { 
  Calendar, GraduationCap, BookOpen, Target,
  Award, TrendingUp, Clock, CheckCircle, Star, Trophy,
  Zap, Heart, Book, MessageCircle, ChevronRight, BarChart3,
  Headphones, Mic, PenLine
} from 'lucide-react';
import ConsistentSidebarLayout from '../../components/Layout/ConsistentSidebarLayout';

const LearningProfileSimple = () => {

  // navigate not currently used
  const [activeMenuItem, setActiveMenuItem] = useState('profile');
  const [isContentPushed, setIsContentPushed] = useState(false);

  const handleMenuItemClick = (itemId) => {

    setActiveMenuItem(itemId);
    setIsContentPushed(true);
    
    // Reset animation after completion
    setTimeout(() => {
      setIsContentPushed(false);
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <ConsistentSidebarLayout 
        activeMenuItem={activeMenuItem}
        onMenuItemClick={handleMenuItemClick}
        courseTitle="Học bài"
      >
        <div style={{ 
          padding: '24px',
          backgroundColor: 'white',
          minHeight: '100vh',
          marginLeft: '280px',
          transition: 'all 0.3s ease',
          transform: isContentPushed ? 'translateX(20px) scale(0.98)' : 'none',
          boxShadow: isContentPushed ? '0 8px 32px rgba(0, 0, 0, 0.12)' : 'none',
          borderRadius: isContentPushed ? '12px' : '0'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '24px'
          }}>
            Hồ sơ học tập
          </h1>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#3b82f6', marginBottom: '12px' }}>Tổng thời gian học</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>47 giờ 32 phút</p>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#10b981', marginBottom: '12px' }}>Tổng cúp đạt được</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>268 cúp</p>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#f59e0b', marginBottom: '12px' }}>Bài kiểm tra</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>42 bài</p>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h3 style={{ color: '#8b5cf6', marginBottom: '12px' }}>Bài học hoàn thành</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>156 bài</p>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ color: '#1e293b', marginBottom: '16px' }}>Kết quả theo kỹ năng</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}><Headphones className="inline-block w-8 h-8" /></div>
                <h4>Nghe</h4>
                <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>7.5/10</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}><Mic className="inline-block w-8 h-8" /></div>
                <h4>Nói</h4>
                <p style={{ color: '#ec4899', fontWeight: 'bold' }}>6.8/10</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}><BookOpen className="inline-block w-8 h-8" /></div>
                <h4>Đọc</h4>
                <p style={{ color: '#10b981', fontWeight: 'bold' }}>8.2/10</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}><PenLine className="inline-block w-8 h-8" /></div>
                <h4>Viết</h4>
                <p style={{ color: '#f59e0b', fontWeight: 'bold' }}>7.0/10</p>
              </div>
            </div>
          </div>
        </div>
      </ConsistentSidebarLayout>
    </div>
  );
};

export default LearningProfileSimple;
