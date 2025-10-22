import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username :'',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stars, setStars] = useState([]);
  const [meteors, setMeteors] = useState([]);

  useEffect(() => {
    // Load animation
    setTimeout(() => setIsLoaded(true), 100);

    // Generate random stars
    const generatedStars = Array.from({ length: 100 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      animationDelay: Math.random() * 3,
      duration: Math.random() * 2 + 2
    }));
    setStars(generatedStars);

    // Create shooting stars periodically
    const meteorInterval = setInterval(() => {
      const newMeteor = {
        id: Date.now(),
        left: Math.random() * 100,
        top: -10,
        delay: 0
      };
      setMeteors(prev => [...prev, newMeteor]);
      
      setTimeout(() => {
        setMeteors(prev => prev.filter(m => m.id !== newMeteor.id));
      }, 2000);
    }, 3000);

    return () => clearInterval(meteorInterval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Add ripple effect
    const button = e.target.querySelector('.sign-in-btn');
    createRipple(button, e);

    console.log('Login with:', formData);
    // Xử lý đăng nhập ở đây
  };

  const createRipple = (button, e) => {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple-effect');
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // Navigate to forgot password page
  };

  

  return (
    <div className={`space-login-container ${isLoaded ? 'loaded' : ''}`}>
      {/* Stars background */}
      <div className="stars-container">
        {stars.map((star, index) => (
          <div
            key={index}
            className="star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.animationDelay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>

      {/* Shooting stars */}
      {meteors.map(meteor => (
        <div
          key={meteor.id}
          className="meteor"
          style={{
            left: `${meteor.left}%`,
            top: `${meteor.top}%`
          }}
        />
      ))}

      {/* Left Section - Space Adventure */}
      <div className="space-left-section">
        <div className="logo-section">
          <div className="logo-icon">
            <div className="logo-symbol">EW</div>
          </div>
          <span className="logo-text">EnglishWebAI</span>
        </div>

        <div className="space-content">
          {/* Large Planet */}
          <div className="planet large-planet">
            <div className="planet-surface">
              <div className="crater crater-1"></div>
              <div className="crater crater-2"></div>
              <div className="crater crater-3"></div>
            </div>
            <div className="planet-shadow"></div>
          </div>

          {/* Small Planets */}
          <div className="planet small-planet-1">
            <div className="planet-ring"></div>
          </div>
          <div className="planet small-planet-2"></div>
          <div className="planet small-planet-3"></div>

          {/* Floating particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}></div>
            ))}
          </div>

          <div className="adventure-text">
            <h1>SIGN IN TO YOUR</h1>
            <h1 className="highlight">ADVENTURE!</h1>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="space-right-section">
        <div className="form-wrapper">
          <div className="form-content">
            <h2 className="form-title">SIGN IN</h2>
            <p className="form-subtitle"></p>

            <form onSubmit={handleSubmit} className="space-form">
              {/* Email Input */}
              <div className="input-container">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="username"
                  name="username"
                  placeholder="Ussername"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="space-input"
                />
              </div>

              {/* Password Input */}
              <div className="input-container">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="space-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="forgot-password-section">
                <button 
                  type="button" 
                  className="forgot-password-link"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button type="submit" className="sign-in-btn">
                <span>Sign in</span>
                <div className="btn-glow"></div>
              </button>
            </form>

            <div className="divider-section">
              <span>Or continue with</span>
            </div>

            <div className="social-buttons">
              <button 
                type="button" 
                className="social-btn google-btn"
                onClick={() => handleSocialLogin('Google')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                </svg>
                <span>Google</span>
              </button>

              <button 
                type="button" 
                className="social-btn facebook-btn"
                onClick={() => handleSocialLogin('Facebook')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            <div className="terms-text">
              By registering you with our <a href="#">Terms and Conditions</a>
            </div>

            {/* Register Link */}
            <div className="register-link">
              Don't have an account? <Link to="/register" className="signup-now-link">Sign up now</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
