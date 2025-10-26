import React from 'react';

const LearningProfileTest = () => {
  console.log('LearningProfileTest component is rendering');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: 'red', fontSize: '24px' }}>Learning Profile Test Page</h1>
      <p style={{ color: 'blue', fontSize: '16px' }}>Nếu bạn thấy trang này, có nghĩa là routing hoạt động!</p>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h2>Thông tin test:</h2>
        <ul>
          <li>Component đã render thành công</li>
          <li>CSS đã được load</li>
          <li>JavaScript đã hoạt động</li>
        </ul>
      </div>
    </div>
  );
};

export default LearningProfileTest;
