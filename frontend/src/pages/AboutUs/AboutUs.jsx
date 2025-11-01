import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';

const AboutUs = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState(0);

  // Set dark background when component mounts
  useEffect(() => {
    const originalBodyBg = document.body.style.background;
    const originalHtmlBg = document.documentElement.style.background;
    const layout = document.querySelector('.layout');
    const mainContent = document.querySelector('.main-content');
    
    // Set dark background
    document.body.style.background = '#0a0e27';
    document.documentElement.style.background = '#0a0e27';
    if (layout) layout.style.background = '#0a0e27';
    if (mainContent) mainContent.style.background = '#0a0e27';
    
    return () => {
      // Restore original backgrounds
      document.body.style.background = originalBodyBg;
      document.documentElement.style.background = originalHtmlBg;
      if (layout) layout.style.background = '';
      if (mainContent) mainContent.style.background = '';
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determine active section
      const sections = document.querySelectorAll('.about-section');
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          setActiveSection(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Animate elements on scroll
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="about-us-container">
      {/* Navigation Dots */}
      <div className="scroll-indicators">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`indicator-dot ${activeSection === index ? 'active' : ''}`}
            onClick={() => scrollToSection(`section-${index}`)}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section id="section-0" className="hero-section about-section fade-in-section">
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="hero-layout">
          {/* Rubik Cube on the left */}
          <div className="hero-book-side">
            <div className="rubik-container" style={{ transform: `translateY(${Math.max(0, 100 - scrollY * 0.5)}px)` }}>
              <div className="rubik-glow"></div>
              <div className="rubik-cube">
                <div className="cube-face front"></div>
                <div className="cube-face back"></div>
                <div className="cube-face right"></div>
                <div className="cube-face left"></div>
                <div className="cube-face top"></div>
                <div className="cube-face bottom"></div>
              </div>
            </div>
          </div>

          {/* Content on the right */}
          <div className="hero-content">
            <h1 className="main-title" data-text="Về chúng tôi">
              Về chúng tôi
            </h1>
            <div className="subtitle-container">
              <span className="subtitle-label">Sứ mệnh của chúng tôi</span>
              <h2 className="hero-subtitle">
                Kiến tạo tương lai
                <br />
                <span className="gradient-text">giáo dục tiếng Anh</span>
                <br />
                với công nghệ AI thông minh
              </h2>
            </div>
          </div>
        </div>

        {/* Button in center */}
        <div className="hero-button-center">
          <button className="scroll-indicator-btn" onClick={() => scrollToSection('section-1')}>
            <span>Khám phá thêm</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Mission Section */}
      <section id="section-1" className="mission-section about-section fade-in-section">
        <div className="section-background">
          <div className="bg-gradient bg-gradient-1"></div>
          <div className="bg-gradient bg-gradient-2"></div>
        </div>
        
        <div className="mission-layout">
          {/* Rubik Cube with clouds on the left */}
          <div className="mission-rubik-side">
            {/* Floating clouds */}
            <div className="floating-clouds">
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              <div className="cloud cloud-3"></div>
            </div>
            
            <div className="rubik-container-small" style={{ transform: `translateY(${Math.max(0, 150 - scrollY * 0.3)}px)` }}>
              <div className="rubik-glow-small"></div>
              <div className="rubik-cube-small">
                <div className="cube-face front"></div>
                <div className="cube-face back"></div>
                <div className="cube-face right"></div>
                <div className="cube-face left"></div>
                <div className="cube-face top"></div>
                <div className="cube-face bottom"></div>
              </div>
            </div>
            
            {/* Light beam shining on text */}
            <div className="light-beam"></div>
          </div>

          {/* Text content on the right */}
          <div className="mission-content">
            <h2 className="section-title">Sứ mệnh của chúng tôi</h2>
            
            <div className="mission-text">
              <p className="mission-main">
                Xây dựng một hệ sinh thái học tiếng Anh toàn diện, hiện đại và thông minh, 
                giúp người học Việt Nam tiếp cận phương pháp giáo dục tiên tiến nhất, 
                mang lại trải nghiệm học tập hiệu quả và thú vị hơn bao giờ hết.
              </p>
              
              <p className="mission-description">
                Bằng cách khai thác sức mạnh của trí tuệ nhân tạo (AI), chúng tôi thổi hồn mới vào 
                phương pháp giảng dạy truyền thống và biến đổi cơ sở hạ tầng giáo dục thành một 
                hệ thống linh hoạt, thích ứng và hiệu quả hơn. Chúng tôi tin rằng việc học tiếng Anh 
                không chỉ là ghi nhớ từ vựng và ngữ pháp, mà là một hành trình khám phá, trải nghiệm 
                và phát triển toàn diện các kỹ năng ngôn ngữ.
              </p>
              
              <p className="mission-description">
                Nền tảng EnglishWebAI được thiết kế để đáp ứng nhu cầu của mọi đối tượng học viên, 
                từ học sinh tiểu học đến người đi làm muốn nâng cao trình độ. Với công nghệ AI tiên tiến, 
                chúng tôi cung cấp trải nghiệm học tập được cá nhân hóa, phản hồi tức thì và chính xác, 
                cùng với hệ thống đánh giá thông minh giúp người học nắm bắt được tiến độ của mình 
                một cách rõ ràng và khoa học.
              </p>

              <p className="mission-description">
                Chúng tôi không chỉ phát triển một ứng dụng học tiếng Anh, mà đang xây dựng một 
                cộng đồng học tập năng động, nơi giáo viên có thể tối ưu hóa phương pháp giảng dạy, 
                học sinh được khuyến khích phát triển kỹ năng một cách tự nhiên, và phụ huynh có thể 
                theo dõi sát sao quá trình tiến bộ của con em mình. Sứ mệnh của chúng tôi là làm cho 
                việc học tiếng Anh trở nên dễ dàng, thú vị và hiệu quả hơn cho mọi người học ở Việt Nam, 
                góp phần nâng cao năng lực ngoại ngữ của thế hệ trẻ trong kỷ nguyên toàn cầu hóa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="section-2" className="pillars-section about-section fade-in-section">
        <h2 className="section-title">Ba trụ cột cốt lõi</h2>
        
        <div className="pillars-grid">
          <div className="pillar-card pillar-1">
            <div className="pillar-header">
              <div className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                  <path d="M16.24 7.76l-2.12 2.12"/>
                </svg>
              </div>
              <h3>Học tập thông minh với AI</h3>
            </div>
            <p>
              Phát triển hệ thống AI tự động hóa, linh hoạt và thích ứng với từng học viên. 
              Công nghệ nhận dạng giọng nói Azure Speech giúp đánh giá phát âm chính xác, 
              trong khi GPT-4 hỗ trợ chấm điểm tự động các dạng bài tập từ trắc nghiệm, 
              điền từ, đến viết luận. Mỗi học sinh nhận được lộ trình học tập được cá nhân hóa, 
              phù hợp với trình độ và tốc độ học của riêng mình.
            </p>
          </div>

          <div className="pillar-card pillar-2">
            <div className="pillar-header">
              <div className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 3v18"/>
                  <path d="M15 3v18"/>
                </svg>
              </div>
              <h3>Nâng cao hệ thống giảng dạy</h3>
            </div>
            <p>
              Cải thiện quy trình quản lý lớp học cho giáo viên, trường học và trung tâm đào tạo. 
              Hệ thống quản lý bài giảng, tài liệu, bài tập và kiểm tra được tự động hóa hoàn toàn. 
              Giáo viên có thể tạo đề thi từ ngân hàng câu hỏi phong phú, theo dõi tiến độ học tập 
              của từng học sinh qua dashboard phân tích chi tiết, và giao tiếp trực tiếp với phụ huynh 
              thông qua hệ thống nhắn tin tích hợp.
            </p>
          </div>

          <div className="pillar-card pillar-3">
            <div className="pillar-header">
              <div className="pillar-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Cải thiện trải nghiệm học tập</h3>
            </div>
            <p>
              Mang đến trải nghiệm học tiếng Anh mượt mà, trực quan và thú vị cho người học. 
              Giao diện thân thiện, thiết kế hiện đại giúp học sinh dễ dàng tiếp cận và sử dụng. 
              Hệ thống gamification với điểm thưởng, bảng xếp hạng tạo động lực học tập. 
              Tính năng thảo luận diễn đàn, nhóm học tập xây dựng cộng đồng sôi động. 
              Phụ huynh có thể theo dõi con em thông qua dashboard chuyên dụng, nhận thông báo 
              về tiến độ học tập và kết quả kiểm tra.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="section-3" className="technology-section about-section fade-in-section">
        <div className="tech-background">
          <div className="tech-grid"></div>
        </div>
        
        <h2 className="section-title">Công nghệ tiên tiến</h2>
        
        <div className="tech-content">
          <div className="tech-showcase">
            <div className="tech-item">
              <div className="tech-icon">🤖</div>
              <h4>OpenAI GPT-4</h4>
              <p>Chấm điểm tự động các dạng bài tập phức tạp, tạo nội dung học tập cá nhân hóa</p>
            </div>

            <div className="tech-item">
              <div className="tech-icon">🎙️</div>
              <h4>Azure Speech SDK</h4>
              <p>Đánh giá phát âm, độ chính xác và độ trôi chảy khi nói tiếng Anh</p>
            </div>

            <div className="tech-item">
              <div className="tech-icon">📊</div>
              <h4>Analytics Dashboard</h4>
              <p>Phân tích chi tiết tiến độ học tập với biểu đồ trực quan và báo cáo thông minh</p>
            </div>

            <div className="tech-item">
              <div className="tech-icon">💬</div>
              <h4>Real-time Communication</h4>
              <p>Hệ thống tin nhắn, thông báo và tương tác thời gian thực</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="section-4" className="vision-section about-section fade-in-section">
        <div className="vision-content">
          <div className="vision-text">
            <h2 className="section-title">Tầm nhìn của chúng tôi</h2>
            <p className="vision-description">
              Chúng tôi hướng đến việc trở thành nền tảng học tiếng Anh trực tuyến hàng đầu tại Việt Nam, 
              nơi công nghệ AI không chỉ là công cụ hỗ trợ mà là người đồng hành thông minh trong hành trình 
              chinh phục ngoại ngữ của mỗi học viên.
            </p>
            
            <p className="vision-description">
              Trong 5 năm tới, EnglishWebAI sẽ phục vụ hàng triệu học sinh và giáo viên trên toàn quốc, 
              góp phần nâng cao năng lực tiếng Anh của thế hệ trẻ Việt Nam, giúp các em tự tin giao tiếp 
              và hội nhập với thế giới. Chúng tôi tin rằng ngôn ngữ là chìa khóa mở ra cơ hội, và AI là 
              cây cầu giúp mọi người tiếp cận tri thức một cách công bằng và hiệu quả nhất.
            </p>

            <div className="vision-stats">
              <div className="stat-item">
                <div className="stat-number">100%</div>
                <div className="stat-label">Tự động chấm điểm</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Hỗ trợ học tập</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Bài tập đa dạng</div>
              </div>
            </div>
          </div>

          <div className="vision-image">
            <div className="floating-elements">
              <div className="floating-card card-1">
                <span className="card-icon">📚</span>
                <span>Học liệu phong phú</span>
              </div>
              <div className="floating-card card-2">
                <span className="card-icon">🎯</span>
                <span>Mục tiêu rõ ràng</span>
              </div>
              <div className="floating-card card-3">
                <span className="card-icon">🏆</span>
                <span>Thành tích vượt trội</span>
              </div>
              <div className="floating-card card-4">
                <span className="card-icon">👥</span>
                <span>Cộng đồng học tập</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-container">
          <h3 className="contact-title">Thông tin liên hệ</h3>
          <p className="contact-description">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn
          </p>
          
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h4>Email</h4>
              <div>
                <p>contact@englishwebai.com</p>
                <p>support@englishwebai.com</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-phone"></i>
              </div>
              <h4>Điện thoại</h4>
              <div>
                <p>Hotline: 1900 xxxx</p>
                <p>Zalo: 0xxx xxx xxx</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h4>Địa chỉ</h4>
              <div>
                <p>123 Đường ABC, Quận XYZ</p>
                <p>Thành phố Hồ Chí Minh</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <i className="fas fa-clock"></i>
              </div>
              <h4>Giờ làm việc</h4>
              <div>
                <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                <p>Thứ 7: 8:00 - 12:00</p>
              </div>
            </div>
          </div>

          <div className="social-links">
            <h4>Kết nối với chúng tôi</h4>
            <div className="social-icons">
              <a href="#" className="social-icon" title="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-icon" title="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-icon" title="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" className="social-icon" title="LinkedIn">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="social-icon" title="TikTok">
                <i className="fab fa-tiktok"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;

