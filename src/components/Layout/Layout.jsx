import React from 'react';
import Navbar from '../Navbar/Navbar';
import ScrollAnimations from '../Animations/ScrollAnimations';
import './Layout.css';

const Layout = ({ children, userRole = 'student', isLoggedIn = false, onLogout }) => {
  return (
    <div className="layout">
      <ScrollAnimations />
      <Navbar userRole={userRole} isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
