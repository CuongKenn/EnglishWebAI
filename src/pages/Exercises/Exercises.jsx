import React, { useState, useEffect } from 'react';
import './Exercises.css';

const Exercises = () => {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // Mock data
  useEffect(() => {
    const mockExercises = [
      {
        id: 1,
        title: 'Phép cộng trong phạm vi 20',
        subject: 'Toán',
        grade: 'Lớp 2',
        difficulty: 'Dễ',
        questions: 10,
        timeLimit: 15,
        description: 'Luyện tập phép cộng cơ bản từ 1-20',
        image: '➕',
        color: 'blue',
        completed: false,
        score: null
      },
      {
        id: 2,
        title: 'Từ vựng tiếng Anh - Gia đình',
        subject: 'Tiếng Anh',
        grade: 'Lớp 3',
        difficulty: 'Trung bình',
        questions: 15,
        timeLimit: 20,
        description: 'Học từ vựng về các thành viên trong gia đình',
        image: '👨‍👩‍👧‍👦',
        color: 'green',
        completed: true,
        score: 85
      },
      {
        id: 3,
        title: 'Thực vật và động vật',
        subject: 'Khoa học',
        grade: 'Lớp 4',
        difficulty: 'Trung bình',
        questions: 12,
        timeLimit: 18,
        description: 'Khám phá thế giới thực vật và động vật',
        image: '🌱',
        color: 'purple',
        completed: false,
        score: null
      }
    ];
    
    setTimeout(() => {
      setExercises(mockExercises);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSubject = selectedSubject === 'all' || exercise.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || exercise.grade === selectedGrade;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
    
    return matchesSubject && matchesGrade && matchesDifficulty;
  });

  const handleStartExercise = (exerciseId) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    setSelectedExercise(exercise);
  };

  const handleCloseModal = () => {
    setSelectedExercise(null);
  };

  const handleStartQuiz = () => {
    alert(`Bắt đầu làm bài: ${selectedExercise.title}`);
    handleCloseModal();
  };

  return (
    <div className="exercises-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">✏️</span>
            Làm bài tập
          </h1>
          <p className="page-subtitle">
            Luyện tập và kiểm tra kiến thức với các bài tập đa dạng
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-container">
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
              <label className="filter-label">Độ khó:</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả</option>
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khó">Khó</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exercises Grid */}
        <div className="exercises-section">
          <div className="section-header">
            <h2 className="section-title">Bài tập có sẵn</h2>
            <div className="results-count">
              {filteredExercises.length} bài tập
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải bài tập...</p>
            </div>
          ) : (
            <div className="exercises-grid">
              {filteredExercises.map((exercise) => (
                <div key={exercise.id} className={`exercise-card exercise-card-${exercise.color}`}>
                  <div className="exercise-header">
                    <div className="exercise-image">
                      <span className="exercise-emoji">{exercise.image}</span>
                    </div>
                    <div className="exercise-info">
                      <h3 className="exercise-title">{exercise.title}</h3>
                      <div className="exercise-meta">
                        <span className="subject-badge">{exercise.subject}</span>
                        <span className="grade-badge">{exercise.grade}</span>
                        <span className={`difficulty-badge difficulty-${exercise.difficulty.toLowerCase()}`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="exercise-description">{exercise.description}</p>

                  <div className="exercise-stats">
                    <div className="stat-item">
                      <i className="fas fa-question-circle"></i>
                      <span>{exercise.questions} câu hỏi</span>
                    </div>
                    <div className="stat-item">
                      <i className="fas fa-clock"></i>
                      <span>{exercise.timeLimit} phút</span>
                    </div>
                    {exercise.completed && (
                      <div className="stat-item">
                        <i className="fas fa-trophy"></i>
                        <span>{exercise.score}% điểm</span>
                      </div>
                    )}
                  </div>

                  {exercise.completed && (
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${exercise.score}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">Đã hoàn thành: {exercise.score}%</span>
                    </div>
                  )}

                  <div className="exercise-actions">
                    <button 
                      className="start-btn"
                      onClick={() => handleStartExercise(exercise.id)}
                    >
                      <i className="fas fa-play"></i>
                      {exercise.completed ? 'Làm lại' : 'Bắt đầu'}
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

          {!loading && filteredExercises.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">✏️</div>
              <h3>Không có bài tập nào</h3>
              <p>Hãy thử thay đổi bộ lọc để tìm bài tập phù hợp</p>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedExercise.title}</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="exercise-overview">
                <div className="overview-item">
                  <i className="fas fa-book"></i>
                  <span>{selectedExercise.subject}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-graduation-cap"></i>
                  <span>{selectedExercise.grade}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-signal"></i>
                  <span>{selectedExercise.difficulty}</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-question-circle"></i>
                  <span>{selectedExercise.questions} câu hỏi</span>
                </div>
                <div className="overview-item">
                  <i className="fas fa-clock"></i>
                  <span>{selectedExercise.timeLimit} phút</span>
                </div>
              </div>

              <p className="modal-description">{selectedExercise.description}</p>

              <div className="instructions-section">
                <h4 className="instructions-title">Hướng dẫn làm bài:</h4>
                <ul className="instructions-list">
                  <li>Đọc kỹ câu hỏi trước khi trả lời</li>
                  <li>Bạn có thể bỏ qua câu hỏi khó và quay lại sau</li>
                  <li>Kiểm tra lại đáp án trước khi nộp bài</li>
                  <li>Thời gian làm bài: {selectedExercise.timeLimit} phút</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="start-exercise-btn" onClick={handleStartQuiz}>
                <i className="fas fa-play"></i>
                Bắt đầu làm bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exercises;


