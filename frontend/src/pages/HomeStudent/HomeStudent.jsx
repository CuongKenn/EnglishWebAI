import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserGroupIcon, BookOpenIcon, StarIcon, TrophyIcon, 
  ArrowTrendingUpIcon, ChartBarIcon,
  LightBulbIcon, UserCircleIcon, RocketLaunchIcon 
} from '@heroicons/react/24/outline';
import AuthModal from '../../components/Navbar/AuthModal';
import authService from '../../services/authService';
import './HomeStudent.css';const HomeStudent = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [counters, setCounters] = useState({ students: 0, courses: 0, satisfaction: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const sectionRefs = useRef([]);

  // Check if user is logged in and get role
  useEffect(() => {
    const checkLoginStatus = () => {
      const loggedIn = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      setIsLoggedIn(loggedIn);
      setUserRole(user?.role || 'user');
    };
    checkLoginStatus();
    
    // Listen for storage changes
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  const heroStats = [
    { icon: <UserGroupIcon className="w-6 h-6" />, number: '50K+', label: 'Học viên' },
    { icon: <BookOpenIcon className="w-6 h-6" />, number: '200+', label: 'Khóa học' },
    { icon: <StarIcon className="w-6 h-6" />, number: '95%', label: 'Hài lòng' },
    { icon: <TrophyIcon className="w-6 h-6" />, number: '24/7', label: 'Hỗ trợ' },
  ];

  const aiPractices = [
    {
      title: 'AI Writing Assistant',
      description: 'Luyện viết tiếng Anh với AI chấm bài tức thì và gợi ý cải thiện chi tiết',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800',
      category: 'Writing',
      level: 'All Levels',
      duration: '30 phút',
      color: '#6366f1',
      link: '/ai-practice',
      icon: 'fa-pen-fancy',
    },
    {
      title: 'AI Reading Comprehension',
      description: 'Đọc hiểu thông minh với AI phân tích từ vựng và ngữ pháp theo thời gian thực',
      image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
      category: 'Reading',
      level: 'Intermediate',
      duration: '45 phút',
      color: '#06b6d4',
      link: '/ai-practice',
      icon: 'fa-book-reader',
    },
    {
      title: 'AI Conversation Practice',
      description: 'Trò chuyện với AI để nâng cao kỹ năng giao tiếp và phát âm chuẩn xác',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      category: 'Speaking',
      level: 'Advanced',
      duration: '20 phút',
      color: '#8b5cf6',
      link: '/ai-practice',
      icon: 'fa-comments',
    },
  ];

  const features = [
    { icon: <LightBulbIcon className="w-6 h-6" />, title: 'AI Thông Minh', description: 'Học tập cá nhân hóa với AI tiên tiến nhất', color: '#667eea' },
    { icon: <ArrowTrendingUpIcon className="w-6 h-6" />, title: 'Theo Dõi Tiến Độ', description: 'Thống kê chi tiết quá trình học tập', color: '#f093fb' },
    { icon: <ChartBarIcon className="w-6 h-6" />, title: 'Lộ Trình Cá Nhân', description: 'Học theo nhịp độ riêng của bạn', color: '#4facfe' },
    { icon: <TrophyIcon className="w-6 h-6" />, title: 'Chứng Chỉ Uy Tín', description: 'Nhận chứng chỉ được công nhận quốc tế', color: '#43e97b' },
  ];

  const testimonials = [
    { name: 'Nguyễn Văn A', role: 'Sinh viên ĐHQG', avatar: <UserCircleIcon className="w-12 h-12" />, comment: 'Nền tảng tuyệt vời! AI chấm bài rất chính xác và chi tiết. Tôi đã cải thiện Writing từ 6.0 lên 7.5 IELTS chỉ sau 3 tháng.', rating: 5 },
    { name: 'Trần Thị B', role: 'Nhân viên văn phòng', avatar: <UserCircleIcon className="w-12 h-12" />, comment: 'Học linh hoạt, rất phù hợp với người đi làm! Tôi có thể học bất cứ lúc nào, giao diện đẹp và dễ sử dụng.', rating: 5 },
    { name: 'Lê Văn C', role: 'Học sinh lớp 12', avatar: <UserCircleIcon className="w-12 h-12" />, comment: 'Giao diện đẹp, dễ sử dụng! AI Speaking giúp tôi tự tin giao tiếp tiếng Anh hơn rất nhiều. Highly recommended!', rating: 5 },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typing effect for highlight text
  useEffect(() => {
    const text = "AI Intelligence";
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setTypedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTypingComplete(true);
        clearInterval(typingInterval);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 100,
        y: (e.clientY / window.innerHeight - 0.5) * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const animateCounter = (target, key, duration = 2000) => {
      const start = 0;
      const increment = target / (duration / 16);
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setCounters(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 16);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && counters.students === 0) {
          animateCounter(50000, 'students', 2000);
          animateCounter(200, 'courses', 2000);
          animateCounter(95, 'satisfaction', 2000);
        }
      });
    });

    const heroElement = document.querySelector('.hero-stats-new');
    if (heroElement) observer.observe(heroElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % aiPractices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K+';
    return num + (num === 95 ? '%' : '+');
  };

  // Handle navigation with login check
  const handleNavigate = (path) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      navigate(path);
    }
  };

  // Handle search with login check
  const handleSearch = () => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
    } else {
      navigate('/lessons');
    }
  };

  // Get CTA content based on user role
  const getCTAContent = () => {
    if (!isLoggedIn) {
      return {
        title: 'Tham gia cùng hàng nghìn học viên thành công!',
        description: 'Đăng ký miễn phí ngay hôm nay để trải nghiệm học tiếng Anh với AI'
      };
    }

    switch (userRole) {
      case 'admin':
      case 'superadmin':
        return {
          title: 'Quản lý hệ thống hiệu quả!',
          description: 'Truy cập dashboard để quản lý tài khoản, lớp học và theo dõi thống kê'
        };
      
      case 'teacher':
        return {
          title: 'Bắt đầu giảng dạy hiệu quả hơn!',
          description: 'Quản lý lớp học, tạo bài tập và theo dõi tiến độ học sinh của bạn'
        };
      
      case 'parent':
        return {
          title: 'Theo dõi tiến độ con em của bạn!',
          description: 'Xem kết quả học tập và giao tiếp với giáo viên một cách dễ dàng'
        };
      
      default: // student/user
        return {
          title: 'Sẵn sàng bắt đầu hành trình của bạn?',
          description: 'Khám phá các khóa học AI và bắt đầu học ngay hôm nay'
        };
    }
  };

  // Get CTA buttons based on user role
  const getCTAButtons = () => {
    if (!isLoggedIn) {
      return {
        primary: {
          icon: 'fas fa-rocket',
          text: 'Bắt đầu học miễn phí',
          onClick: () => navigate('/register')
        },
        secondary: {
          icon: 'fas fa-book-open',
          text: 'Xem khóa học',
          onClick: () => handleNavigate('/lessons')
        }
      };
    }

    switch (userRole) {
      case 'admin':
      case 'superadmin':
        return {
          primary: {
            icon: 'fas fa-chart-line',
            text: 'Dashboard Admin',
            onClick: () => navigate('/admin-dashboard')
          },
          secondary: {
            icon: 'fas fa-cog',
            text: 'Quản lý hệ thống',
            onClick: () => navigate('/admin-dashboard/settings')
          }
        };
      
      case 'teacher':
        return {
          primary: {
            icon: 'fas fa-chalkboard-teacher',
            text: 'Dashboard Giáo viên',
            onClick: () => navigate('/teacher-dashboard')
          },
          secondary: {
            icon: 'fas fa-users',
            text: 'Quản lý lớp học',
            onClick: () => navigate('/teacher-dashboard')
          }
        };
      
      case 'parent':
        return {
          primary: {
            icon: 'fas fa-chart-bar',
            text: 'Dashboard Phụ huynh',
            onClick: () => navigate('/parent-dashboard')
          },
          secondary: {
            icon: 'fas fa-child',
            text: 'Theo dõi con em',
            onClick: () => navigate('/parent-dashboard')
          }
        };
      
      default: // student/user
        return {
          primary: {
            icon: 'fas fa-robot',
            text: 'Bắt đầu luyện tập AI',
            onClick: () => navigate('/ai-practice')
          },
          secondary: {
            icon: 'fas fa-chalkboard-teacher',
            text: 'Lớp học của tôi',
            onClick: () => navigate('/my-classes')
          }
        };
    }
  };

  return (
    <div className="modern-home">
      <section className="hero-section-new">
        {/* Full-screen Background with Parallax */}
        <div 
          className="hero-background"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        >
          <img 
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop" 
            alt="Learning Background" 
            className="hero-bg-image"
          />
          <div className="hero-overlay"></div>
          <div className="animated-shapes">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className={`shape shape-${i + 1}`}
                style={{
                  animationDelay: `${i * 0.8}s`,
                  transform: `translate(${mousePosition.x * (i + 1) * 0.02}px, ${mousePosition.y * (i + 1) * 0.02}px)`
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="hero-content-wrapper">
          <div className="hero-main-content">
            {/* Top Badge */}
            <div className="hero-top-badge">
              <span className="badge-pulse"></span>
              <span className="badge-text"><RocketLaunchIcon className="w-4 h-4" style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}} /> Nền tảng học tiếng Anh AI #1 Việt Nam</span>
            </div>

            {/* Main Title with Typing Effect */}
            <h1 className="hero-main-title">
              Master English with
              <span className="title-highlight">
                {typedText}
                {!isTypingComplete && <span className="typing-cursor-blink">|</span>}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-main-subtitle">
              Học tiếng Anh thông minh với AI cá nhân hóa - Nâng cao 4 kỹ năng Speaking, Writing, Reading, Listening
            </p>

            {/* Search Box */}
            <div className="hero-search-container">
              <div className="search-box-large">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Tìm khóa học, bài học, chủ đề bạn muốn học..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="search-button" onClick={handleSearch}>
                  <span>Tìm kiếm</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hero-cta-buttons">
              {(() => {
                const buttons = getCTAButtons();
                return (
                  <>
                    <button className="cta-btn cta-primary" onClick={buttons.primary.onClick}>
                      <i className={buttons.primary.icon}></i>
                      <span>{buttons.primary.text}</span>
                    </button>
                    <button className="cta-btn cta-secondary" onClick={buttons.secondary.onClick}>
                      <i className={buttons.secondary.icon}></i>
                      <span>{buttons.secondary.text}</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-icon">
            <div className="scroll-wheel"></div>
          </div>
          <span>Cuộn xuống</span>
        </div>
      </section>

      <section 
        id="ai-practices" 
        ref={el => sectionRefs.current[0] = el}
        className={`ai-practices-section ${isVisible['ai-practices'] ? 'visible' : ''}`}
      >
        <div className="container-full">
          <div className="section-header-new">
            <span className="section-badge-new">
              <i className="fas fa-robot badge-icon"></i>
              Thực hành AI
            </span>
            <h2 className="section-title-new">Luyện tập với AI thông minh</h2>
          </div>
          <div className="ai-practices-wrapper">
            <div className="slider-navigation">
              {aiPractices.map((_, index) => (
                <button
                  key={index}
                  className={`slider-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            <div className="ai-practices-grid">
              {aiPractices.map((practice, index) => (
                <div
                  key={index}
                  className={`ai-practice-card ${currentSlide === index ? 'active' : ''}`}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    transform: currentSlide === index ? 'scale(1.05)' : 'scale(0.95)'
                  }}
                >
                  <div className="practice-image-wrapper">
                    <img src={practice.image} alt={practice.title} />
                    <div 
                      className="practice-overlay" 
                      style={{ background: `linear-gradient(135deg, ${practice.color}dd, ${practice.color}aa)` }}
                    >
                      <i className={`fas ${practice.icon} practice-icon`}></i>
                    </div>
                    <span className="practice-badge" style={{ backgroundColor: practice.color }}>{practice.category}</span>
                  </div>
                  <div className="practice-content">
                    <h3 className="practice-title">{practice.title}</h3>
                    <p className="practice-description">{practice.description}</p>
                    <div className="practice-meta">
                      <div className="meta-item">
                        <i className="fas fa-signal"></i>
                        <span>{practice.level}</span>
                      </div>
                      <div className="meta-item">
                        <i className="fas fa-clock"></i>
                        <span>{practice.duration}</span>
                      </div>
                    </div>
                    <button
                      className="practice-btn"
                      style={{ background: `linear-gradient(135deg, ${practice.color}, ${practice.color}dd)` }}
                      onClick={() => handleNavigate(practice.link)}
                    >
                      Bắt đầu luyện tập <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section 
        id="features" 
        ref={el => sectionRefs.current[1] = el}
        className={`features-section-new ${isVisible['features'] ? 'visible' : ''}`}
      >
        <div className="container-full">
          <div className="section-header-new">
            <span className="section-badge-new">
              <i className="fas fa-bolt badge-icon"></i>
              Tính năng
            </span>
            <h2 className="section-title-new">Vì sao chọn Smart Learn?</h2>
          </div>
          <div className="features-grid-new">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card-new"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className="feature-icon-wrapper" 
                  style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}
                >
                  <span className="feature-icon-new">{feature.icon}</span>
                </div>
                <h3 className="feature-title-new">{feature.title}</h3>
                <p className="feature-description-new">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section 
        id="testimonials" 
        ref={el => sectionRefs.current[2] = el}
        className={`testimonials-section ${isVisible['testimonials'] ? 'visible' : ''}`}
      >
        <div className="container-full">
          <div className="section-header-new">
            <span className="section-badge-new">
              <i className="fas fa-quote-left badge-icon"></i>
              Đánh giá
            </span>
            <h2 className="section-title-new">Học sinh nói gì về chúng tôi?</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="testimonial-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="testimonial-header">
                  <span className="testimonial-avatar">{testimonial.avatar}</span>
                  <div className="testimonial-info">
                    <div className="testimonial-name">{testimonial.name}</div>
                    <div className="testimonial-role">{testimonial.role}</div>
                  </div>
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                </div>
                <p className="testimonial-comment">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section 
        id="cta" 
        ref={el => sectionRefs.current[3] = el}
        className={`cta-section ${isVisible['cta'] ? 'visible' : ''}`}
      >
        <div className="cta-content">
          <div className="cta-icon-wrapper">
            <i className="fas fa-rocket"></i>
          </div>
          <h2 className="cta-title">
            {getCTAContent().title}
          </h2>
          <p className="cta-description">
            {getCTAContent().description}
          </p>
          <div className="cta-buttons">
            {(() => {
              const buttons = getCTAButtons();
              return (
                <>
                  <button className="cta-btn cta-btn-primary" onClick={buttons.primary.onClick}>
                    <i className={buttons.primary.icon}></i>
                    <span>{buttons.primary.text}</span>
                  </button>
                  <button className="cta-btn cta-btn-secondary" onClick={buttons.secondary.onClick}>
                    <i className={buttons.secondary.icon}></i>
                    <span>{buttons.secondary.text}</span>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      <footer className="footer-new">
        <div className="container-full">
          <div className="footer-top">
            <div className="footer-column">
              <div className="footer-logo">
                <h3>English<span className="ai-badge">AI</span></h3>
              </div>
              <p className="footer-description">
                Nền tảng học tiếng Anh với công nghệ AI hàng đầu, giúp bạn tiến bộ nhanh chóng và hiệu quả.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link"><i className="fab fa-facebook-f"></i></a>
                <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                <a href="#" className="social-link"><i className="fab fa-linkedin-in"></i></a>
                <a href="#" className="social-link"><i className="fab fa-youtube"></i></a>
              </div>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Về chúng tôi</h4>
              <ul className="footer-links">
                <li><a href="#">Giới thiệu</a></li>
                <li><a href="#">Đội ngũ</a></li>
                <li><a href="#">Liên hệ</a></li>
                <li><a href="#">Tuyển dụng</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Khóa học</h4>
              <ul className="footer-links">
                <li><a href="#">AI Writing</a></li>
                <li><a href="#">AI Reading</a></li>
                <li><a href="#">AI Speaking</a></li>
                <li><a href="#">AI Listening</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Hỗ trợ</h4>
              <ul className="footer-links">
                <li><a href="#">Trung tâm trợ giúp</a></li>
                <li><a href="#">Hướng dẫn</a></li>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Chính sách</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-title">Nhận tin tức</h4>
              <p className="newsletter-text">
                Đăng ký để nhận thông tin về khóa học mới và ưu đãi
              </p>
              <form className="newsletter-form">
                <input type="email" placeholder="Email của bạn" />
                <button type="submit"><i className="fas fa-paper-plane"></i></button>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright"> 2025 English Web AI. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Điều khoản</a>
              <a href="#">Bảo mật</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default HomeStudent;
