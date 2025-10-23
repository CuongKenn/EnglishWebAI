import React, { useState, useEffect } from 'react';
import './Materials.css';

const Materials = () => {
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Mock data
  useEffect(() => {
    const mockMaterials = [
      {
        id: 1,
        title: 'Toán lớp 2 - Phép cộng trừ cơ bản',
        subject: 'Toán',
        grade: 'Lớp 2',
        description: 'Học các phép cộng trừ cơ bản từ 1-100',
        image: '📚',
        color: 'blue',
        lessons: 15,
        duration: '2 tuần',
        difficulty: 'Dễ',
        progress: 0,
        chapters: [
          { id: 1, title: 'Phép cộng trong phạm vi 20', lessons: 5, completed: 0 },
          { id: 2, title: 'Phép trừ trong phạm vi 20', lessons: 5, completed: 0 },
          { id: 3, title: 'Phép cộng trừ có nhớ', lessons: 5, completed: 0 }
        ]
      },
      {
        id: 2,
        title: 'Tiếng Anh lớp 3 - Từ vựng cơ bản',
        subject: 'Tiếng Anh',
        grade: 'Lớp 3',
        description: 'Học từ vựng tiếng Anh cơ bản cho trẻ em',
        image: '🌍',
        color: 'green',
        lessons: 20,
        duration: '3 tuần',
        difficulty: 'Trung bình',
        progress: 25,
        chapters: [
          { id: 1, title: 'Gia đình và bạn bè', lessons: 6, completed: 2 },
          { id: 2, title: 'Màu sắc và số đếm', lessons: 7, completed: 1 },
          { id: 3, title: 'Động vật và thiên nhiên', lessons: 7, completed: 0 }
        ]
      },
      {
        id: 3,
        title: 'Khoa học lớp 4 - Thế giới tự nhiên',
        subject: 'Khoa học',
        grade: 'Lớp 4',
        description: 'Khám phá thế giới tự nhiên xung quanh',
        image: '🔬',
        color: 'purple',
        lessons: 18,
        duration: '4 tuần',
        difficulty: 'Trung bình',
        progress: 0,
        chapters: [
          { id: 1, title: 'Thực vật và động vật', lessons: 6, completed: 0 },
          { id: 2, title: 'Môi trường sống', lessons: 6, completed: 0 },
          { id: 3, title: 'Bảo vệ môi trường', lessons: 6, completed: 0 }
        ]
      }
    ];
    
    setTimeout(() => {
      setMaterials(mockMaterials);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMaterials = materials.filter(material => {
    const matchesGrade = selectedGrade === 'all' || material.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || material.subject === selectedSubject;
    return matchesGrade && matchesSubject;
  });

  const handleStartLearning = (materialId) => {
    const material = materials.find(m => m.id === materialId);
    setSelectedMaterial(material);
  };

  const handleCloseModal = () => {
    setSelectedMaterial(null);
  };

  return (
    <div className="materials-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📚</span>
            Học liệu cơ bản
          </h1>
          <p className="page-subtitle">
            Khám phá các khóa học và tài liệu học tập phù hợp với trình độ của bạn
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-container">
            <div className="filter-group">
              <label className="filter-label">Khối lớp:</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="Lớp 1">Lớp 1</option>
                <option value="Lớp 2">Lớp 2</option>
                <option value="Lớp 3">Lớp 3</option>
                <option value="Lớp 4">Lớp 4</option>
                <option value="Lớp 5">Lớp 5</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Môn học:</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="Toán">Toán</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Khoa học">Khoa học</option>
                <option value="Lịch sử">Lịch sử</option>
              </select>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="materials-section">
          <div className="section-header">
            <h2 className="section-title">Khóa học có sẵn</h2>
            <div className="results-count">
              {filteredMaterials.length} khóa học
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải học liệu...</p>
            </div>
          ) : (
            <div className="materials-grid">
              {filteredMaterials.map((material) => (
                <div key={material.id} className={`material-card material-card-${material.color}`}>
                  <div className="material-header">
                    <div className="material-image">
                      <span className="material-emoji">{material.image}</span>
                    </div>
                    <div className="material-info">
                      <h3 className="material-title">{material.title}</h3>
                      <div className="material-meta">
                        <span className="grade-badge">{material.grade}</span>
                        <span className="subject-badge">{material.subject}</span>
                        <span className={`difficulty-badge difficulty-${material.difficulty.toLowerCase()}`}>
                          {material.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="material-description">{material.description}</p>

                  <div className="material-stats">
                    <div className="stat-item">
                      <i className="fas fa-book"></i>
                      <span>{material.lessons} bài học</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-clock"></i>
                      <span>{material.duration}</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-chart-line"></i>
                      <span>{material.progress}% hoàn thành</span>
                    </div>
                  </div>

                  {material.progress > 0 && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${material.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{material.progress}%</span>
                    </div>
                  )}

                  <div className="material-actions">
                    <button 
                      className="start-btn"
                      onClick={() => handleStartLearning(material.id)}
                    >
                      <i className="fas fa-play"></i>
                      {material.progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
                    </button>
                    <button className="preview-btn">
                      <i className="fas fa-eye"></i>
                      Xem trước
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredMaterials.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">📚</div>
              <h3>Không có học liệu nào</h3>
              <p>Hãy thử thay đổi bộ lọc để tìm học liệu phù hợp</p>
            </div>
          )}
        </div>
      </div>

      {/* Material Detail Modal */}
      {selectedMaterial && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedMaterial.title}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="material-overview">
                <div className="overview-item">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{selectedMaterial.grade}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-book"></i>
                  <span>{selectedMaterial.subject}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-clock"></i>
                  <span>{selectedMaterial.duration}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-signal"></i>
                  <span>{selectedMaterial.difficulty}</span>
                </div>
              </div>

              <p className="modal-description">{selectedMaterial.description}</p>

              <div className="chapters-section">
                <h4 className="chapters-title">Nội dung khóa học</h4>
                <div className="chapters-list">
                  {selectedMaterial.chapters.map((chapter) => (
                    <div key={chapter.id} className="chapter-item">
                      <div className="chapter-info">
                        <h5 className="chapter-title">{chapter.title}</h5>
                        <span className="chapter-lessons">{chapter.lessons} bài học</span>
                      </div>
                      <div className="chapter-progress">
                        <div className="progress-circle">
                          <span>{chapter.completed}/{chapter.lessons}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="start-learning-btn">
                <i className="fas fa-play"></i>
                Bắt đầu học ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;


