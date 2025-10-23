import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios để gửi yêu cầu API
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stars, setStars] = useState([]);
  const [meteors, setMeteors] = useState([]);
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

   // Kiểm tra mật khẩu và mật khẩu xác nhận có khớp hay không
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Kiểm tra các trường đã được điền đầy đủ chưa
    if (!formData.name || !formData.phone || !formData.password || !formData.confirmPassword) {
      alert('Please fill in all fields!');
      return;
    }

    // Add ripple effect
    const button = e.target.querySelector('.sign-up-btn');
    createRipple(button, e);

    try {
      // Gửi yêu cầu đăng ký tới API Django
      const response = await axios.post('http://127.0.0.1:8000/api/users/register/', {
        username: formData.name,
        phone: formData.phone,
        email: formData.email,    // Gửi email
        password: formData.password,
        confirmPassword: formData.confirmPassword, // Gửi confirmPassword
      }); 

       if (response.status === 201) {
        alert('Registration successful!');
        navigate('/login'); // Chuyển tới trang đăng nhập sau khi đăng ký thành công
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed, please try again.');
    }
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

  const handleSocialRegister = (provider) => {
    console.log(`Register with ${provider}`);
  };

  const handleNavigateToLogin = () => {
    navigate('/login'); // Chuyển đến trang login
  };

  return (
    <div className={`space-register-container ${isLoaded ? 'loaded' : ''}`}>
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
            <h1>START YOUR</h1>
            <h1 className="highlight">JOURNEY!</h1>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="space-right-section">
        <div className="form-wrapper">
          <div className="form-content">
            <h2 className="form-title">SIGN UP</h2>
            <p className="form-subtitle">Create your account to get started</p>

            <form onSubmit={handleSubmit} className="space-form">
              {/* Full Name */}
              <div className="input-container">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="space-input"
                />
              </div>

              {/* Phone Number */}
              <div className="input-container">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="space-input"
                />
              </div>

              {/* Password */}
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
                  onChange={handleChange}
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

              {/* Confirm Password */}
              <div className="input-container">
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="space-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
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

               {/* Email */}
   <div className="input-container">
    <div className="input-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 12l8-5-8-5-8 5z"></path>
        <path d="M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7l-8 5z"></path>
      </svg>
    </div>
    <input
      type="email"
      name="email"
      placeholder="Email"
      value={formData.email}
      onChange={handleChange}
      required
      className="space-input"
    />
  </div>

              {/* Create Account Button */}
              <button type="submit" className="sign-up-btn">
                <span>Create Account</span>
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
                onClick={() => handleSocialRegister('Google')}
              >
                <svg className="social-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="terms-text">
              By registering you with our <a href="#">Terms and Conditions</a>
            </div>

            {/* Sign In Link */}
            <div className="signin-link">
              Already have an account? <button type="button" onClick={handleNavigateToLogin}>Sign in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
