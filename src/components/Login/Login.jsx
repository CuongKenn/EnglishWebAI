import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
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
      duration: Math.random() * 2 + 2,
    }));
    setStars(generatedStars);

    // Create shooting stars periodically
    const meteorInterval = setInterval(() => {
      const newMeteor = {
        id: Date.now(),
        left: Math.random() * 100,
        top: -10,
        delay: 0,
      };
      setMeteors((prev) => [...prev, newMeteor]);

      setTimeout(() => {
        setMeteors((prev) => prev.filter((m) => m.id !== newMeteor.id));
      }, 2000);
    }, 3000);

    return () => clearInterval(meteorInterval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Add ripple effect
    const button = e.target.querySelector('.sign-in-btn');
    createRipple(button, e);

    try {
      // Gửi yêu cầu đăng nhập tới API Django
      const response = await axios.post('http://127.0.0.1:8000/api/users/login/', {
        username: formData.username,
        password: formData.password,
      });

      if (response.status === 200) {
        alert('Login successful!');
        navigate('/dashboard'); // Chuyển tới trang dashboard sau khi đăng nhập thành công
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed, please try again.');
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
              animationDuration: `${star.duration}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting stars */}
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="meteor"
          style={{
            left: `${meteor.left}%`,
            top: `${meteor.top}%`,
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
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                }}
              ></div>
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

            <form onSubmit={handleSubmit} className="space-form">
              {/* Username Input */}
              <div className="input-container">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="space-input"
                />
              </div>

              {/* Password Input */}
              <div className="input-container">
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
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
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
                <span>Google</span>
              </button>

              <button
                type="button"
                className="social-btn facebook-btn"
                onClick={() => handleSocialLogin('Facebook')}
              >
                <span>Facebook</span>
              </button>
            </div>

            <div className="register-link">
              Don't have an account?{' '}
              <Link to="/register" className="signup-now-link">
                Sign up now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
