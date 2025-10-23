import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isLoggedIn, userRole, requiredRole }) => {
  // Kiểm tra nếu chưa đăng nhập
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra nếu role không đúng
  if (requiredRole && userRole !== requiredRole) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ color: '#ff4444' }}>⛔ Truy cập bị từ chối</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          Bạn không có quyền truy cập vào trang này.
        </p>
        <p style={{ fontSize: '16px', color: '#999' }}>
          Yêu cầu quyền: <strong>{requiredRole}</strong>
        </p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

