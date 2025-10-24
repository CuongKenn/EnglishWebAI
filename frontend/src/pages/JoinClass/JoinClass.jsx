import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useClasses } from '../../hooks';
import { classesAPI } from '../../services/api';
import './JoinClass.css';

const JoinClass = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  // Convert selectedGrade 'Lớp X' -> number for API
  const gradeNumber = selectedGrade && selectedGrade !== 'all' ? (selectedGrade.match(/\d+/)?.[0] || null) : null;
  const skillParam = selectedSkill !== 'all' ? selectedSkill : undefined;
  const { classes, loading, error, joinClass } = useClasses({ grade: gradeNumber || undefined, skill: skillParam });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  // Removed inline modal flow; navigate to class content page instead

  // Initialize grade filter from query string
  useEffect(() => {
    const q = params.get('grade');
    if (q) setSelectedGrade(q);
  }, [params]);

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || classItem.grade === selectedGrade;
    const matchesSkill = selectedSkill === 'all' || (classItem.skill || '').toLowerCase() === selectedSkill.toLowerCase();
    
    return matchesSearch && matchesGrade && matchesSkill;
  });

  const handleJoinClass = async (classId) => {
    try {
      // Cố gắng tham gia lớp; nếu đã tham gia hoặc có lỗi nhẹ vẫn điều hướng sang nội dung lớp
      try {
        await classesAPI.joinClass(classId);
      } catch (e) {
        // Bỏ qua lỗi "đã tham gia" hoặc tương tự; vẫn cho chuyển trang để xem nội dung nếu có quyền
      }
      navigate(`/class/${classId}/content`);
    } catch (err) {
      navigate(`/class/${classId}/content`);
    }
  };

  return (
    <div className="join-class-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title fade-in">
            <span className="title-icon">👥</span>
            Tham gia lớp học
          </h1>
          <p className="page-subtitle fade-in">
            Tìm và tham gia các lớp học phù hợp với trình độ của bạn
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Search and Filter Section */}
        <div className="search-filter-section slide-up">
          <div className="search-container">
            <div className="search-box">
              <i className="fas fa-search search-icon"></i>
              <input
                type="text"
                placeholder="Tìm kiếm lớp học, giáo viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <label className="filter-label">Khối lớp:</label>
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={`Lớp ${g}`}>{`Lớp ${g}`}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Kỹ năng:</label>
              <select 
                value={selectedSkill} 
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="listening">Listening</option>
                <option value="speaking">Speaking</option>
                <option value="reading">Reading</option>
                <option value="writing">Writing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="classes-section fade-in">
          <div className="section-header">
            <h2 className="section-title">Lớp học có sẵn</h2>
            <div className="results-count">
              {filteredClasses.length} lớp học
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách lớp học...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="classes-grid">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className={`class-card class-card-${classItem.color || 'blue'}`}>
                  <div className="class-header">
                    <div className="class-image">
                      <span className="class-emoji">{classItem.image || '📚'}</span>
                    </div>
                    <div className="class-info">
                      <h3 className="class-name">{classItem.name}</h3>
                      <p className="class-teacher">
                        <i className="fas fa-user"></i>
                        {classItem.teacher_name || 'Chưa có giáo viên'}
                      </p>
                    </div>
                  </div>

                  <div className="class-details">
                    <div className="detail-item">
                      <i className="fas fa-graduation-cap"></i>
                      <span>{classItem.grade || 'N/A'}</span>
                    </div>
                  <div className="detail-item">
                    <i className="fas fa-book"></i>
                    <span>{(classItem.skill ? (classItem.skill.charAt(0).toUpperCase() + classItem.skill.slice(1)) : 'N/A')}</span>
                  </div>
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span>{classItem.schedule || 'Chưa có lịch học'}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-users"></i>
                      <span>{classItem.students || 0}/{classItem.maxStudents || classItem.max_students || 30} học sinh</span>
                    </div>
                  </div>

                  <p className="class-description">{classItem.description || 'Không có mô tả'}</p>

                  <div className="class-actions">
                    <button 
                      className="join-btn"
                      onClick={() => handleJoinClass(classItem.id)}
                    >
                      <i className="fas fa-plus"></i>
                      Tham gia
                    </button>
                    <button className="info-btn">
                      <i className="fas fa-info-circle"></i>
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredClasses.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Không tìm thấy lớp học nào</h3>
              <p>Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
      </div>
    </div>

  </div>
  );
};

export default JoinClass;
