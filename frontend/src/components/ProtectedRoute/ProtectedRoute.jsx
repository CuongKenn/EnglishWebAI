import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedRoute = ({ children, isLoggedIn, userRole, requiredRole }) => {
  // Sử dụng authService nếu không truyền props
  const authenticated = isLoggedIn !== undefined ? isLoggedIn : authService.isAuthenticated();
  const role = userRole || authService.getCurrentUser()?.role;

  // Kiểm tra nếu chưa đăng nhập
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra nếu role không đúng
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.includes(role)
      : role === requiredRole;

    if (!hasRequiredRole) {
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
            Yêu cầu quyền: <strong>{Array.isArray(requiredRole) ? requiredRole.join(' hoặc ') : requiredRole}</strong>
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
  }

  return children;
};

export default ProtectedRoute;

