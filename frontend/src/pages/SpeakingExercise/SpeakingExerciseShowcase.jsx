import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, Volume2, Play, Sparkles, Star, Zap } from 'lucide-react';

const SpeakingExerciseShowcase = () => {
  const features = [
    {
      icon: <Mic size={24} />,
      title: 'Ghi âm thông minh',
      description: 'Sử dụng MediaRecorder API với chất lượng cao',
      color: '#ef4444'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Chấm điểm AI',
      description: 'Đánh giá phát âm tự động với độ chính xác cao',
      color: '#3b82f6'
    },
    {
      icon: <Volume2 size={24} />,
      title: 'Phát lại audio',
      description: 'Nghe lại bản ghi âm với điều khiển chuyên nghiệp',
      color: '#10b981'
    },
    {
      icon: <Zap size={24} />,
      title: 'Phản hồi tức thì',
      description: 'Kết quả và điểm số hiển thị ngay lập tức',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px', color: 'white' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎤 Speaking Exercise
          </h1>
          <p style={{ 
            fontSize: '20px', 
            opacity: '0.9',
            marginBottom: '30px'
          }}>
            Giao diện mới với thiết kế premium, lấy cảm hứng từ Prep
          </p>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '25px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '16px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            marginBottom: '40px'
          }}>
            <Sparkles size={20} />
            <span>Bài được chấm bởi AI</span>
          </div>
        </div>

        {/* Preview Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '30px',
          marginBottom: '50px'
        }}>
          {/* Exercise Card Preview */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'transform 0.2s ease'
          }}>
            <div style={{
              background: '#10b981',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Volume2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: '0 0 5px 0' }}>
                Pronunciation
              </h3>
              <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>
                Câu trả lời của bạn
              </p>
            </div>
          </div>

          {/* Audio Player Preview */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: '#3b82f6',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Play size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                height: '6px',
                background: '#e0e0e0',
                borderRadius: '3px',
                marginBottom: '8px'
              }}>
                <div style={{
                  height: '100%',
                  background: '#3b82f6',
                  borderRadius: '3px',
                  width: '30%'
                }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                00:01 / 00:03
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '50px'
        }}>
          {features.map((feature, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              padding: '25px',
              textAlign: 'center',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{
                background: feature.color,
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                margin: '0 auto 20px auto',
                boxShadow: `0 8px 20px ${feature.color}40`
              }}>
                {feature.icon}
              </div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#1e293b',
                marginBottom: '10px'
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#64748b',
                lineHeight: '1.5',
                margin: '0'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1e293b',
            marginBottom: '15px'
          }}>
            Sẵn sàng trải nghiệm?
          </h2>
          <p style={{ 
            fontSize: '18px', 
            color: '#64748b',
            marginBottom: '30px'
          }}>
            Giao diện mới với thiết kế hiện đại, tối ưu cho trải nghiệm học tập tốt nhất
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/speaking/g3_speaking"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 20px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              <Mic size={20} />
              Thử ngay
            </Link>
            
            <Link 
              to="/my-courses"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              <Star size={20} />
              Xem khóa học
            </Link>
          </div>
        </div>

        {/* Design Principles */}
        <div style={{
          marginTop: '50px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '30px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            🎨 Nguyên tắc thiết kế
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            color: 'white'
          }}>
            {[
              'Gradient background đẹp mắt',
              'Cards trắng với shadow mềm mại',
              'Icons màu sắc rõ ràng',
              'Typography dễ đọc',
              'Responsive design',
              'Animation mượt mà'
            ].map((principle, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                {principle}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingExerciseShowcase;
