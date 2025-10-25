import React from 'react';
import { useParams } from 'react-router-dom';

const TestSpeaking = () => {
  const { courseId } = useParams();
  
  console.log('TestSpeaking component loaded with courseId:', courseId);
  
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
        🎤 SPEAKING EXERCISE
      </h1>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'normal' }}>
        Course ID: <strong>{courseId}</strong>
      </h2>
      <p style={{ fontSize: '18px', opacity: '0.9', marginBottom: '30px' }}>
        ✅ Route /speaking/:courseId đã hoạt động thành công!
      </p>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.2)',
        padding: '30px',
        borderRadius: '16px',
        marginTop: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        maxWidth: '600px'
      }}>
        <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>🎯 Debug Information:</h3>
        <div style={{ textAlign: 'left', fontSize: '16px', lineHeight: '1.6' }}>
          <p><strong>✅ Route:</strong> /speaking/{courseId}</p>
          <p><strong>✅ Component:</strong> TestSpeaking (thay thế SpeakingExercise)</p>
          <p><strong>✅ Status:</strong> Hoạt động bình thường</p>
          <p><strong>✅ Next Step:</strong> Thay TestSpeaking bằng SpeakingExercise thật</p>
        </div>
      </div>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        fontSize: '14px',
        opacity: '0.8'
      }}>
        <p>🔧 <strong>Debug Console:</strong> Mở Developer Tools (F12) để xem console.log</p>
      </div>
    </div>
  );
};

export default TestSpeaking;
