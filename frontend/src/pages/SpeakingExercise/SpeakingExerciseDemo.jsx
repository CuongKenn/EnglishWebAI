import React from 'react';
import { Link } from 'react-router-dom';
import { Mic, BookOpen, Star } from 'lucide-react';

const SpeakingExerciseDemo = () => {
  const demoCourses = [
    {
      id: 'g3_speaking',
      title: 'Speaking Cơ Bản Plus',
      description: 'Khóa học phát âm cơ bản cho học sinh lớp 3',
      level: 'Pre-Intermediate',
      totalExercises: 5,
      completedExercises: 0,
      color: '#a855f7'
    },
    {
      id: 'g5_speaking',
      title: 'Conversation Skills',
      description: 'Kỹ năng giao tiếp nâng cao cho học sinh lớp 5',
      level: 'Advanced',
      totalExercises: 2,
      completedExercises: 0,
      color: '#f97316'
    }
  ];

  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            🎤 Speaking Exercise Demo
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#64748b',
            marginBottom: '32px'
          }}>
            Trải nghiệm giao diện làm bài speaking mới với thiết kế hiện đại
          </p>
          
          <div style={{
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            color: '#1e40af',
            padding: '12px 24px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '32px'
          }}>
            <Star size={16} />
            <span>Bài được chấm bởi AI</span>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '24px',
          marginBottom: '40px'
        }}>
          {demoCourses.map(course => (
            <div key={course.id} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                background: `linear-gradient(135deg, ${course.color}20 0%, ${course.color}10 100%)`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  background: course.color,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-block',
                  marginBottom: '12px'
                }}>
                  {course.level}
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  margin: '0 0 8px 0'
                }}>
                  {course.title}
                </h3>
                <p style={{ 
                  color: '#64748b', 
                  fontSize: '14px',
                  margin: '0'
                }}>
                  {course.description}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    Bài tập: {course.completedExercises}/{course.totalExercises}
                  </span>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>
                    0%
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  background: '#e2e8f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: '0%',
                    background: `linear-gradient(90deg, ${course.color} 0%, ${course.color}dd 100%)`,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <Link 
                to={`/speaking/${course.id}`}
                style={{
                  background: course.color,
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 4px 12px ${course.color}40`;
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Mic size={18} />
                Bắt đầu học
              </Link>
            </div>
          ))}
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BookOpen size={20} />
            Tính năng chính
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px'
          }}>
            {[
              { icon: '🎤', title: 'Ghi âm thông minh', desc: 'Sử dụng MediaRecorder API' },
              { icon: '🤖', title: 'Chấm điểm AI', desc: 'Đánh giá phát âm tự động' },
              { icon: '📊', title: 'Phản hồi tức thì', desc: 'Kết quả ngay sau khi hoàn thành' },
              { icon: '📱', title: 'Responsive', desc: 'Tối ưu cho mọi thiết bị' },
              { icon: '🎯', title: 'Nhiều loại bài', desc: 'Từ phát âm đến thuyết trình' },
              { icon: '⚡', title: 'Tốc độ cao', desc: 'Giao diện mượt mà' }
            ].map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#1e293b',
                    fontSize: '14px'
                  }}>
                    {feature.title}
                  </div>
                  <div style={{ 
                    color: '#64748b',
                    fontSize: '12px'
                  }}>
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px',
          padding: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          color: 'white'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Sẵn sàng trải nghiệm?
          </h3>
          <p style={{ 
            fontSize: '16px',
            opacity: '0.9',
            margin: '0'
          }}>
            Click vào bất kỳ khóa học nào ở trên để bắt đầu!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpeakingExerciseDemo;

